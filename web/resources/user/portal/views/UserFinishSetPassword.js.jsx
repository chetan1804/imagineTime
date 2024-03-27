/**
 * View component for /user/finish/set-password
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

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import ProgressDots from '../../../../global/components/helpers/ProgressDots.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import resource components
import UserLayout from '../../components/UserLayout.js.jsx';
import UserFinishPasswordForm from '../components/UserFinishPasswordForm.js.jsx';

// import actions
import * as userActions from '../../userActions'; 

class UserFinishSetPassword extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
      , isErrorModalOpen: false
      , onBoardedProgress: {}
      , password: ''
      , submitting: false
      , totalSteps: null
    };
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
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
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(e) {
    e.preventDefault();
    const { dispatch, history, match, loggedInUser } = this.props;
    this.setState({submitting: true});
    this.setState({
      submitting: false
    });

    // TODO: Send the correct action here. TBD on how were going to handle this on the server.

    // Update password
    dispatch(userActions.sendChangePassword(this.state.password, this.state.password, null, loggedInUser._id)).then((action) => {
      this.setState({submitting: false});
      if(action.success) {
        history.push(`/user/finish/review-personal/${match.params.clientId}`)
      } else {
        this.setState({errorMessage: action.error});
        this._toggleErrorModal();
      }
    })
  }

  _toggleErrorModal() {
    this.setState({isErrorModalOpen: !this.state.isErrorModalOpen});
  }

  render() {
    const { loggedInUser, match, userStore } = this.props;
    const { password } = this.state;
    
    const isEmpty = (
      !loggedInUser
      || !loggedInUser._id
    )
    const isFetching = (
      !userStore
      || !userStore.loggedIn
      || userStore.loggedIn.isFetching
    )

    let firmLogo = brandingName.image.logoWhite;
    return (
      <UserLayout>
      { isEmpty ?
        (isFetching ?
        <div className="-loading-hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div>
        : <div>Empty.</div>
        )
        :
        <div style={{height: '100vh'}} className="yt-row center-vert">
          <div style={{height: '80%'}} className="yt-col _50">
            <div className="yt-container user-finish -left-side">
              <ProgressDots
                currentStep={2}
                totalSteps={this.state.totalSteps}
              />
              <UserFinishPasswordForm
                cancelLink={`/user/finish/review-personal/${match.params.clientId}`}
                handleFormChange={this._handleFormChange}
                handleFormSubmit={this._handleFormSubmit} 
                password={password}
              />
            </div>
          </div>
          <div style={{backgroundColor: "black", height: '100%'}} className="yt-col _50">
            <div style={{justifyContent: 'center', height: '100%'}} className="yt-row center-vert">
              <img src={firmLogo}/>
            </div>
          </div>
        </div>
      }
      <AlertModal
        alertMessage={this.state.errorMessage}
        alertTitle="Error with sign in"
        closeAction={() => this.setState({isErrorModalOpen: false})}
        confirmAction={() => this.setState({isErrorModalOpen: false})}
        confirmText="Try again"
        // declineText="Reset Password"
        // declineAction={this._toggleErrorModal}
        isOpen={this.state.isErrorModalOpen}
        type="danger"
      />
      </UserLayout>
    )
  }
}

UserFinishSetPassword.propTypes = {
  dispatch: PropTypes.func.isRequired
}

UserFinishSetPassword.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(UserFinishSetPassword)
);
