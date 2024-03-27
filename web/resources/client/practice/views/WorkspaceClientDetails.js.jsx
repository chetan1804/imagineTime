/**
 * View component for /firm/:firmId/workspaces/:clientId/details
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { formatPhoneNumber } from 'react-phone-number-input'
import { Helmet } from 'react-helmet';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';

// import global componentss
import Binder from '../../../../global/components/Binder.js.jsx';
import permissions from '../../../../global/utils/permissions.js';

// import utils
import { auth } from '../../../../global/utils';

// import resource components
// import CreateAddress from '../../../address/views/CreateAddress.js.jsx'; 
import WorkspaceLayout from '../components/WorkspaceLayout.js.jsx';
// import resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import ClientSettingsLayout from '../components/ClientSettingsLayout.js.jsx';
import PhoneNumberEditor from '../../../phoneNumber/components/PhoneNumberEditor.js.jsx';
import PhoneNumberListItem from '../../../phoneNumber/components/PhoneNumberListItem.js.jsx';
import { TextInput } from '../../../../global/components/forms';

class WorkspaceClientDetails extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      fetchingStaffClient: false
      , fetchingClient: false
      , isAddingAddress: false
      , isAddingPhone: false
      , isEditingPhone: false
      , isEditingSecretQuestion: false
      , newSharedSecretPrompt: ''
      , newSharedSecretAnswer: ''
      , selectedPhoneId: null
      , selectedAddressId: null
    }
    this._bind(
      '_handleNewAddress'
      , '_handleEditAddress'
      , '_makePrimaryAddress'
      , '_handleEditPhone'
      , '_handleFormChange'
      , '_handleNewPhone'
      , '_handleToggleNotifications'
      , '_handleUpdateSecret'
      , '_setPrimaryNumber'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    // dispatch(addressActions.fetchListIfNeeded('_client', match.params.clientId)); // client's addresses 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(addressActions.fetchListIfNeeded('_client', match.params.clientId)); // client's addresses
    // dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then((json) => {
    //   dispatch(userActions.fetchSingleIfNeeded(json.item._primaryContact));
    // })
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));

    dispatch(phoneNumberActions.fetchListIfNeeded('_client', match.params.clientId)); // client's phone numbers 
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches firm's staff members 
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId)); 
  }

  _handleNewAddress(addressId) {
    const { dispatch, match } = this.props;
    if(addressId) {
      dispatch(addressActions.addAddressToList(addressId, '_client', match.params.clientId))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  _handleEditAddress(addressId) {
    this.setState({
      selectedAddressId: addressId
      , isEditingAddress: true
    })
  }

  _makePrimaryAddress(addressId) {
    const { dispatch, clientStore, match } = this.props;
    let updatedClient = _.cloneDeep(clientStore.byId[match.params.clientId]);
    updatedClient._primaryAddress = addressId;
    dispatch(clientActions.sendUpdateClient(updatedClient));
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
      dispatch(phoneNumberActions.addPhoneNumberToList(phoneNumberId, '_client', match.params.clientId))
    }
    this.setState({
      isAddingPhone: false
    });
  }

  _setPrimaryNumber(phoneNumber) {
    const { dispatch, clientStore } = this.props; 
    let newClient = _.cloneDeep(clientStore.selected.getItem()); 
    newClient._primaryPhone = phoneNumber._id; 
    dispatch(clientActions.sendUpdateClient(newClient)); 
  }

  _handleToggleNotifications(type, data) {
    const { dispatch } = this.props;
    
    // ui loading 
    this.setState({ [type]: true });
    
    if (type === 'fetchingClient' && data && data._id) {
      let newClient = _.cloneDeep(data);
      newClient.sendNotifEmails = !newClient.sendNotifEmails;
      dispatch(clientActions.sendUpdateClient(newClient)).then(json => {
        this.setState({ [type]: false });
      });
    } else if (type === 'fetchingStaffClient' && data && data._id) {
      let newStaffClient = _.cloneDeep(data);
      newStaffClient.sendNotifs = !newStaffClient.sendNotifs;
      dispatch(staffClientActions.sendUpdateStaffClient(newStaffClient)).then(json => {
        this.setState({ [type]: false });
      });
    }
  }

  _handleUpdateSecret() {
    const { clientStore, dispatch } = this.props;
    const { newSharedSecretPrompt, newSharedSecretAnswer } = this.state;
    let newClient = _.cloneDeep(clientStore.selected.getItem());
    newClient.sharedSecretPrompt = newSharedSecretPrompt
    newClient.sharedSecretAnswer = auth.getHashFromString(_.snakeCase(newSharedSecretAnswer)) // Sanitize and hash before sending to the server.
    dispatch(clientActions.sendUpdateClient(newClient));
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



  render() {
    const {
      addressStore
      , clientStore 
      , firmStore
      , location 
      , loggedInUser
      , match 
      , phoneNumberStore
      , staffClientStore
      , userStore 
      , staffStore
    } = this.props;
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // staffClient
    const usersStaffClientList = staffClientStore.util.getList('_client', match.params.clientId)
    const selectedStaffClient = usersStaffClientList ? usersStaffClientList.filter(sc => sc._user == loggedInUser._id)[0] : null;
    
    // address  list 
    const addressList = addressStore.lists && addressStore.lists._client ? addressStore.lists._client[match.params.clientId] : null;
    const addressListItems = addressStore.util.getList('_client', match.params.clientId);

    // phone number list 
    const phoneNumberList = phoneNumberStore.lists && phoneNumberStore.lists._client ? phoneNumberStore.lists._client[match.params.clientId] : null;
    const phoneNumberListItems = phoneNumberStore.util.getList('_client', match.params.clientId);  

    // check if staff is owner
    const isStaffOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
    
    const isEmpty = (
      !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      !addressListItems
      || !addressList
      || addressList.isFetching
      || clientStore.selected.isFetching
      || firmStore.selected.isFetching
    )

    return (
      <WorkspaceLayout>
        <Helmet><title>Client Details</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <h2>No client found.</h2>
          )
          :
          <div>
            {/* { selectedStaffClient && selectedStaffClient._id ?
              <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${selectedStaffClient && !selectedStaffClient.sendNotifs ? '-off' : '-on'}`}>
                { this.state.fetchingStaffClient ?
                  <i className="fas fa-spinner fa-spin"/>
                  :
                  <i className={`fas fa-bell${selectedStaffClient && !selectedStaffClient.sendNotifs ? '-slash' : ''}`} onClick={() => this._handleToggleNotifications('fetchingStaffClient', selectedStaffClient)}/>
                }
                </div>
                <label>You {selectedStaffClient && selectedStaffClient.sendNotifs ? <b>are </b> : 'are '}{selectedStaffClient && !selectedStaffClient.sendNotifs ? <b>not</b> : ''} receiving notifications for {selectedClient.name || 'this client'}</label>
              </div>
              :
              null
            }
            { selectedClient && selectedClient.name ?
              <div className="yt-row center-vert u-muted">
                <div className={`-notification-icon -toggle ${selectedClient && !selectedClient.sendNotifEmails ? '-off' : '-on'}`}>
                { this.state.fetchingClient ? 
                  <i className="fas fa-spinner fa-spin"/>
                  :
                  <i className={`fas fa-bell${selectedClient && !selectedClient.sendNotifEmails ? '-slash' : ''} ${isStaffOwner ? '' : '-not-allowed'}`} onClick={() => isStaffOwner ? this._handleToggleNotifications('fetchingClient', selectedClient) : null} />
                }
                </div>
                <label>{selectedClient.name || 'this client'} <b>{selectedClient.sendNotifEmails ? 'will ' : null }</b>{selectedClient.sendNotifEmails ? null : 'will ' }{selectedClient.sendNotifEmails ? null : <b>not</b>} receives notifications by view or download the file</label>
              </div>
              :
              null
            } */}
            <div className="-practice-content">
              <p>
                <strong>Primary Phone</strong>
              </p>
              { selectedClient._primaryPhone && phoneNumberStore.byId[selectedClient._primaryPhone] ?
                this.state.isEditingPhone && this.state.selectedPhoneId === selectedClient._primaryPhone ?
                <PhoneNumberEditor
                  editorClasses="-quick-view"
                  key={selectedClient._primaryPhone}
                  onSubmit={() => this.setState({isEditingPhone: false, selectedPhoneId: null})}
                  phoneNumberId={selectedClient._primaryPhone}
                />
                :
                <PhoneNumberListItem
                  handleEditPhone={this._handleEditPhone}
                  phoneNumber={phoneNumberStore.byId[selectedClient._primaryPhone]}
                  isPrimary={true}
                />
                : 
                <p>
                  <em>No primary phone number on file</em>
                </p>
              }
              { phoneNumberListItems && phoneNumberListItems.length > 0 ?
                <div>
                  <strong>Additional Numbers</strong>
                  { phoneNumberListItems.map((phoneNumber, i) =>
                    phoneNumber._id === selectedClient._primaryPhone ? // The primary phone will already be listed above.
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
                  )}
                </div>
                : null
              }
              { this.state.isAddingPhone ?
                <PhoneNumberEditor
                  editorClasses="-quick-view"
                  onSubmit={this._handleNewPhone}
                  clientId={match.params.clientId}
                />
                :
                <button className="yt-btn link info x-small" onClick={() => this.setState({ isAddingPhone: true })}>
                  <i className="fal fa-plus"/> Add phone
                </button>
              }
            </div>
            <div className="addresses">
              <p>
                <strong>Primary address</strong>
              </p>
              { selectedClient._primaryAddress && addressStore.byId[selectedClient._primaryAddress] ? // make sure the primary address actually exists in the store.
                <div className="yt-col full s_50 m_33 l_10">
                  <AddressCard
                    address={addressStore.byId[selectedClient._primaryAddress]}
                    editable={true}
                    handleEditAddress={this._handleEditAddress}
                    isPrimary={true}
                  />
                </div>
                :
                <p>
                  <em>No primary address on file</em>
                </p>
              }
              { addressListItems && addressListItems.length > 0 ?
                <div>
                  <p><strong>Additional addresses</strong></p>
                  {addressListItems.map((address, i) => 
                    address._id !== selectedClient._primaryAddress ? // The primary address will already be listed above.
                    <div key={"address_" + address._id + i} className="yt-col full s_50 m_33 l_10">
                      <AddressCard
                        address={address}
                        editable={true}
                        handleEditAddress={this._handleEditAddress}
                        isPrimary={false}
                        makePrimary={this._makePrimaryAddress}
                      />
                    </div>
                    :
                    null
                  )}
                </div>
                :
                null
              }
              { this.state.isAddingAddress ?
                <AddressEditor
                  pointers={{_client: selectedClient._id}}
                  onSubmit={this._handleNewAddress}
                  editorClasses="-quick-view"
                />
                :
                <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link info x-small">
                  <i className="fal fa-plus"/> Add address
                </button>
              }
            </div>
            {
              <div className="-practice-content">
                <strong>Primary Contact</strong>
                <p>{selectedClient && selectedClient._primaryContact && userStore && userStore.byId && userStore.byId[selectedClient._primaryContact] ? `${userStore.byId[selectedClient._primaryContact].firstname} ${userStore.byId[selectedClient._primaryContact].lastname}` : <em>No primary contact</em> }</p>
              </div>
            }
            <div className="-practice-content">
              <strong>
                Shared Secret Question
                <small onClick={() => this.setState({isEditingSecretQuestion: true})} className="action-link -edit-button">
                  Edit
                </small>
              </strong>
              { !this.state.isEditingSecretQuestion ?
                <div>
                { selectedClient.sharedSecretPrompt ?
                  <p>{selectedClient.sharedSecretPrompt}</p>
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
          </div>

        }

      </WorkspaceLayout>
    )
  }
}

WorkspaceClientDetails.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceClientDetails.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address  
    , clientStore: store.client 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
    , staffClientStore: store.staffClient 
    , userStore: store.user  
    , staffStore: store.staff
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceClientDetails)
);
