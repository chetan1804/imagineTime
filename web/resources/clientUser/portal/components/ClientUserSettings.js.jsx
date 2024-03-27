/**
 * View component for /portal/:clientId/account/me
 */
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';

// import form components
import { TextInput } from '../../../../global/components/forms';

// import utils
import { auth } from '../../../../global/utils';

// import actions
import * as clientUserActions from '../../clientUserActions';
import * as userActions from '../../../user/userActions'; 

class ClientUserSettings extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: ''
      , isEditingSecretQuestion: false
      , isErrorModalOpen: false
      // , loggedInClientUser: props.loggedInClientUser ? props.loggedInClientUser : null
      , newSharedSecretPrompt: ''
      , newSharedSecretAnswer: ''
    }
    this._bind(
      '_handleFormChange'
      , '_handleUpdateSecret'
      , '_toggleErrorModal'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser } = this.props; 
    dispatch(userActions.fetchSingleIfNeeded(loggedInUser._id)); 
  }

  // componentWillReceiveProps(nextProps) {
  //   const { loggedInClientUser } = nextProps;
  //   if(!this.props.loggedInClientUser || (this.props.loggedInClientUser._id != loggedInClientUser._id)) {
  //     this.setState({
  //       loggedInClientUser
  //     })
  //   }
  // }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleUpdateSecret() {
    const { dispatch, userStore } = this.props;
    const { newSharedSecretPrompt, newSharedSecretAnswer } = this.state;
    let selectedUser = userStore.selected.getItem(); 
    let newUser = _.cloneDeep(selectedUser);
    newUser.sharedSecretPrompt = newSharedSecretPrompt
    newUser.sharedSecretAnswer = auth.getHashFromString(_.snakeCase(newSharedSecretAnswer)) // Sanitize and hash before sending to the server.
    dispatch(userActions.sendUpdateSecretQuestion(selectedUser._id, null, newUser)).then(json => {
      if(!json.success) {
        this.setState({
          errorMessage: 'There was a problem updating your secret question. Please try again.'
        }, () => this._toggleErrorModal())
      }
    });
    this.setState({
      isEditingSecretQuestion: false
      , newSharedSecretPrompt: ''
      , newSharedSecretAnswer: ''
    })
  }

  _toggleErrorModal() {
    this.setState({isErrorModalOpen: !this.state.isErrorModalOpen});
  }

  render() {
    const { userStore } = this.props;
    let selectedUser = userStore.selected.getItem(); 

    const isEmpty = (
      !selectedUser
    )

    const isFetching = (
      !selectedUser
    )


    return (
      isEmpty ?
      (isFetching ? 
        <div className="-loading-hero">
          <div className="u-centerText">
            <div className="loading"></div>
          </div>
        </div> 
        :
        <h2>No clientUser found.</h2>
      )
      :
      <div className="-portal-content">
        <div className="-client-overview">
          <label>
            Shared Secret Question
            <small onClick={() => this.setState({isEditingSecretQuestion: true})} className="action-link -edit-button">
              Edit
            </small>
          </label>
          { !this.state.isEditingSecretQuestion ?
            <div>
            { selectedUser.sharedSecretPrompt ?
              <div>
                <p>{selectedUser.sharedSecretPrompt}</p>
                <input
                  style={{border: 0}}
                  disabled={true}
                  type="password"
                  value={"*******"}
                />
              </div>
              :
              <p>
                <em>No shared secret question set</em>
              </p>
            }
            </div>
            :
            <div className="yt-col m_50">
              <TextInput
                change={this._handleFormChange}
                name="newSharedSecretPrompt"
                placeholder="Shared question"
                required
                value={this.state.newSharedSecretPrompt}
              />
              <TextInput
                change={this._handleFormChange}
                helpText="Make sure the answer is something you both know"
                name="newSharedSecretAnswer"
                placeholder="Shared answer"
                required
                value={this.state.newSharedSecretAnswer}
              />
              <button onClick={() => this.setState({isEditingSecretQuestion: false, newSharedSecretPrompt: '', newSharedSecretAnswer: ''})} className="yt-btn danger link x-small">
                Cancel
              </button>
              <button onClick={this._handleUpdateSecret} disabled={!this.state.newSharedSecretAnswer || !this.state.newSharedSecretPrompt} className="yt-btn link info x-small">
                Save
              </button>
            </div>
          }
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
    )
  }
}

ClientUserSettings.propTypes = {
  dispatch: PropTypes.func.isRequired
}

ClientUserSettings.defaultProps = {
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientUserStore: store.clientUser
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
  }
}

export default withRouter(
  connect(
  mapStoreToProps
)(ClientUserSettings)
);
