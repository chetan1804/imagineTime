/**
 * View for /user/finish/review-personal
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries

// import actions
import * as clientActions from '../../../client/clientActions';

// import utils
import { onBoardUtils } from '../../../../global/utils/index';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as userActions from '../../../user/userActions';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import ProgressDots from '../../../../global/components/helpers/ProgressDots.js.jsx';

// import resource components
import UserLayout from '../../components/UserLayout.js.jsx';
import UserReviewPersonalForm from '../components/UserReviewPersonalForm.js.jsx';


class UserFinishReviewPersonal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      address: null
      , errorMessage: ''
      , isErrorModalOpen: false
      , onBoardedProgress: {}
      , phoneNumber: null
      , submitting: false
      , totalSteps: null
      , user: props.loggedInUser ? _.cloneDeep(props.loggedInUser) : null
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_toggleErrorModal'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    // fire actions

    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        const client = clientRes.item
        const onBoardedProgress = onBoardUtils.getOnBoardedProgress(loggedInUser, client)
        this.setState({
          onBoardedProgress: onBoardedProgress
          , totalSteps: Object.keys(onBoardedProgress).length
        })
      }
    })

    // if the user has a primary address, fetch it. Otherwise fetch the default.
    if(loggedInUser._primaryAddress) {
      dispatch(addressActions.fetchSingleIfNeeded(loggedInUser._primaryAddress)).then(addressRes => {
        if(addressRes.success) {
          this.setState({
            address: _.cloneDeep(addressRes.item)
          })
        }
      })
    } else {
      dispatch(addressActions.fetchDefaultAddress()).then(defaultAddressRes => {
        if(defaultAddressRes.success) {
          // set the user on the blank address object.
          let newAddress = _.cloneDeep(defaultAddressRes.defaultObj)
          newAddress._user = loggedInUser._id
          this.setState({
            address: _.cloneDeep(defaultAddressRes.defaultObj)
          });
        }
      })
    }
    // if the user has a primary phoneNumber, fetch it. Otherwise fetch the default.
    if(loggedInUser._primaryPhone) {
      dispatch(phoneNumberActions.fetchSingleIfNeeded(loggedInUser._primaryPhone)).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this.setState({
            phoneNumber: _.cloneDeep(phoneNumberRes.item)
          });
        }
      })
    } else {
      dispatch(phoneNumberActions.fetchDefaultPhoneNumber()).then(defaultPhoneRes => {
        if(defaultPhoneRes.success) {
          // set the user on the blank phone number object.
          let newPhoneNumber = _.cloneDeep(defaultPhoneRes.defaultObj)
          newPhoneNumber._user = loggedInUser._id
          this.setState({
            phoneNumber: _.cloneDeep(newPhoneNumber)
          });
        }
      })
    }
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    e.preventDefault();
    this.setState({submitting: true});
    /**
     * NOTE: Everything that applies to UserFinishReviewAccountModal applies here. Check that view for more info.
     */
    this._handleSaveAddress();
  }

  _toggleErrorModal() {
    this.setState({isErrorModalOpen: !this.state.isErrorModalOpen});
  }

  _handleSaveAddress() {
    // console.log('Saving address')
    const { dispatch, loggedInUser } = this.props;
    const { address } = this.state;
    // Check if we need to sendUpdate or sendCreate for this resource.
    if(address._id) {
      // address has an id so it must have already existed. Send update.
      dispatch(addressActions.sendUpdateAddress(address)).then(addressRes => {
        if(addressRes.success) {
          this._handleSavePhoneNumber(addressRes.item._id)
        } else {
          this.setState({errorMessage: addressRes.error});
          this._toggleErrorModal();
        }
      })
    } else if(
      address && (
        address.city
        || address.country
        || address.postal
        || address.state
        || address.street1
      )
      ) {
      // address is new and has at least SOME data. Send create.
      let newAddress = _.cloneDeep(address);
      newAddress._user = loggedInUser._id
      dispatch(addressActions.sendCreateAddress(newAddress)).then(addressRes => {
        if(addressRes.success) {
          this._handleSavePhoneNumber(addressRes.item._id)
        } else {
          this.setState({errorMessage: addressRes.error});
          this._toggleErrorModal();
        }
      })
    } else {
      // No address info was entered.
      this._handleSavePhoneNumber(null)
    }
  }

  _handleSavePhoneNumber(addressId) {
    // console.log('Saving phone. AddressId is: ', addressId)
    const { dispatch, loggedInUser } = this.props;
    const { phoneNumber } = this.state;
    // Check if we need to sendUpdate or sendCreate for this resource.
    if(phoneNumber._id) {
      // phoneNumber has an id so it must have already existed. Send update.
      dispatch(phoneNumberActions.sendUpdatePhoneNumber(phoneNumber)).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this._handleSaveUser(addressId, phoneNumberRes.item._id)
        } else {
          this.setState({errorMessage: phoneNumberRes.error});
          this._toggleErrorModal();
        }
      })
    } else if(phoneNumber && phoneNumber.number) {
      // phoneNumber is new. Send create.
      let newPhoneNumber = _.cloneDeep(phoneNumber);
      newPhoneNumber._user = loggedInUser._id
      dispatch(phoneNumberActions.sendCreatePhoneNumber(newPhoneNumber)).then(phoneNumberRes => {
        if(phoneNumberRes.success) {
          this._handleSaveUser(addressId, phoneNumberRes.item._id)
        } else {
          this.setState({errorMessage: phoneNumberRes.error});
          this._toggleErrorModal();
        }
      })
    } else {
      // No phone number was entered.
      this._handleSaveUser(addressId, null)
    }
  }

  _handleSaveUser(addressId, phoneNumberId) {
    // console.log('Saving user.  ', phoneNumberId, addressId)
    const { dispatch, history, match } = this.props;
    const { user } = this.state;
    let newUser = _.cloneDeep(user);
    // check if we need to save primaryAddress or primaryPhone on user.
    if(!newUser._primaryAddress && addressId) {
      newUser._primaryAddress = addressId
    }
    if(!newUser._primaryPhone && phoneNumberId) {
      newUser._primaryPhone = phoneNumberId
    }
    // NOTE: Since the user is not required to finish onboarding all at once, there is a check on
    // the update method on the controller that sets onBoarded if all conditions are met.
    dispatch(userActions.sendUpdateProfile(newUser)).then(userRes => {
      if(userRes.success) {
        this.setState({
          submitting: false
        }, () => history.push(`/user/finish/review-account/${match.params.clientId}`))
      } else {
        this.setState({errorMessage: userRes.error});
        this._toggleErrorModal();
      }
    });
  }

  
  render() {
    const {
      userStore
    } = this.props;
    const {
      address
      , phoneNumber
      , user
    } = this.state;

    const isEmpty = (
      !address
      || !user
      || !phoneNumber
    )

    const isFetching = (
      !userStore
      || !userStore.loggedIn
      || userStore.loggedIn.isFetching
      || !this.state.totalSteps
    )

    return (
      <UserLayout>
      { isFetching ?
        <div className="-loading-hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div>
        :
        isEmpty ?
        <div>Empty.</div>
        :
        <div style={{height: '100vh'}} className="yt-row center-vert">
          <div style={{height: '80%'}} className="yt-col full">
            <div className="yt-container user-finish">
              <ProgressDots
                currentStep={2}
                totalSteps={3}
              />
              <UserReviewPersonalForm
                address={address}
                handleFormChange={this._handleFormChange}
                handleFormSubmit={this._handleFormSubmit}
                phoneNumber={phoneNumber}
                submitting={this.state.submitting}
                user={user}
              />
            </div>
          </div>
          <AlertModal
            alertMessage={
              <div>
                <strong>
                  {this.state.errorMessage}
                </strong>
                <br/>
                <div>Please try again.</div>
              </div>
            }
            alertTitle="Error"
            closeAction={this._toggleErrorModal}
            confirmAction={this._toggleErrorModal}
            confirmText="Try again"
            isOpen={this.state.isErrorModalOpen}
            type="danger"
          />
        </div>
      }
      </UserLayout>
    )
  }
}

UserFinishReviewPersonal.propTypes = {
  dispatch: PropTypes.func.isRequired
}

UserFinishReviewPersonal.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address
    , clientStore: store.client
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(UserFinishReviewPersonal)
);
