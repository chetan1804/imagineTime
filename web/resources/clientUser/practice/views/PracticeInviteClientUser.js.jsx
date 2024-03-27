/**
 * View component for /firm/:firmId/clients/:clientId/contacts/invite
 * 
 * Creates a new clientUser from a copy of the defaultItem in the clientUser reducer.
 * 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { TextAreaInput } from '../../../../global/components/forms';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import utils
import { inviteUtils, routeUtils } from '../../../../global/utils';
import sortUtils from '../../../../global/utils/sortUtils.js';

// import staffClient components
import InviteClientUserForm from '../../components/InviteClientUserForm.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

class PracticeInviteClientUser extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      invitations: [
        { email: ''
          , firstname: ''
          , lastname: ''
          , fullname: ''
        }
      ] 
      , personalNote: ''
      , previewModal: false 
      , responseData: null
      , submitting: false
      , warningModal: false
    }
    this._bind(
      '_addInvitation'
      , '_handleClose'
      , '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleInvitationChange'
      , '_removeInvitation'
      , '_handleInvitationSelectChange'
      , '_handleChangeTypeInvitation'
    );

    this.invitationType = { 0: false };
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // dispatch(clientUserActions.fetchDefaultClientUser());
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded("_firm", match.params.firmId));
  }

  _addInvitation() {
    let newInvites = _.cloneDeep(this.state.invitations)
    newInvites.push({ 
      email: ''
      , firstname: ''
      , lastname: ''
      , fullname: ''
      , primary: false 
    });
    this.invitationType[newInvites.length-1] = this.invitationType[newInvites.length-2];
    this.setState({invitations: newInvites});
  }

  _handleClose() {
    const { history, match } = this.props;
    this.setState({
      invitations: [
        { email: ''
          , firstname: ''
          , lastname: ''
          , fullname: ''
          , primary: false
        }
      ] 
      , personalNote: ''
      , responseData: null 
      , submitting: false
    }, () => history.push(`/firm/${match.params.firmId}/clients/${match.params.clientId}/contacts`));
  }

  _handleInvitationChange(e, index) {
    let newInvitations = _.cloneDeep(this.state.invitations);
    newInvitations[index][e.target.name] = e.target.value;
    this.setState({invitations: newInvitations});
  }

  _handleInvitationSelectChange(user, index) {
    let newInvitations = _.cloneDeep(this.state.invitations);
    newInvitations[index]["email"] = user.username;
    newInvitations[index]["firstname"] = user.firstname;
    newInvitations[index]["lastname"] = user.lastname;
    this.setState({invitations: newInvitations});
  }

  _removeInvitation(index) {
    let newInvitations = _.cloneDeep(this.state.invitations);
    newInvitations.splice(index, 1);
    if (!index) {
      this.invitationType = {};      
    } else {
      delete this.invitationType[index];
    }
    this.setState({invitations: newInvitations});
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      console.log(e.target.name, e.target.value)
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleFormSubmit(uploadOnly) {
    const { dispatch, match, clientStore, cloneDeep } = this.props;
    const clientId = match.params.clientId;

    this.setState({submitting: true, warningModal: false });
    // TODO: make this part of the form mimicking basecamp 

    let newInvitations = _.cloneDeep(this.state.invitations);
    newInvitations = newInvitations.map(invitation => {
      invitation["uploadOnly"] = uploadOnly;
      return invitation;
    });

    // separate fullname to first and last name
    const sendData = {
      invitations: inviteUtils.separateFullName("arr", newInvitations) // newInvitations
      , personalNote: this.state.personalNote 
      , firmId: match.params.firmId
    }

    dispatch(clientUserActions.sendInviteClientUsers(clientId, sendData)).then(clientUserRes => {
      if(clientUserRes.success) {
        dispatch(clientUserActions.invalidateList('_client', clientId));
        dispatch(userActions.invalidateList('_client', clientId)); // refetches staff user objects

        const responseData = clientUserRes.data;
        this.setState({
          responseData: {
            results: [...responseData.results],
            stats: {...responseData.stats}
          }
          , warningModal: false
        })

        if (!clientStore.byId[clientId]._primaryContact) {
          let newClient = _.cloneDeep(clientStore.selected.getItem());
          newClient._primaryContact = clientUserRes.data.results[0].user._id;
          dispatch(clientActions.sendUpdateClient(newClient));
        }
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  _handleChangeTypeInvitation(type, index) {
    this.invitationType[index] = !type;

    if (type) {
      let newInvitations = _.cloneDeep(this.state.invitations);
      newInvitations[index]["email"] = "";
      newInvitations[index]["firstname"] = "";
      newInvitations[index]["lastname"] = "";
      newInvitations[index]["primary"] = false;
      this.setState({invitations: newInvitations});      
    }
  }

  _handleSetPrimary(index) {
    let invitations = _.cloneDeep(this.state.invitations);
    invitations = invitations.map((item, i) => {
      if (i === index) {
        item.primary = !item.primary;
      } else {
        item.primary = false;
      }
      return item;
    });
    this.setState({ invitations });
  }
  
  render() {
    const { clientStore, firmStore, loggedInUser, userStore, userListItems } = this.props;
    const { responseData, invitations, personalNote, submitting, warningModal } = this.state;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    let firmLogo = brandingName.image.logoBlack;
    if(loggedInUser && selectedFirm && selectedFirm.logoUrl) {
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`;
    }

    const isEmpty = (
      !selectedClient
      || !userListItems
    );
    const isFetching = (
      !clientStore
      || !clientStore.selected
      || clientStore.selected.isFetching
      || !firmStore 
      || !firmStore.selected 
      || firmStore.selected.isFetching
      || !userStore
      || !userStore.selected
      || userStore.selected.isFetching
    )

    const invitesComplete = inviteUtils.checkInvitesComplete(this.state.invitations);
    // console.log("tiwala lang?", invitations)


    console.log('responseData', responseData);

    return (
      <WorkspaceLayout>
      { isEmpty ?
        (isFetching ? 
          <div className="-loading-hero hero">
            <div className="u-centerText">
              <div className="loading"></div>
            </div>
          </div>  
          : 
          <div>Empty.</div>
        )
        :
        <Modal
          cardSize="large"
          closeAction={this._handleClose}
          isOpen={true}
          modalHeader={`Invite client users to ${selectedClient.name}`}
          showButtons={responseData ? true : false}
        >
          { !responseData ? 
          <div className="">
            <div className="-form-step"><span className="-num">1</span> Who would you like to invite?</div>
            { invitations.map((invite, i) =>
              <InviteClientUserForm
                change={this._handleInvitationChange}
                selectChange={this._handleInvitationSelectChange}
                index={i}
                invite={invite}
                key={i}
                remove={this._removeInvitation}
                userListItems={userListItems}
                changeType={this._handleChangeTypeInvitation}
                inviteType={this.invitationType}
              />
            )}
            <button className="yt-btn link small" onClick={this._addInvitation}>Add another invitation</button>
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
            <button className="yt-btn" onClick={() => this.setState({ warningModal: true })} disabled={!invitesComplete || submitting}>
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
            <p><strong>Existing Contacts: </strong> {responseData.stats.existingClientUser}</p>
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
                        :  result.result === "clientUser already exists in Client itself." ? 
                          <i className="u-warning fas fa-exclamation-triangle"/>
                        : <i className="u-success fas fa-check"/>
                        // : result.inviteSent ? 
                        // <i className="u-success fas fa-check"/>
                        // :
                        // <i className="u-warning fas fa-exclamation-triangle"/>
                      }
                    </td>
                    <td>{result.email}</td>
                    <td>{!!result.result ? result.result : !!result.message ? result.message: ''}</td>
                    <td>{result.error}</td>
                  </tr>
                )}
                { !responseData.results || (responseData && responseData.results.length === 0) ?
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
        </Modal>
        }
        { isEmpty || isFetching ?
          null
          :
          <Modal
            closeAction={() => this.setState({previewModal: false })}
            isOpen={this.state.previewModal}
            modalHeader="Invitation email preview"
            showButtons={false}
          >
            <div className="invitation-preview">
              <div className="-preview-header">
                <p>From: {loggedInUser.firstname} {loggedInUser.lastname} ({selectedFirm.name})</p>
                <p>Subject: {loggedInUser.firstname} {loggedInUser.lastname} invited you to the Client Portal for {selectedClient.name} </p>
                <p>To: Recipents</p>
                <p>Reply-To: {brandingName.email.noreply}</p>
              </div>
              <hr/>
              <div className="-preview-body">
                <div style={{maxWidth: "50%"}}>
                  <img src={firmLogo}/>
                </div>

                <h3>{_.startCase(loggedInUser.firstname)} {_.startCase(loggedInUser.lastname)} has shared client portal access to the {selectedClient.name} account with you.</h3>
                <div>
                  <p>{_.startCase(loggedInUser.firstname)} added a note:</p>
                  <div className="-personal-note">{!personalNote ? `(If you add a personal note, it'll go here}` : personalNote} </div>
                </div>
                <p>To join {_.startCase(loggedInUser.firstname)}, click this button:</p>
                <button className="yt-btn info">Click here to view the portal</button>
                <hr/>
                <img src={brandingName.image.poweredby} />
                <p>{brandingName.title}’s Client Portal software makes it easy for accountants and their clients to securely send, receive, and organize their business files online.</p>
              </div>
            </div>
          </Modal>
        }
        <AlertModal
          alertMessage={<div> <h4>Are you sure?</h4> This will send an invitation email to contact uploaded.</div> }
          alertTitle="Invite client"
          closeAction={() => this.setState({warningModal: false})}
          confirmAction={this._handleFormSubmit.bind(this, false)}
          confirmText="Yes, upload and send invite"
          // declineAction={this._closeDeleteModal}
          // declineText="Never mind"
          isOpen={warningModal}
          type="danger"
          addConfirmText="Upload only"
          addConfirmAction={this._handleFormSubmit.bind(this, true)}
          addFooterClass="-bulk-upload"
          disableConfirm={submitting}
        />        
      </WorkspaceLayout>
    )
  }
}

PracticeInviteClientUser.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */

  const userListArgsObj = {_firm: props.match.params.firmId}
  const userListArgs = userListArgsObj ? routeUtils.listArgsFromObject(userListArgsObj) : null;
  let userListItems = userListArgs ? store.user.util.getList(...userListArgs) : null;
  userListItems = userListItems ? userListItems.filter(user => {
    if (!user.username.match(/hideme.ricblyz/g) && (user.username || user.firstname || user.lastname)) {
      user["displayName"] = 
        (user.firstname ? (user.firstname + " ") : "")
        + (user.lastname ? (user.lastname + " ") : "")
        + (user.username ? ("| " + user.username) : "");
      return user;      
    } else {
      return null;
    }
  }) : null;

  sortUtils._object(userListItems, "displayName");
  return {
    clientUserStore: store.clientUser
    , clientStore: store.client
    , defaultClientUser: store.clientUser.defaultItem
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
    , userListItems
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeInviteClientUser)
);
