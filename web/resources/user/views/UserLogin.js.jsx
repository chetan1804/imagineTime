/**
 * View component for /user/login
 *
 * On render cycle this component checks to see if the redirectToReferrer boolean
 * is true (flipped on successful login).  If true, send the user back to the
 * referring page.  If false, show user login form.
 *
 * NOTE: upon reaching this page, user can toggle between /user/login and
 * /user/register without changing the original referring source route.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

import axios from 'axios';

// import actions actions
import * as firmActions from '../../firm/firmActions';
import * as userActions from '../userActions';

// import form components
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import brandingName from '../../../global/enum/brandingName.js.jsx';

// import user components
import UserLayout from '../components/UserLayout.js.jsx';
import UserLoginForm from '../components/UserLoginForm.js.jsx';
import UserTermsServicesModal from '../components/UserTermsServicesModal.js.jsx';
import UserQRCodeModal from '../components/UserQRCodeModal.js.jsx';

import { Helmet } from 'react-helmet';

class UserLogin extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
      , isErrorModalOpen: false
      , magicLinkSent: false 
      , redirectToReferrer: false
      , user: {
        username: ''
        , password: ''
      }
      , userTermsServiceModalOpen: false
      , msalInstance: null
      , userQRCodeModalOpen: false
      , qrCodeUrl: ''
      , tempSecret: ''
      , tempUser: {}
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_goToResetPass'
      , '_sendMagicLink'
      , '_nextToLogin'
      , '_handleMSAuthCallback'
      , '_handleVerifyToken'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    localStorage.clear();
    dispatch(firmActions.fetchSingleFirmByDomain());
  }

  componentWillReceiveProps(nextProps) {
    this.setState(nextProps);
    if(nextProps.status === "error") {
      alert(nextProps.error.message);
    }
  }

  _handleFormChange(e) {
    var nextState = this.state.user;
    nextState[e.target.name] = e.target.value;
    this.setState(nextState);
  }

  _nextToLogin() {
    const { dispatch, history } = this.props;

    dispatch(userActions.sendForgotPassword(this.state.username, true)).then((action) => {
      console.log("forgot password", action);
      if(action.success && action.data && action.data.hex) {
        // this.setState({isSuccessModalOpen: true});
        const hex = action.data.hex;
        history.push('/user/reset-password/' + hex);
      }
    })
  }

  _handleFormSubmit(e) {
    e.preventDefault();
    const { dispatch, history, location } = this.props;
    dispatch(userActions.sendLogin(this.state.username, this.state.password, 'main')).then((action) => {
      console.log("Im here here here");
      console.log("action action", action);
      if(action.success) {
        //enable 2fa
        console.log("login action", action);

        if(!!action.user.enable_2fa) {
          this.setState({
            qrCodeUrl: action.user.qrcode_data
            , tempSecret: action.user.secret_2fa
            , userQRCodeModalOpen: true 
            , tempUser: action.user
          });
        } else {
          if(location.state.from) {
            this.setState({redirectToReferrer: true});
          } else {
            history.push({
              pathname: '/',
              search: window.location.search
            });
          }
        }
      } else {
        const currUser = action.user ? action.user : {}
        if(action.error != "user-first-login") {
          this.setState({
            errorMessage: action.error
            , isErrorModalOpen: true
          });
        } else {
          if(currUser.isStaff) {
            this.setState({
              userTermsServiceModalOpen: true
            })
          } else {
            this._nextToLogin();
          }
        }
      }
    })
  }

  _sendMagicLink() {
    const { dispatch } = this.props;
    dispatch(userActions.sendMagicLink(this.state.username)).then((action) => {
      if(action.success) {
        this.setState({magicLinkSent: true})
      } else {
        this.setState({
          errorMessage: action.error
          , isErrorModalOpen: true
        });
      }
    })
  }

  _goToResetPass() {
    const { history } = this.props;
    console.log('go to reset password'); 
    history.push('/user/forgot-password')
  }

  _handleMSAuthCallback(err, data, msal) {

    const { msalInstance } = this.state;

    if(msalInstance) return;

    const { dispatch, history, location } = this.props;

    if(data && data.account) {

      this.setState({msalInstance: msal});

      const msAccount = data.account;

      dispatch(userActions.sendLoginMSAccount(msAccount.userName, msAccount.accountIdentifier)).then((action) => {
        
        if(action.success) {

          if(!!action.user.enable_2fa) {
            this.setState({
              qrCodeUrl: action.user.qrcode_data
              , tempSecret: action.user.secret_2fa
              , userQRCodeModalOpen: true 
              , tempUser: action.user
            });
          } else {
            if(location.state.from) {
              this.setState({redirectToReferrer: true});
            } else {
              history.push({
                pathname: '/',
                search: window.location.search
              });
            }
          }

          // if(location.state.from) {
          //   this.setState({redirectToReferrer: true});
          // } else {
          //   history.push('/');
          // }
        } else {          
          localStorage.clear();
          const currUser = action.user ? action.user : {}
          if(action.error != "user-first-login") {
            // console.log('time to logout');

            if(msal) {
              this.setState({msalInstance: null});
            }

            this.setState({
              errorMessage: action.error ? action.error : 'Unable to login' 
              , isErrorModalOpen: true
            });
          } else {
            if(currUser.isStaff) {
              this.setState({
                userTermsServiceModalOpen: true
              })
            } else {
              this._nextToLogin();
            }
          }
        }
      })
    }
  }

  _handleVerifyToken(token) {

    console.log('this is the token', token);
    console.log('this is the secret', this.state.tempSecret);

    const { history, location } = this.props;

    axios({
      method: 'POST',
      url: '/api/users/verify-2fatoken',
      data: {
        user: this.state.tempUser,
        token: token
      }
    })
    .then(({ data }) => {
      console.log("verify api", data);

      if(data.success) {
        this.setState({userQRCodeModalOpen: false});
        if(location.state.from) {
          this.setState({redirectToReferrer: true});
        } else {
          history.push({
            pathname: '/',
            search: window.location.search
          });
        }
      } else {
        alert('Invalid OTP')
      }
    })
    .catch((err) => {
      console.log(err);
      console.log('failed to authorize 2fa');
    })
  }

  render() {
    const { firmStore } = this.props;
    const { from } = this.props.location.state || { from: { pathname: '/' } }
    const { redirectToReferrer, user } = this.state;

    const selectedFirm = firmStore.selected.getItem();

    const firmEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const firmFetching = (
      firmStore.selected.isFetching
    )

    const logoUrl = selectedFirm
                    && selectedFirm._id
                    && selectedFirm.logoUrl 
                    && `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`
                    ; 
    
    const firmLogo = brandingName.image.logoBlack;
    
    if(redirectToReferrer) {
      return (
        <Redirect to={from} />
      )
    } else {
      return  (
        <UserLayout>
          <Helmet><title>Login to {selectedFirm ? selectedFirm.name : brandingName.title}</title></Helmet>
          <div className="yt-container">
            <div className="yt-row center-horiz">
              { firmEmpty ?
                (firmFetching ? 
                  <div className="-loading-hero hero">
                    <div className="u-centerText">
                      <div className="loading"></div>
                    </div>
                  </div>  
                  : 
                  <UserLoginForm
                    user={user}
                    handleFormSubmit={this._handleFormSubmit}
                    handleFormChange={this._handleFormChange}
                    location={this.props.location}
                    logoUrl={firmLogo}
                    magicLinkSent={this.state.magicLinkSent}
                    sendMagicLink={this._sendMagicLink}
                    handleMSAuthCallback={this._handleMSAuthCallback}
                    selectedFirm={selectedFirm}
                  />
                )
                :
                <UserLoginForm
                  user={user}
                  handleFormSubmit={this._handleFormSubmit}
                  handleFormChange={this._handleFormChange}
                  location={this.props.location}
                  logoUrl={logoUrl || firmLogo}
                  magicLinkSent={this.state.magicLinkSent}
                  sendMagicLink={this._sendMagicLink}
                  showPoweredBy={true}
                  handleMSAuthCallback={this._handleMSAuthCallback}
                  selectedFirm={selectedFirm}
                />
              }
            </div>
            <AlertModal
              alertMessage={this.state.errorMessage}
              alertTitle="Error with sign in"
              closeAction={() => this.setState({isErrorModalOpen: false})}
              confirmAction={() => this.setState({isErrorModalOpen: false})}
              confirmText="Try again"
              declineText="Reset Password"
              declineAction={this._goToResetPass}
              isOpen={this.state.isErrorModalOpen}
              type="danger"
            />
            <UserTermsServicesModal
              close={() => this.setState({userTermsServiceModalOpen: false})}
              isOpen={this.state.userTermsServiceModalOpen}
              acceptTermsService={this._nextToLogin}
            />
            <UserQRCodeModal
              close={() => this.setState({userQRCodeModalOpen: false})}
              isOpen={this.state.userQRCodeModalOpen}
              acceptTermsService={() => {}}
              url={this.state.qrCodeUrl}
              handleVerifyToken={this._handleVerifyToken}
            />
          </div>
        </UserLayout>
      )
    }
  }
}

UserLogin.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(UserLogin)
);
