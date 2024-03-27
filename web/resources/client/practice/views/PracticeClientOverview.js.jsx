/**
 * View component for /firm/:firmId/clients/:clientId
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { permissions } from '../../../../global/utils';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { 
  ListComparator
  , TextInput 
  , UrlInput
} from '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import ClientSettingsLayout from '../components/ClientSettingsLayout.js.jsx';
import PhoneNumberEditor from '../../../phoneNumber/components/PhoneNumberEditor.js.jsx';
import PhoneNumberListItem from '../../../phoneNumber/components/PhoneNumberListItem.js.jsx';

class PracticeClientOverview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      client: {}
      , staffclient: null
      , isAddingAddress: false 
      , isAddingPhone: false
      , isEditingClient: false 
      , isEditingPhone: false
      , selectedAddressId: null 
      , selectedPhoneId: null
    }
    this._bind(
      '_handleEditAddress'
      , '_handleEditPhone'
      , '_handleFormChange'
      , '_handleNewAddress'
      , '_handleNewPhone'
      , '_handleUpdateClient'
      , '_makePrimaryAddress'
      , '_setPrimaryNumber'
      , '_toggleEditingClient'
      , '_handleReload'
    )
  }

  componentDidMount() {
    this._handleReload(this.props.match.params.clientId);
  }

  componentWillReceiveProps(nextProps) {
    const nextClientId = nextProps.match.params.clientId;
    const clientId = this.props.match.params.clientId;
    if (nextClientId !== clientId) {
      this._handleReload(nextClientId);
    }
  }

  _handleReload(clientId) {
    const { dispatch, loggedInUser, match } = this.props;

    //These two fetches should live on every top-level practice view.
    dispatch(clientActions.fetchSingleClientById(clientId)).then((json) => {
      if(json.success) {
        this.setState({client: _.cloneDeep(json.item)}); 
      } 
    })
    dispatch(clientActions.fetchListIfNeeded('engagement-types', match.params.firmId));
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(clientId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(addressActions.fetchListIfNeeded('_client', clientId)); // client's addresses
    dispatch(clientUserActions.fetchListIfNeeded('_client', clientId)).then(cuRes => {
      if(cuRes.success) {
        cuRes.list.forEach(cu => {
          dispatch(addressActions.fetchListIfNeeded('_user', cu._user));
          dispatch(phoneNumberActions.fetchListIfNeeded('_user', cu._user));
        })
      }
    });
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(phoneNumberActions.fetchListIfNeeded('_client', clientId)); // client's phone numbers 
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', clientId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches firm's staff members 
    dispatch(userActions.fetchListIfNeeded('_client', clientId)); // fetches the user info for all associated clientUsers
  }

  _handleFormChange(e, data) {
    if (e === 'staff') {
      let newStaffClient = _.cloneDeep(data);
      newStaffClient.sendNotifs = !newStaffClient.sendNotifs;
      this.setState({ staffclient: newStaffClient });
    } else {
      const value = e === 'client' ? !this.state.client.sendNotifEmails : e.target.value;
      const name = e === 'client' ? 'client.'+data : e.target.name;
      let newState = _.update(this.state, name, function() { 
        return value;
      });
      this.setState({newState});
    }
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

  _handleNewAddress(addressId) {
    const { dispatch, match } = this.props;
    if(addressId) {
      dispatch(addressActions.addAddressToList(addressId, '_client', match.params.clientId))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  _toggleEditingClient() {
    this.setState({isEditingClient: !this.state.isEditingClient});
  }

  _handleUpdateClient() {
    const { dispatch, staffClientStore, match, loggedInUser } = this.props;
    const newClient = _.cloneDeep(this.state.client); 
    dispatch(clientActions.sendUpdateClient(newClient)).then((json) => {
      if(json.success) {

        if (this.state.staffclient) {
          const usersStaffClientList = staffClientStore.util.getList('_client', match.params.clientId)
          const selectedStaffClient = usersStaffClientList ? usersStaffClientList.filter(sc => sc._user == loggedInUser._id)[0] : null;
          if (selectedStaffClient.sendNotifs !== this.state.staffclient.sendNotifs) {
            dispatch(staffClientActions.sendUpdateStaffClient(this.state.staffclient)).then(json => {
              this.setState({ staffclient: json.item });
            });
          }
        }
        this.setState({isEditingClient: false, client: json.item });
      }
    })
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

  render() {
    const {
      addressStore
      , clientStore 
      , clientUserStore 
      , firmStore
      , location 
      , loggedInUser
      , match 
      , phoneNumberStore
      , staffStore 
      , staffClientStore 
      , userStore 
    } = this.props;
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // clientUsers/contacts  list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // staffClient list 
    const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[match.params.clientId] : null;
    const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId);
    
    // address list 
    const addressList = addressStore.lists && addressStore.lists._client ? addressStore.lists._client[match.params.clientId] : null;
    const addressListItems = addressStore.util.getList('_client', match.params.clientId);

    // phone number list 
    const phoneNumberList = phoneNumberStore.lists && phoneNumberStore.lists._client ? phoneNumberStore.lists._client[match.params.clientId] : null;
    const phoneNumberListItems = phoneNumberStore.util.getList('_client', match.params.clientId);

    // check if staff is owner
    const isStaffOwner = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);

    // loggedIn staff
    // staffClient
    const usersStaffClientList = staffClientStore.util.getList('_client', match.params.clientId)
    const selectedStaffClient = usersStaffClientList ? usersStaffClientList.filter(sc => sc._user == loggedInUser._id)[0] : null;

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
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      || !staffClientListItems
      || !staffClientList
      || staffClientList.isFetching
    )
    
    const sendNotifEmails = selectedClient ? this.state.client ? this.state.client.sendNotifEmails : selectedClient.sendNotifEmails : false;
    const selectedstaff = this.state.staffclient ? this.state.staffclient : selectedStaffClient;
    const engagementTypes = clientStore.formHelpers.engagementTypes;
    
    return (
      <ClientSettingsLayout>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero three-quarter ">
              <div className="yt-container slim">
                <h2>Hmm.  Something's wrong here. </h2>
                <p>Please contact <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a>.</p>
              </div>
            </div>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row ">
              <div className="yt-col _70">
                <div className="-practice-content">
                  <button className="yt-btn x-small success link u-pullRight" onClick={this._toggleEditingClient}>Update general client info</button>
                  <h4>General info</h4>

                  {this.state.isEditingClient ? 
                    <div className="-edit">
                      <small className="u-muted">Client name</small>
                      <TextInput
                        change={this._handleFormChange}
                        name="client.name"
                        value={this.state.client.name}
                        placeholder="Enter new client name here..."
                      />
                      <small className="u-muted">Client identifier</small>
                      <TextInput
                        change={this._handleFormChange}
                        name="client.identifier"
                        value={this.state.client.identifier || this.state.client.externalId || ""}
                        placeholder="Enter a client identifier here..."
                      />

                      <br/>
                      <small className="u-muted">Engagement types</small>
                      <ListComparator
                        change={this._handleFormChange}
                        filterable={false}
                        allItems={engagementTypes}
                        name="client.engagementTypes"
                        reorderable={false}
                        required={false}
                        items={this.state.client.engagementTypes}
                      />
                      <br/>
                      <small className="u-muted">Website</small>
                      <UrlInput
                        change={this._handleFormChange}
                        name="client.website"
                        value={this.state.client.website || ""}
                        placeholder="Enter client url..."
                      />

                      <button className="yt-btn x-small link" onClick={this._toggleEditingClient}>Cancel</button>
                      <button className="yt-btn x-small success" onClick={this._handleUpdateClient}>Save</button>
                    </div>
                  : 
                    <div className="-static">
                      <small className="u-muted">Client name</small>
                      <p > { selectedClient.name }</p>
                      <br/>
                      <small className="u-muted">Client identifier</small>
                      <p>{selectedClient.identifier}</p>
                      <br/>
                      <small className="u-muted">Engagement types</small>
                      {selectedClient.engagementTypes ? 
                        <p>
                          {selectedClient.engagementTypes.map((type, i) =>
                            <span key={'type_' + i}>
                              { i > 0 ?
                                <span>, </span>
                                :
                                null 
                              }
                              {type}
                            </span>
                          )}
                        </p>
                        :
                        <p><em>None selected</em></p>
                      }
                      <br/>
                      <small className="u-muted">Website</small>
                      <p>{selectedClient.website}</p>
                    </div>
                  }
                  <hr/>
                  <div className="-practice-content">
                    <p>
                      <strong>Primary Phone</strong>
                    </p>
                    { selectedClient._primaryPhone && phoneNumberStore && phoneNumberStore.byId && phoneNumberStore.byId[selectedClient._primaryPhone] ?
                      this.state.isEditingPhone && this.state.selectedPhoneId === phoneNumberStore.byId[selectedClient._primaryPhone]._id ?
                        <PhoneNumberEditor
                          editorClasses="-quick-view"
                          onSubmit={() => this.setState({isEditingPhone: false, selectedPhoneId: null})}
                          phoneNumberId={phoneNumberStore.byId[selectedClient._primaryPhone]._id}
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
                    <div>
                    { phoneNumberListItems && phoneNumberListItems.length > 0 ?
                      phoneNumberListItems.map((phoneNumber, i) =>
                        selectedClient && selectedClient._primaryPhone === phoneNumber._id ? null :
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
                    </div>
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
                      <AddressCard
                        address={addressStore.byId[selectedClient._primaryAddress]}
                        editable={true}
                        handleEditAddress={this._handleEditAddress}
                        isPrimary={true}
                      />
                      :
                      <p>
                        <em>No primary address on file</em>
                      </p>
                    }
                    { addressListItems && addressListItems.length > 0 ?
                      <div>
                        <p><strong>Additional addresses</strong></p>
                        {addressListItems.map((address, i) => 
                          !address ? null :
                          address._id !== selectedClient._primaryAddress ? // The primary address will already be listed above.
                          <div key={"address_" + address._id + i} className="yt-col full s_50 m_33 l_25">
                            <AddressCard
                              address={address}
                              editable={true}
                              handleEditAddress={this._handleEditAddress}
                              isPrimary={false }
                              makePrimary={this._makePrimaryAddress}
                              marginRight={0}
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
                </div>
              </div>
            </div>
          </div>
        }
      </ClientSettingsLayout>
    )
  }
}

PracticeClientOverview.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeClientOverview.defaultProps = {

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
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber 
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , userStore: store.user 
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeClientOverview)
);
