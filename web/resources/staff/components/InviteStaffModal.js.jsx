/**
 * Resuable modal component for inviting new stafff members to a firm. 
 *
 * Creates a new staff from a copy of the defaultItem in the staff reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as staffActions from '../staffActions';
import * as userActions from '../../user/userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Modal from '../../../global/components/modals/Modal.js.jsx';
import { 
  CheckboxInput
  , EmailInput 
  , TextAreaInput
  , TextInput  
} from '../../../global/components/forms';
import brandingName from '../../../global/enum/brandingName.js.jsx';

// import utils
import { inviteUtils } from '../../../global/utils'
import StaffInviteForm from './StaffInviteForm.js.jsx';

class InviteStaffModal extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      invitations: [
        { email: ''
          , firstname: ''
          , lastname: ''
          , owner: false 
        }
      ] 
      , personalNote: ''
      , previewModal: false 
      , responseData: null 
      , submitting: false
    }
    this._bind(
      '_addInvitation'
      , '_handleClose'
      , '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleInvitationChange'
      , '_removeInvitation'
    );
  }

  _addInvitation() {
    let newInvites = _.cloneDeep(this.state.invitations)
    newInvites.push({ 
      email: ''
      , firstname: ''
      , lastname: ''
      , owner: false 
    })
    this.setState({invitations: newInvites});
  }

  _handleClose() {
    this.setState({
      invitations: [
        { email: ''
          , firstname: ''
          , lastname: ''
          , fullname: ''
          , owner: false 
        }
      ] 
      , personalNote: ''
      , responseData: null 
      , submitting: false
    })
    this.props.close();
  }

  _handleInvitationChange(e, index) {
    let newInvitations = _.cloneDeep(this.state.invitations);
    newInvitations[index][e.target.name] = e.target.value;
    this.setState({invitations: newInvitations});
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    
    this.setState(newState);
  }


  _handleFormSubmit() {
    const { close, dispatch, firm } = this.props;

    let newInvitations = _.cloneDeep(this.state.invitations);

    this.setState({submitting: true})
    // TODO: make this part of the form mimicking basecamp 
    let sendData = {
      invitations: inviteUtils.separateFullName("arr", newInvitations)
      , personalNote: this.state.personalNote 
    }

    dispatch(staffActions.sendInviteStaff(firm._id, sendData)).then(staffRes => {
      if(staffRes.success) {
        dispatch(staffActions.invalidateList('_firm', firm._id));
        dispatch(userActions.invalidateList('_firmStaff', firm._id)); // refetches staff user objects
        dispatch(userActions.fetchListIfNeeded('_firmStaff', firm._id)); 
        this.setState({
          responseData: staffRes.data
        })
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  _removeInvitation(index) {
    let newInvitations = _.cloneDeep(this.state.invitations);
    newInvitations.splice(index, 1);
    this.setState({invitations: newInvitations});
  }

  render() {
    const { firm, isOpen, loggedInUser, maxInvites } = this.props;
    const { responseData, invitations, personalNote, submitting } = this.state;
    const invitesComplete = inviteUtils.checkInvitesComplete(this.state.invitations)
    let firmLogo = brandingName.image.logoBlack;
    
    return (
      <Modal
        cardSize="large"
        closeAction={this._handleClose}
        isOpen={isOpen}
        modalHeader={`Invite staff members to ${firm.name}`}
        showButtons={responseData ? true : false}
      >
        { !responseData ? 
          <div className="">
            <div className="-form-step"><span className="-num">1</span> Who would you like to invite?</div>
            { invitations.map((invite, i) => 
              <StaffInviteForm
                change={this._handleInvitationChange}
                index={i}
                invite={invite}
                key={i}
                remove={this._removeInvitation}
              />
            )}
            { invitations.length < maxInvites ? 
              <button className="yt-btn link small" onClick={this._addInvitation}>Add another invitation</button>
              :
              <em>You have reached the maximum number of invitations</em>
            }
            <div className="-form-step"><span className="-num">2</span> Add a personal note to the invitation email (optional)</div>
            <TextAreaInput
              autoFocus={false}
              change={this._handleFormChange}
              name="personalNote"
              required={false}
              rows="2"
              value={personalNote}
            />
            <div className="-form-step"><span className="-num">3</span> Preview and send email</div>
            <button className="yt-btn link" onClick={() => this.setState({previewModal: true})}>Preview email</button>
            <button className="yt-btn" onClick={this._handleFormSubmit} disabled={!invitesComplete || submitting}>
              { submitting ? 
                <span><i className="far fa-spinner fa-spin"/> Sending...</span>
                :
                <span><i className="fal fa-paper-plane"/> Send now</span>
              }
            </button>
          </div>
          : 
          <div className="table-wrapper -invitation-results">
            <h3>Invitation Results</h3>
            <p><strong>Emails submitted: </strong> {responseData.results.length}</p>
            <p><strong>Invitations sent: </strong> {responseData.stats.successfulInvites}</p>
            <p><strong>Existing Staff Members: </strong> {responseData.stats.existingStaff}</p>
            <p><strong>Errors: </strong> {responseData.stats.errors}</p>
            <table className="yt-table">
              <caption>{responseData.results.length} attempts</caption>
              <thead>
                <tr>
                  <th></th>
                  <th>Email</th>
                  <th>Result</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                { responseData.results.map((result,i) =>
                  <tr key={'result_' + i} >
                    <td>
                      { result.error ? 
                        <i className="u-danger fas fa-times-octogon"/>
                        : result.inviteSent ? 
                        <i className="u-success fas fa-check"/>
                        :
                        <i className="u-warning fas fa-exclamation-triangle"/>
                      }
                    </td>
                    <td>{result.email}</td>
                    <td>{result.result}</td>
                    <td>{result.error}</td>
                  </tr>
                )}
                { !responseData.results || responseData.results.length === 0 ?
                  <tr>
                    <td colSpan="3" className="u-centerText"><em>No results</em></td>
                  </tr>
                  :
                  null 
                } 
              </tbody>
            </table>
          </div>
        }
        <Modal
          closeAction={() => this.setState({previewModal: false })}
          isOpen={this.state.previewModal}
          modalHeader="Invitation email preview"
          showButtons={false}
        >
          <div className="invitation-preview">
            <div className="-preview-header">
              <p>From: {loggedInUser.firstname} {loggedInUser.lastname} ({brandingName.title})</p>
              <p>Subject: {loggedInUser.firstname} {loggedInUser.lastname} invited you to {brandingName.title} ({firm.name})</p>
              <p>To: Recipents</p>
              <p>Reply-To: {brandingName.email.noreply}</p>
            </div>
            <hr/>
            <div className="-preview-body">
              <div style={{maxWidth: "50%"}}>
                <img src={firmLogo} />
              </div>

              <h3>{_.startCase(loggedInUser.firstname)} invited you to join {firm.name} on {brandingName.title}!</h3>
              <div>
                <p>{_.startCase(loggedInUser.firstname)} added a note:</p>
                <div className="-personal-note">{!personalNote ? `(If you add a personal note, it'll go here}` : personalNote} </div>
              </div>
              <p>{brandingName.title} empowers teams to manage work, share tasks, track time & due dates, and generate insightful reports.</p>
              <p>It's really straightforward and easy to use! To join {_.startCase(loggedInUser.firstname)}, click this button:</p>
              <button className="yt-btn info">Join {_.startCase(loggedInUser.firstname)} in {brandingName.title}</button>
              <p>If you have any questions, just send {_.startCase(loggedInUser.firstname)} an <a href={`mailto:${loggedInUser.username}`}>email</a>.</p>
            </div>
          </div>
        </Modal>
      </Modal>
    )
  }
}

InviteStaffModal.propTypes = {
  close: PropTypes.func.isRequired
  , dispatch: PropTypes.func.isRequired
  , firm: PropTypes.object.isRequired 
  , isOpen: PropTypes.bool.isRequired
  , maxInvites: PropTypes.number
}

InviteStaffModal.defaultProps = {
  maxInvites: 1 
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
  )(InviteStaffModal)
);
