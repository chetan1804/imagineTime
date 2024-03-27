/**
 * View component for /firms/:firmId
 *
 * Displays a single firm from the 'byId' map in the firm reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import _ from 'lodash'; 
import classNames from 'classnames';
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../firmActions';
import * as fileActions from '../../../file/fileActions'; 
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as subscriptionActions from '../../../subscription/subscriptionActions';
import * as userActions from '../../../user/userActions';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import { TextInput } from '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import utils
import { fileUtils } from '../../../../global/utils' ;

// import resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import NewImageModal from '../../../file/components/NewImageModal.js.jsx'; 
import PracticeFirmLayout from '../components/PracticeFirmLayout.js.jsx';


class PracticeFirmOverview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      addLicensesModal: false 
      , isAddingAddress: false 
      , newImageFileOpen: false
      , selectedAddressId: null 
      , updateFirmNameOpen: false
      , firmName: ''
    }
    this._bind(
      '_handleFormChange'
      , '_handleEditAddress'
      , '_handleNewAddress'
      , '_handleNewImageFile'
      , '_makePrimaryAddress'
      , '_toggleUpdateFirmName'
      , '_handleUpdateFirmName'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(addressActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId, 'status', 'visible'));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId)).then(firmRes => {
      if(firmRes.success && firmRes.item) {
      } else if (firmRes.success && !firmRes.item) {
        dispatch(firmActions.fetchSingleFirmById(match.params.firmId));
      }
    })
    dispatch(phoneNumberActions.fetchListIfNeeded('_firm', match.params.firmId)); // TODO: add _firm to the phoneNumber model 
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(subscriptionActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
  }

  _handleFormChange(e) {
    let newState = _.update( this.state, e.target.name, function() {
      return e.target.value;
    });
    this.setState({newState})
  }

  _handleEditAddress(addressId) {
    this.setState({
      selectedAddressId: addressId
      , isEditingAddress: true
    })
  }

  _makePrimaryAddress(addressId) {
    console.log(addressId);
    const { dispatch, firmStore, match } = this.props;
    let updatedFirm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    updatedFirm._primaryAddress = addressId;
    dispatch(firmActions.sendUpdateFirm(updatedFirm));
  }

  _handleNewAddress(addressId) {
    const { dispatch, match } = this.props;
    if(addressId) {
      dispatch(addressActions.addAddressToList(addressId, '_firm', match.params.firmId))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  _handleNewImageFile(file) {
    const selectedFirm = this.props.firmStore.selected.getItem();
    const newFirm = _.cloneDeep(selectedFirm); 
    newFirm._file = file._id; 
    newFirm.logoUrl = file.filename; // NOTE: this is JUST the filename NOT the full path
    this.props.dispatch(fileActions.fetchSingleIfNeeded(file._id)); 
    this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
      this.setState({newImageFileOpen: false}); 
    })
  }

  _toggleUpdateFirmName() {
    this.setState({updateFirmNameOpen: !this.state.updateFirmNameOpen}); 
  }

  _handleUpdateFirmName() {
    let newFirm = _.cloneDeep(this.props.firmStore.selected.getItem()); 
    newFirm.name = this.state.firmName; 
    this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
      if(json.success) {
        this.setState({updateFirmNameOpen: false, firmName: ''}); 
      }
    }); 
  }

  render() {
    const { 
      addressStore
      , clientStore 
      , firmStore 
      , fileStore
      , location
      , match 
      , phoneNumberStore
      , staffStore 
      , subscriptionStore
      , userStore 
    } = this.props;

    const { 
      updateFirmNameOpen
    } = this.state; 

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */
    const selectedFirm = firmStore.selected.getItem();
    let firmLogo = '';
    if (selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`;
    }
    const utilClientStore = clientStore.util.getSelectedStore('_firm', match.params.firmId, 'status', 'visible');

    console.log("utilClientStore", utilClientStore)

    const staffList = staffStore.lists && staffStore.lists._firm ? staffStore.lists._firm[match.params.firmId] : null;
    const staffListItems = staffStore.util.getList('_firm', match.params.firmId)

    // const staffUserListItems = staffListItems ? userStore.util.getList('_id', staffListItems.map(staff => staff._user)) : [];

    // contacts/clientUser list 
    const contactList = userStore.lists && userStore.lists._firm ? userStore.lists._firm[match.params.firmId] : null;
    const contactListItems = userStore.util.getList('_firm', match.params.firmId);

    // address  list 
    const addressList = addressStore.lists && addressStore.lists._firm ? addressStore.lists._firm[match.params.firmId] : null;
    const addressListItems = addressStore.util.getList('_firm', match.params.firmId);

    // phone number list 
    const phoneNumberList = phoneNumberStore.lists && phoneNumberStore.lists._firm ? phoneNumberStore.lists._firm[match.params.firmId] : null;
    const phoneNumberListItems = phoneNumberStore.util.getList('_firm', match.params.firmId);    
                

    const isEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      firmStore.selected.isFetching
    )

    const clientsEmpty = (
      !utilClientStore
      || utilClientStore.didInvalidate
    );

    const clientsFetching = (
      !utilClientStore
      || utilClientStore.isFetching
    )

    const staffFetching = (
      !staffListItems
      || !staffList
      || staffList.isFetching
    )

    const staffEmpty = (
      !staffListItems
      || !staffList
    );

    const contactsFetching = (
      !contactListItems
      || !contactList
      || contactList.isFetching
    )

    const contactsEmpty = (
      !contactListItems
      || !contactList
    );

    // const activeStaff = staffListItems ? staffListItems.filter(s => s.status === 'active') : [];

    const subscription = selectedFirm && selectedFirm._subscription ? subscriptionStore.byId[selectedFirm._subscription] : null;
    let subStatus = classNames(
      'status-pill -subscription'
      , subscription ? subscription.status : null 
    )

    console.log('addressListItems', addressListItems);

    return (
      <PracticeFirmLayout>
        <Helmet><title>Firm Settings</title></Helmet>
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
          <div style={{ opacity: isFetching ? 0.5 : 1 }} className="-mob-layout-ytcol100">
            <div className="yt-row ">
              <div className="yt-col _70">
                <div className="-practice-content">

                  <p><strong>Firm name</strong></p>
                  { updateFirmNameOpen ? 
                    <div>
                      <p style={{fontSize: '1.5rem'}}> { selectedFirm ? selectedFirm.name : <span className="loading"/>}</p>
                      <TextInput
                        change={this._handleFormChange}
                        name="firmName"
                        value={this.state.firmName}
                        placeholder="Enter new firm name here..."
                      />
                      <button className="yt-btn x-small link" onClick={this._toggleUpdateFirmName}>Cancel</button>
                      <button
                        className="yt-btn x-small success" 
                        disabled={!this.state.firmName || !this.state.firmName.trim() || this.state.firmName.trim().length < 3}
                        onClick={this._handleUpdateFirmName}
                      >
                        Save
                      </button>
                    </div>
                  : 
                    <div>
                      <p style={{fontSize: '1.5rem'}}> { selectedFirm ? selectedFirm.name : <span className="loading"/>}</p>
                      {/* <button className="yt-btn x-small success" onClick={this._toggleUpdateFirmName}>Update</button> */}
                    </div>
                  }
                  <br/>
                  <p><strong>Logo</strong></p>
                  { firmLogo ?
                    <div className="-settings-firm-logo">
                      <img src={firmLogo}/>
                      <button
                        className="yt-btn link info  x-small"
                        onClick={() => this.setState({newImageFileOpen: true})}
                        type="button"
                      >
                        Update firm logo
                      </button>
                    </div>
                    :
                    <div className="-settings-firm-logo">
                    <div className="empty-state-hero">
                        <div>
                          <p className="u-centerText"><em>No logo?</em></p>
                          <button
                            className="yt-btn x-small"
                            onClick={() => this.setState({newImageFileOpen: true})}
                            type="button"
                          >
                            Add firm logo
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                  <br/>
                  <div className="addresses">
                    <p>
                      <strong>Primary address</strong>
                    </p>
                    { selectedFirm._primaryAddress && addressStore.byId[selectedFirm._primaryAddress] ? // make sure the primary address actually exists in the store.
                      <AddressCard
                        address={addressStore.byId[selectedFirm._primaryAddress]}
                        editable={true}
                        handleEditAddress={this._handleEditAddress}
                        isPrimary={true}
                      />
                      :
                      <p>
                        <em>No primary address on firm</em>
                      </p>
                    }
                    { selectedFirm._primaryAddress && addressListItems && addressListItems.length > 1
                      || !selectedFirm._primaryAddress && addressListItems && addressListItems.length > 0 ?
                      <div>
                        <p><strong>Additional addresses</strong></p>
                        <div className="yt-row with-gutters">
                          {addressListItems.map((address, i) => 
                            address && (address._id !== selectedFirm._primaryAddress) ? // The primary address will already be listed above.
                            <div key={"address_" + address._id + i} className="yt-col full s_50 m_33 l_25">
                              <AddressCard
                                address={address}
                                editable={true}
                                handleEditAddress={this._handleEditAddress}
                                isPrimary={false }
                                makePrimary={this._makePrimaryAddress}
                              />
                            </div>
                            :
                            null
                          )}
                        </div>
                      </div>
                      :
                      null
                    }
                  </div>
                  { this.state.isAddingAddress ?
                    <AddressEditor
                      pointers={{_firm: selectedFirm._id}}
                      onSubmit={this._handleNewAddress}
                      editorClasses="-quick-view"
                    />
                    :
                    <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link info x-small"><i className="fal fa-plus"/> Add address</button>
                  }
                </div>
              </div>
              <div className="yt-col _30">
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Subscription status:</strong></p>
                  </div>
                  { subscription ? 
                    <div>
                      <div className={subStatus}>{_.startCase(subscription.status).toUpperCase()}</div>
                      <br/>
                      <br/>
                      <p><strong>Staff licenses:</strong> {subscription.licenses}</p>
                      <div className="-quick-list">

                        { staffEmpty ?
                          (staffFetching ? <div><span><i className="fal fa-spinner fa-spin"/> </span> Loading active staff...</div> : <div>No active staff.</div>)
                          :
                          <Link to={`/firm/${match.params.firmId}/settings/staff`} className="-item">
                            <p><strong>Total active staff: </strong> {staffListItems.filter(item => item.status == 'active').length}</p>
                            <div className="-icon">
                              <i className="fal fa-angle-right"/>
                            </div>
                          </Link>
                        }
                      </div>
                      <button className="yt-btn link x-small" onClick={() => this.setState({addLicensesModal: true})}><i className="fal fa-user-plus"/> Add licenses</button>
                    </div>
                    :
                    <div className="empty-state-hero">
                      <div> 
                        <p className="u-centerText"><em>No subscription</em></p>
                        <em>Please <a href={`mailto:${brandingName.email.support}`}>{brandingName.email.support}</a> if you feel this is an error</em>
                      </div>
                    </div>
                  }
                </div>
                <div className="content-container">
                  <hr/>
                  <div className="yt-row space-between">
                    <p><strong>Clients & Contacts</strong></p>
                  </div>
                  <div className="-quick-list">
                    { clientsEmpty ?
                      (clientsFetching ? <div><span><i className="fal fa-spinner fa-spin"/> </span> Loading client stats...</div> : <div>No clients.</div>)
                      :
                      <Link to={`/firm/${match.params.firmId}/clients`} className="-item">
                        <p><strong>Total Clients: </strong> {utilClientStore && utilClientStore.items ? utilClientStore.items.length : 0}</p>
                        <div className="-icon">
                          <i className="fal fa-angle-right"/>
                        </div>
                      </Link>
                    }
                  </div>
                  <div className="-quick-list">
                    { contactsEmpty ?
                      (contactsFetching ? <div><span><i className="fal fa-spinner fa-spin"/> </span> Loading contact stats...</div> : <div>No contacts.</div>)
                      :
                      <Link to={`/firm/${match.params.firmId}/contacts`} className="-item">
                        <p><strong>Total Contacts: </strong> {contactList.items.length}</p>
                        <div className="-icon">
                          <i className="fal fa-angle-right"/>
                        </div>
                      </Link>
                    }
                  </div>
                </div>
              </div>
            </div>
            <AlertModal
              alertMessage={<div><p>Self-managed subscriptions coming soon.</p><p>In the meantime, please contact <a href={`mailto:${brandingName.email.sale}`}>{brandingName.email.sale}</a> to add more licenses.</p></div> }
              alertTitle="Manage licenses"
              closeAction={() => this.setState({addLicensesModal: false})}
              confirmAction={() => this.setState({addLicensesModal: false})}
              confirmText="Okay"
              isOpen={this.state.addLicensesModal}
              type="warning"
            />
          </div>
        }
        <NewImageModal
          close={() => this.setState({newImageFileOpen: false})}
          handleUploaded={this._handleNewImageFile}
          isOpen={this.state.newImageFileOpen}
          filePointers={{_firm: match.params.firmId, status: 'hidden'}}
        />
      </PracticeFirmLayout>
    )
  }
}

PracticeFirmOverview.propTypes = {
  dispatch: PropTypes.func.isRequired
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
    , fileStore: store.file
    , phoneNumberStore: store.phoneNumber 
    , staffStore: store.staff 
    , subscriptionStore: store.subscription 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeFirmOverview)
);
