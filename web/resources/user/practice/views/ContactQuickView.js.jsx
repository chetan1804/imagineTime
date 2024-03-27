/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';

// import third-party libraries
import { DateTime } from 'luxon';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as noteActions from '../../../note/noteActions'; 
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../userActions';

// import utils
import { auth, permissions } from '../../../../global/utils';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import { TextInput } from '../../../../global/components/forms';

// import resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import NewNoteInput from '../../../note/components/NewNoteInput.js.jsx'; 
import NoteItem from '../../../note/components/NoteItem.js.jsx'; 
import PhoneNumberEditor from '../../../phoneNumber/components/PhoneNumberEditor.js.jsx';
import PhoneNumberListItem from '../../../phoneNumber/components/PhoneNumberListItem.js.jsx';
import ProfilePic from '../../components/ProfilePic.js.jsx';
import FullNameForm from '../components/FullNameForm.js.jsx';
import EmailForm from '../components/EmailForm.js.jsx';
import ClientUserPositionForm from '../components/ClientUserPositionForm.js.jsx';

class ContactQuickView extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      isAddingAddress: false
      , isAddingPhone: false
      , isAddingNote: false
      , isEditingAddress: false
      , isEditingPhone: false
      , selectedAddressId: null
      , selectedPhoneId: null
      , viewing: 'info'
      , isEditingFullName: false
      , isEditingEmail: false
      , isEditingBackupUser: null
      , isEditingPosition: false
    }
    this._bind(
      '_goBack'
      , '_handleEditPhone'
      , '_handleNewPhone'
      , '_handleNewNote'
      , '_handleEditAddress'
      , '_handleFormChange'
      , '_handleNewAddress'
      , '_handleUpdateSecret'
      , '_setPrimaryNumber'
      , '_setPrimaryContact'
      , '_handleEditFullName'
      , '_handleEditEmail'
      , '_makePrimaryAddress'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    // get stuff for global nav 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    // set the selected clientUser if we have a clientId in the url.
    if(match.params.clientId && match.params.userId) {
      dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId, '_user', match.params.userId)).then(cuRes => {
        if(cuRes.success && cuRes.list) {
          const selectedClientUser = cuRes.list[0];
          this.setState({
            selectedClientUser
          })
        }
      })
    }
    // get stuff for this view 
    dispatch(addressActions.fetchListIfNeeded('_user', match.params.userId));
    dispatch(clientActions.fetchListIfNeeded('_user', match.params.userId));
    dispatch(clientUserActions.fetchListIfNeeded('_firm', match.params.firmId, '_user', match.params.userId));
    dispatch(noteActions.fetchListIfNeeded('_firm', match.params.firmId, '_user', match.params.userId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(phoneNumberActions.fetchListIfNeeded('_user', match.params.userId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff/contacts 
    dispatch(userActions.fetchSingleIfNeeded(match.params.userId)).then(userRes => {
      if(userRes.success) {
        const user = userRes.item;
        if(user._primaryPhone) {
          dispatch(phoneNumberActions.fetchSingleIfNeeded(user._primaryPhone))
        }
        if(user._primaryAdress) {
          dispatch(addressActions.fetchSingleIfNeeded(user._primaryAddress))
        }
      }
    });
  }

  _goBack() {
    // e.preventDefault()
    this.props.history.goBack();
  }

  _handleEditPhone(phoneNumberId) {
    this.setState({
      selectedPhoneId: phoneNumberId
      , isEditingPhone: true
    })
  }

  _handleNewPhone(phoneNumberId) {
    const { dispatch, match } = this.props;
    if(phoneNumberId) {
      dispatch(phoneNumberActions.addPhoneNumberToList(phoneNumberId, '_user', match.params.userId))
    }
    this.setState({
      isAddingPhone: false
    });
  }

  _handleNewNote(noteId) {
    const { dispatch, match } = this.props;
    if(noteId) {
      dispatch(noteActions.addNoteToList(noteId, '_firm', match.params.firmId, '_user', match.params.userId))
    }
    this.setState({
      isAddingNote: false
    });
  }
  
  _handleEditAddress(addressId) {
    this.setState({
      selectedAddressId: addressId
      , isEditingAddress: true
    })
  }

  _handleNewAddress(addressId) {
    const { dispatch, match } = this.props;
    if(addressId) {
      dispatch(addressActions.addAddressToList(addressId, '_user', match.params.userId))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  _setPrimaryNumber(phoneNumber) {
    const { dispatch, userStore } = this.props; 
    let newUser = _.cloneDeep(userStore.selected.getItem()); 
    newUser._primaryPhone = phoneNumber._id; 
    dispatch(userActions.sendUpdateUser(newUser));  
  }

  _setPrimaryContact(selectedUser) {
    const { dispatch, clientStore } = this.props;
    let newClient = _.cloneDeep(clientStore.selected.getItem());
    newClient._primaryContact = selectedUser._id;
    dispatch(clientActions.sendUpdateClient(newClient));
  }

  _handleUpdateSecret() {
    const { dispatch, userStore, loggedInUser, firmStore } = this.props;
    const { newSharedSecretPrompt, newSharedSecretAnswer } = this.state;
    let newUser = _.cloneDeep(userStore.selected.getItem());
    let selectedFirm = firmStore.selected.getItem(); 
    newUser.sharedSecretPrompt = newSharedSecretPrompt
    newUser.sharedSecretAnswer = auth.getHashFromString(_.snakeCase(newSharedSecretAnswer)) // Sanitize and hash before sending to the server.
    dispatch(userActions.sendUpdateSecretQuestion(loggedInUser._id, selectedFirm._id, newUser)).then(json => {
      if(!json.success) {
        alert("Unable to update this contact's secret question. Please try again.")
      }
    });
    this.setState({
      isEditingSecretQuestion: false
      , newSharedSecretPrompt: ''
      , newSharedSecretAnswer: ''
    })
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

  _handleEditFullName() {
    const { userStore } = this.props;
    const isEditing = this.state.isEditingFullName ? null : userStore.selected.getItem();
    this.setState({ 
      isEditingFullName: !this.state.isEditingFullName 
      , isEditingBackupUser: isEditing
    });
  }

  _handleEditEmail() {
    const { userStore } = this.props;
    const isEditing = this.state.isEditingUserName ? null : userStore.selected.getItem();    
    this.setState({
      isEditingUserName: !this.state.isEditingUserName
      , isEditingBackupUser: isEditing
    });
  }

  _makePrimaryAddress(addressId) {
    const { dispatch, userStore } = this.props;
    let updatedUser = _.cloneDeep(userStore.selected.getItem());
    updatedUser._primaryAddress = addressId;
    dispatch(userActions.sendUpdateUser(updatedUser));
  }

  render() {
    const { 
      addressStore
      , clientStore 
      , clientUserStore 
      , noteStore
      , firmStore 
      , location
      , loggedInUser
      , match
      , phoneNumberStore
      , userStore 
      , staffStore
    } = this.props;

    const { 
      selectedClientUser
      , isEditingBackupUser
      , isEditingFullName
      , isEditingPosition
    } = this.state
    
    const selectedFirm = firmStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();
    const selectedUser = isEditingBackupUser ? isEditingBackupUser : userStore.selected.getItem();

    const clientUserList = (
      clientUserStore.lists 
      && clientUserStore.lists._firm 
      && clientUserStore.lists._firm[match.params.firmId]
      && clientUserStore.lists._firm[match.params.firmId]._user 
      && clientUserStore.lists._firm[match.params.firmId]._user[match.params.userId]
    );
    let clientUserListItems = clientUserStore.util.getList('_firm', match.params.firmId, '_user', match.params.userId);
    clientUserListItems = clientUserListItems ? clientUserListItems.filter(clientUser => clientUser.status === "active") : null;
  
    const noteList = (
      noteStore.lists 
      && noteStore.lists._firm 
      && noteStore.lists._firm[match.params.firmId]
      && noteStore.lists._firm[match.params.firmId]._user 
      && noteStore.lists._firm[match.params.firmId]._user[match.params.userId]
    );
    const noteListItems = noteStore.util.getList('_firm', match.params.firmId, '_user', match.params.userId);

    const addressList = addressStore.lists && addressStore.lists._user ? addressStore.lists._user[match.params.userId] : null;
    const addressListItems = addressStore.util.getList('_user', match.params.userId);

    const phoneNumberList = phoneNumberStore.lists && phoneNumberStore.lists._user ? phoneNumberStore.lists._user[match.params.userId] : null;
    const phoneNumberListItems = phoneNumberStore.util.getList('_user', match.params.userId);   
    
    const isStaffOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
    const callFromContact = match.path === "/firm/:firmId/contacts/quick-view/:userId";

    const isEmpty = (
      !clientUserListItems
      || !clientUserList
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
      || userStore.selected.didInvalidate
      || !selectedUser 
      || !selectedUser._id
      || (callFromContact ? false : !selectedClient)
    );

    const isFetching = (
      !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || !noteList
      || noteList.isFetching
      || firmStore.selected.isFetching
      || userStore.selected.isFetching
    )

    /**  README: since from bulk invite primary contact proceed to the process even primary email address is empty, 
    so I put in temporary email address 'hideme.ricblyz+@gmail.com', this temporary email should not display in user interface */
    const clientUserName = selectedUser ? selectedUser.username.match(/hideme.ricblyz/g) ? null : selectedUser.username : null;
    return (
      <div className="quick-view">
        <div className="-header">
          <Link to={`${match.url.substring(0, match.url.indexOf('/quick-view'))}`}>Close</Link>
        </div>
        { isEmpty && !isEditingBackupUser ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>Empty. </p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="-body" >
              <div className="-user-info">
                <ProfilePic user={selectedUser}/>
                <div className="-text">
                  <strong>{selectedUser.firstname} {selectedUser.lastname}</strong>
                  <br/>
                  <small>{clientUserName}</small>
                </div>
              </div>
              <div className="tab-bar-nav">
                <ul className="navigation">
                  <li>
                    <span className={`action-link ${this.state.viewing === 'info' ? 'active' : null}`} onClick={() => this.setState({viewing: 'info'})}>Personal Info</span>
                  </li>
                  <li>
                    <span className={`action-link ${this.state.viewing === 'accounts' ? 'active' : null}`} onClick={() => this.setState({viewing: 'accounts'})}>Client Accounts</span>
                  </li>
                  <li>
                    <span className={`action-link ${this.state.viewing === 'notes' ? 'active' : null}`} onClick={() => this.setState({viewing: 'notes'})}>Notes</span>
                  </li>
                </ul>
              </div>
              { this.state.viewing === 'info' ?
                <div className="-user-personal-info">
                  <div className="-set-primary-contact">
                    <h3>Contact</h3>
                    { 
                      !callFromContact && isStaffOwner ?
                        selectedClient._primaryContact === selectedUser._id ?
                        <button disabled>(Primary)</button>
                        : <button onClick={() => this._setPrimaryContact(selectedUser)}>Set as Primary Contact</button> 
                        : null
                    }
                  </div>
                  <div className="-block">
                    <label>Name</label>
                    { isEditingFullName ?
                      <FullNameForm
                        handleEditFullName={this._handleEditFullName}
                        fullNameId={selectedUser._id} 
                      />
                      :
                      <label>
                        {`${selectedUser.firstname}${selectedUser.firstname ? " " : ""}${selectedUser.lastname}` || "n/a"}
                        { isStaffOwner ?
                          <small onClick={this._handleEditFullName} className="action-link -edit-button">
                            Edit
                          </small>                          
                          : null
                        }
                      </label>
                    }
                  </div>
                  <div className="-block">
                    <label>Email</label>
                    {
                      this.state.isEditingUserName ?
                      <EmailForm 
                        handleEditEmail={this._handleEditEmail}
                        emailId={selectedUser._id}  
                      />
                      :
                      <label>
                        { clientUserName ? <a href={`mailto:${clientUserName}`}>{clientUserName}</a> : <em>n/a</em> } 
                        { isStaffOwner ?
                          <small onClick={this._handleEditEmail} className="action-link -edit-button">
                            { clientUserName ? 'Edit' : 'Add' }
                          </small>
                          : null
                        }
                      </label>
                    }
                  </div>
                  { 
                    match.params.clientId || (clientUserListItems && clientUserListItems.length) ?
                    <div className="-block">
                      <label>Position</label>
                      {
                        match.params.clientId ?
                          isEditingPosition ?
                          <ClientUserPositionForm
                            close={(val) => this.setState({ selectedClientUser: val, isEditingPosition: !isEditingPosition })}
                            selectedClientUser={selectedClientUser}
                          />
                          :
                          <label>
                            { selectedClientUser && selectedClientUser.position ? selectedClientUser.position : <em>n/a</em> } 
                            { selectedClientUser ?
                              <small onClick={() => this.setState({ isEditingPosition: !isEditingPosition })} className="action-link -edit-button">
                                { selectedClientUser ? 'Edit' : '' }
                              </small>
                              : null
                            }
                          </label>
                        : 
                        clientUserListItems && clientUserListItems.length && clientStore ? 
                        clientUserListItems.map(item => 
                          <label>
                            {
                              clientStore.byId[item._client] && clientStore.byId[item._client].status === "visible" ? 
                              <Link to={`/firm/${match.params.firmId}/workspaces/${item._client}/files`}>{clientStore.byId[item._client].name}: </Link> : null
                            }
                            {
                              isEditingPosition && item._id === selectedClientUser._id ?
                              <ClientUserPositionForm
                                close={(val) => this.setState({ selectedClientUser: val, isEditingPosition: !isEditingPosition })}
                                selectedClientUser={selectedClientUser}
                              />
                              : item.position ? item.position : <em>n/a</em>
                            }
                            {
                              isEditingPosition ? null
                              : 
                              <small onClick={() => this.setState({ isEditingPosition: !isEditingPosition, selectedClientUser: item })} className="action-link -edit-button">
                                Edit
                              </small>
                            }
                            <br/>
                          </label>
                        )
                        : null
                      }
                    </div>
                    : 
                    null
                  }
                  <div className="-block">
                    <label>Phone</label>
                    { selectedUser._primaryPhone && phoneNumberStore.byId[selectedUser._primaryPhone] ?
                      this.state.isEditingPhone && this.state.selectedPhoneId === selectedUser._primaryPhone ?
                      <PhoneNumberEditor
                        editorClasses="-quick-view"
                        onSubmit={() => this.setState({isEditingPhone: false, selectedPhoneId: null})}
                        phoneNumberId={selectedUser._primaryPhone}
                      />
                      :
                      <PhoneNumberListItem
                        handleEditPhone={this._handleEditPhone}
                        phoneNumber={phoneNumberStore.byId[selectedUser._primaryPhone]}
                        isPrimary={true}
                      />
                      :
                      <em>No primary phone on file</em>
                    }
                    { phoneNumberListItems && phoneNumberListItems.length > 0 ?
                      phoneNumberListItems.map((phoneNumber, i) =>
                      phoneNumber._id === selectedUser._primaryPhone ? // The primary phone will already be listed above.
                      null
                      :
                      this.state.isEditingPhone && this.state.selectedPhoneId === phoneNumber._id ?
                      <PhoneNumberEditor
                        editorClasses="-quick-view"
                        key={phoneNumber._id + i}
                        onSubmit={() => this.setState({isEditingPhone: false, selectedPhoneId: null})}
                        phoneNumberId={phoneNumber._id}
                      />
                      :
                      <PhoneNumberListItem
                        handleEditPhone={this._handleEditPhone}
                        key={phoneNumber._id + i}
                        phoneNumber={phoneNumber}
                        isPrimary={false}
                        setPrimary={() => this._setPrimaryNumber(phoneNumber)}
                      />
                      )
                      :
                      null
                    }
                    { this.state.isAddingPhone ?
                      <PhoneNumberEditor
                        editorClasses="-quick-view"
                        onSubmit={this._handleNewPhone}
                        userId={selectedUser._id}
                      />
                      :
                      <button
                        className="yt-btn link x-small"
                        onClick={() => this.setState({ isAddingPhone: true })}
                      >
                        <i className="fal fa-plus"/>
                        Add phone
                      </button>
                    }
                  </div>
                  <div className="-block">

                    <label>Address{addressListItems && addressListItems.length > 1 ? 'es' : null}</label>
                    { selectedUser._primaryAddress && addressStore.byId[selectedUser._primaryAddress] ? // make sure the primary address actually exists in the store.
                      <AddressCard
                        address={addressStore.byId[selectedUser._primaryAddress]}
                        editable={true}
                        handleEditAddress={this._handleEditAddress}
                        isPrimary={true}
                      />
                      :
                      <em>No primary address on file</em>
                    }
                    { addressListItems && addressListItems.length > 0 ?
                      addressListItems.map((address, i) => 
                      address._id !== selectedUser._primaryAddress ? // The primary address will already be listed above.
                      <AddressCard
                        address={address}
                        editable={true}
                        handleEditAddress={this._handleEditAddress}
                        key={address._id + i}
                        isPrimary={false}
                        makePrimary={this._makePrimaryAddress}
                        width={`50%`}
                      />
                      :
                      null
                      )
                      :
                      null
                    }
                    { this.state.isAddingAddress ?
                      <AddressEditor
                        pointers={{_user: selectedUser._id}}
                        onSubmit={this._handleNewAddress}
                        editorClasses="-quick-view"
                      />
                      :
                      <div>
                        <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link x-small"><i className="fal fa-plus"/> Add address</button>
                      </div>
                    }
                  </div>
                  { selectedUser && isStaffOwner ?
                    <div className="-shared-secred-question -block">
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
                        <div className="yt-col l_50">
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
                    :
                    null
                  }
                  {/* <h3>About</h3> */}
                </div>
                :
                this.state.viewing === 'accounts' ?
                <div className="-user-accounts">
                  <p className="u-muted"><em>This contact is connected to the following client accounts.</em></p>

                  {clientUserListItems.map((cu, i) => 
                    <div className="-user-client" key={cu._id + i}>
                      {
                        clientStore.byId[cu._client] ?
                        clientStore.byId[cu._client].status === "visible" ?
                          <Link to={`/firm/${match.params.firmId}/workspaces/${cu._client}/files`}>{clientStore.byId[cu._client].name }</Link>
                          : null
                          : <i className="far fa-spinner fa-spin"/>
                      }
                    </div>
                  )}
                </div>
                : 
                <div className="-user-notes">
                { noteListItems ? 
                  noteListItems.map((note, i) =>
                  <NoteItem 
                    key={`note_${i}_${note._id}`}
                    note={note}
                    user={userStore.byId[note._createdBy]}
                  />
                  )
                  :
                  !this.state.isAddingNote ?
                  <p className="u-muted"><em>No notes found.</em></p>
                  :
                  null
                }
                
                { this.state.isAddingNote ?
                  <NewNoteInput
                    userId={match.params.userId}
                    firmId={match.params.firmId}
                    onSubmit={this._handleNewNote}
                    dispatch={this.props.dispatch}
                    pointers={{
                      _user: selectedUser._id
                      , _firm: selectedFirm._id
                      , _createdBy: loggedInUser._id
                    }}
                  />
                  :
                  <button
                    className="yt-btn block info link -note-button"
                    type="button"
                    onClick={() => this.setState({isAddingNote: true})}
                  >
                    Add note
                  </button>
                }
                </div>
              }
            </div>
            <div className="-footer">
              {/* <Link to={`/firm/${match.params.firmId}/contacts/details/${match.params.userId}`}>Details</Link> */}

            </div>
            <Modal
              closeAction={() => this.setState({isEditingAddress: false, selectedAddressId: null})}
              isOpen={this.state.isEditingAddress}
              modalHeader={"Edit Address"}
              showButtons={false}
            >
              <AddressEditor
                addressId={this.state.selectedAddressId}
                onSubmit={() => this.setState({isEditingAddress: false, selectedAddressId: null})}
              />
            </Modal>
          </div>
        }
      </div>
    )
  }
}

ContactQuickView.propTypes = {
  dispatch: PropTypes.func.isRequired
}

ContactQuickView.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */


  return {
    addressStore: store.address 
    , clientStore: store.client 
    , clientUserStore: store.clientUser
    , noteStore: store.note
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber 
    , userStore: store.user
    , staffStore: store.staff
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ContactQuickView)
);
