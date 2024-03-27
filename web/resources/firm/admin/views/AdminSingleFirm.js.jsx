/**
 * View component for /admin/firms/:firmId
 *
 * Displays a single firm from the 'byId' map in the firm reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

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
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import {
  SelectFromArray
  , TextInput 
  , ToggleSwitchInput
  , SelectFromObject
} from '../../../../global/components/forms';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import utils
import { fileUtils } from '../../../../global/utils';

// import resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import AdminClientListItem from '../../../client/admin/components/AdminClientListItem.js.jsx';
import AdminFirmLayout from '../components/AdminFirmLayout.js.jsx';
import AdminStaffListItem from '../../../staff/admin/components/AdminStaffListItem.js.jsx';
import AdminUpdateAssureSignModal from '../components/AdminUpdateAssureSignModal.js.jsx';
import InviteStaffModal from '../../../staff/components/InviteStaffModal.js.jsx';

import NewImageModal from '../../../file/components/NewImageModal.js.jsx'; 
import ManageLicensesModal from '../../../subscription/components/ManageLicensesModal.js.jsx';

import { DateTime } from 'luxon';
import classNames from 'classnames';

class AdminSingleFirm extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      apiKey: ''
      , apiUsername: ''
      , assureSignModalOpen: false
      , contextIdentifier: ''
      , contextUsername: ''
      , firmName: ''
      , firmSubDomain: null
      , inviteModalOpen: false
      , isAddingAddress: false
      , manageLicenses: false
      , newLicenses: 1
      , newImageFileOpen: false
      , selectedAddressId: null
      , selectedStaffId: null
      , showUpdateDomain: false
      , sending: false
      , success: false
      , selectedStaff: ""
      , selectedAssureSignUrl: ""
    }
    this._bind(
      '_cancelUpdateEsigCredentials'
      , '_createSubscription'
      , '_handleFormChange'
      , '_handleEditAddress'
      , '_handleNewAddress'
      , '_handleNewImageFile'
      , `_handleRemoveDomain`
      , '_handleRemoveLogo'
      , '_handleSelectedStaffChange'
      , '_handleUpdateDomain'
      , '_handleUpdateEsigCredentials'
      , '_handleUpdateName'
      , '_handleToggleESigAccess'
      , '_handleResendInvite'
      , '_makePrimaryAddress'
      , '_openAssureSignModal'
      , '_saveLicenses'
      , '_saveStatusChange'
      , '_handleToggleDeveloperAccess'
      , '_handleAssureSignUrl'
    )

  }  

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(addressActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId)).then(firmRes => {
      if(firmRes.item._file) {
        dispatch(fileActions.fetchSingleIfNeeded(firmRes.item._file)); 
      }
    })
    // dispatch(phoneNumberActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(subscriptionActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
  }

  componentDidUpdate(nextProps) {
    const { dispatch, firmStore, match, subscriptionStore } = nextProps;
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
  }

  _createSubscription() {
    const { dispatch, firmStore, match } = this.props;
    dispatch(subscriptionActions.sendCreateSubscription({ _firm: match.params.firmId })).then(subRes => {
      if(subRes.success) {
        let firm = _.cloneDeep(firmStore.selected.getItem());
        firm._subscription = subRes.item._id;
        dispatch(firmActions.sendUpdateFirm(firm));
      }
    });
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState)
  }

  _handleUpdateName() {

  }

  _handleUpdateDomain() {
    console.log('_handleUpdateDomain')
    const { dispatch, firmStore, match } = this.props;
    let updatedFirm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    updatedFirm.domain = this.state.firmSubDomain + '.' + brandingName.host;
    dispatch(firmActions.sendUpdateFirm(updatedFirm)).then(firmRes => {
      this.setState({
        showUpdateDomain: false 
      })
    })
  }

  _handleRemoveDomain() {
    console.log('_handleRemoveDomain')
    const { dispatch, firmStore, match } = this.props;
    let updatedFirm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    updatedFirm.domain = null;
    dispatch(firmActions.sendUpdateFirm(updatedFirm)).then(firmRes => {
      this.setState({
        showUpdateDomain: false 
      })
    })
  }


  _handleEditAddress(addressId) {
    this.setState({
      selectedAddressId: addressId
      , isEditingAddress: true
    })
  }

  _handleRemoveLogo() {
    const { dispatch, firmStore, match } = this.props;
    let updatedFirm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    updatedFirm._file = null;
    updatedFirm.logoUrl = null;
    dispatch(firmActions.sendUpdateFirm(updatedFirm));
  }

  _makePrimaryAddress(addressId) {
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

  _handleSelectedStaffChange(e) {
    const { staffStore, userStore } = this.props;
    // e.target.value should be the staffId that was selected.
    const selectedStaff = staffStore.byId[e.target.value];
    // Grab the user object to we have access to the username.
    const selectedUser = userStore.byId[selectedStaff._user];
    this.setState({
      selectedStaffId: e.target.value
      , contextUsername: selectedUser.username
      , apiKey: selectedStaff.apiKey || ''
      , apiUsername: selectedStaff.apiUsername || ''
    })
  }

  _handleResendInvite(user, owner, firm = null) {

    this.setState({sending: true});
    this.setState({selectedStaff: user._id});
    const { dispatch, firmStore } = this.props;

    if(!firm)
      firm = firmStore.selected.getItem();

    let sendData = {
      invitations: [
        {
          email: user.username,
          fullName: user.firstname + " " + user.lastname,
          owner: owner
        }
      ]
      , personalNote: '' 
    }
    try {
      dispatch(staffActions.sendInviteStaff(firm._id, sendData)).then(staffRes => {
        this.setState({sending: false});
        if(staffRes.success) {
          this.setState({success: true});
          setTimeout(() => {
            this.setState({success: false});
            this.setState({selectedStaff: ""});
          }, 2000)
          console.log("Successfully Resend the invite");
        } else {
          alert("ERROR - Check logs");
        }
      });
    } catch(err) {
      this.setState({sending: false});
      this.setState({selectedStaff: ""});
    }

  }

  _saveStatusChange() {
    if(!this.state.status) {
      alert("You must select a status");
    } else {
      const { dispatch, firmStore, match, subscriptionStore } = this.props;
      let sub = _.cloneDeep(subscriptionStore.byId[firmStore.selected.getItem()._subscription]);
      sub.status= this.state.status;
      dispatch(subscriptionActions.sendUpdateSubscription(sub)).then((action) => {
        if(action.success) {
          this.setState({
            changePublishStatus: false
            , status: ''
          });
        } else {
          // console.log("Response Error:");
          // console.log(action);
          alert(`ERROR: ${action.error}`);
        }
      });
    }
  }

  _saveLicenses() {
    this.setState({submitting: true});
    const { dispatch, firmStore, match, subscriptionStore } = this.props;
    let sub = _.cloneDeep(subscriptionStore.byId[firmStore.selected.getItem()._subscription]);
    sub.licenses= this.state.newLicenses;
    dispatch(subscriptionActions.sendUpdateSubscription(sub)).then((action) => {
      if(action.success) {
        this.setState({
          manageLicenses: false
          , submitting: false
        });
      } else {
        // console.log("Response Error:");
        // console.log(action);
        alert(`ERROR: ${action.error}`);
      }
    });
  }

  _handleNewImageFile(file) {
    const newFirm = _.cloneDeep(this.props.firmStore.selected.getItem()); 
    newFirm._file = file._id; 
    newFirm.logoUrl = file.filename; // NOTE: this is JUST the filename NOT the full path
    this.props.dispatch(fileActions.fetchSingleIfNeeded(file._id)); 
    this.props.dispatch(firmActions.sendUpdateFirm(newFirm)).then((json) => {
      this.setState({newImageFileOpen: false}); 
    })
  }

  _handleToggleESigAccess() {
    const newFirm = _.cloneDeep(this.props.firmStore.selected.getItem()); 
    if(newFirm.eSigAccess) {
      newFirm.eSigAccess = false;
    } else {
      newFirm.eSigAccess = true; 
    }

    this.props.dispatch(firmActions.sendUpdateFirm(newFirm)); 
  }

  _handleToggleDeveloperAccess() {
    const newFirm = _.cloneDeep(this.props.firmStore.selected.getItem()); 

    if(newFirm.developer_account) {
      newFirm.developer_account = false;
    } else {
      newFirm.developer_account = true; 
    }

    this.props.dispatch(firmActions.sendUpdateFirm(newFirm)); 
  }

  _openAssureSignModal() {
    const { firmStore, match } = this.props;
    const firm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    this.setState({
      assureSignModalOpen: true
      , contextIdentifier: firm.contextIdentifier
    })
  }

  _handleUpdateEsigCredentials() {
    const { dispatch, firmStore, loggedInUser, match, staffStore } = this.props;
    let updatedFirm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    let updatedStaff = _.cloneDeep(staffStore.byId[this.state.selectedStaffId]);
    updatedStaff.apiUsername = this.state.apiUsername;
    updatedStaff.apiKey = this.state.apiKey;
    updatedStaff.contextUsername = this.state.contextUsername;
    updatedStaff.eSigAccess = true;
    updatedStaff._eSigGrantedBy = loggedInUser._id;
    updatedFirm.contextIdentifier = this.state.contextIdentifier;
    dispatch(staffActions.sendUpdateStaff(updatedStaff)).then(staffRes => {
      if(!staffRes.success) {
        alert(staffRes.error)
      } else {
        dispatch(firmActions.sendUpdateFirm(updatedFirm)).then(firmRes => {
          this.setState({
            assureSignModalOpen: false
            , apiKey: ''
            , apiUsername: ''
            , contextIdentifier: ''
            , contextUsername: ''
            , selectedStaffId: null
          });
        });
      }
    });
  }

  _cancelUpdateEsigCredentials() {
    this.setState({
      assureSignModalOpen: false
      , apiKey: ''
      , apiUsername: ''
      , contextIdentifier: ''
      , contextUsername: ''
      , selectedStaffId: null
    });
  }

  _handleBuildStaffUserList(staffListItems) {
    const { userStore } = this.props;
    const staffUserListItems = [];
    staffListItems.forEach(staff => {
      const user = userStore.byId[staff._user]
      if(user) {
        const staffUserItem = {
          _id: staff._id
          , displayName: `${user.firstname} ${user.lastname} - ${user.username}`
        }
        staffUserListItems.push(staffUserItem)
      }
    })
    return staffUserListItems;
  }

  _handleAssureSignUrl(e) {
    const { firmStore, dispatch, match } = this.props
    const { value, name } = e.target;

    let url;
    url = value;

    let newState = _.update( this.state, name, function() {
      return url;
    });

    this.setState({newState});

    let updatedFirm = _.cloneDeep(firmStore.byId[match.params.firmId]);
    updatedFirm.assureSign_url = newState.selectedAssureSignUrl;
    dispatch(firmActions.sendUpdateFirm(updatedFirm));
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

    const { selectedAssureSignUrl } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */
    const selectedFirm = firmStore.selected.getItem();
    let firmLogo = '';
    if (selectedFirm && selectedFirm._id && selectedFirm.logoUrl) {
      firmLogo = `/api/firms/logo/${selectedFirm._id}/${selectedFirm.logoUrl}`;
    }

    const clientList = clientStore.lists && clientStore.lists._firm ? clientStore.lists._firm[match.params.firmId] : null;
    const clientListItems = clientStore.util.getList('_firm', match.params.firmId)

    const staffList = staffStore.lists && staffStore.lists._firm ? staffStore.lists._firm[match.params.firmId] : null;
    const staffListItems = staffStore.util.getList('_firm', match.params.firmId)

    const staffOwnerListItems = staffListItems ? staffListItems.filter(staff => staff.owner) : []
    const staffUserListItems = staffOwnerListItems ? this._handleBuildStaffUserList(staffOwnerListItems) : []
    
    // const staffUserListItems = staffListItems ? userStore.util.getList('_id', staffListItems.map(staff => staff._user)) : [];

    const contactList = userStore.lists && userStore.lists._firm ? userStore.lists._firm[match.params.firmId] : null;
    const contactListItems = userStore.util.getList('_firm', match.params.firmId);

    const addressList = addressStore.lists && addressStore.lists._firm ? addressStore.lists._firm[match.params.firmId] : null;
    const addressListItems = addressStore.util.getList('_firm', match.params.firmId);

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
      !clientListItems
      || !clientList
    );

    const clientsFetching = (
      !clientListItems
      || !clientList
      || clientList.isFetching
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



    const activeStaff = staffListItems ? staffListItems.filter(s => s.status === 'active') : [];

    const subscription = selectedFirm && selectedFirm._subscription ? subscriptionStore.byId[selectedFirm._subscription] : null;
   
    let subStatus = classNames(
      'status-pill -subscription'
      , subscription ? subscription.status : null 
    )

    const assureSignUrls = [
      {
        value: '', name: 'Default'
      },
      {
        value: 'https://sb.assuresign.net/api/documentnow/v3.5', name: 'Demo'
      },
      {
        value: 'https://www.assuresign.net/api/documentnow/v3.5', name:'Prod'
      },
    ]

    return (
      <AdminFirmLayout>
        <Helmet><title>Admin Single Firm</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} classes="-admin"/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row with-gutters">
              <div className="yt-col full s_60 m_70">
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>General firm info</strong></p>
                    <div>
                      <Link to={`/firm/${selectedFirm._id}`} target="_blank" className="yt-btn x-small link info">Go to firm view <i className="fad fa-external-link"/></Link>
                    </div>
                  </div>
                  <div className="-settings-card-info">
                  
                    <div className="-info">
                      <small><strong>Firm name</strong></small>
                      <p style={{fontSize: '2rem'}}> { selectedFirm.name }</p>
                    </div>
                    <div>
                      <Link to={`${this.props.match.url}/update`} className="yt-btn link info x-small"> Edit firm name</Link>
                    </div>
                  </div>
                  <div className="-settings-card-info">
                    { this.state.showUpdateDomain ?
                      <div className="-info">
                        <small><strong>Domain</strong></small>
                    
                        <div className="input-group -cdn-input">
                          <div className="input-add-on ">
                            <span className="item -prefix" onClick={this._setFocus}>
                              https://
                            </span>
                            <input
                              className="field"
                              name="firmSubDomain"
                              onChange={this._handleFormChange}
                              type="text"
                              value={this.state.firmSubDomain}
                            />
                            <span className="item">.{brandingName.host}</span>
                          </div>
                        </div>
                      </div>
                      :
                      <div className="-info">
                        <small><strong>Domain</strong></small>
                        <p>
                          {selectedFirm.domain ?
                            <a href={`https://${selectedFirm.domain}`} target="_blank"> { selectedFirm.domain } <i className="fad fa-external-link fa-sm"/></a>
                            :
                            <em>Add a custom domain</em>
                          }
                        </p>
                      </div>
                    }
                    <div>
                      {this.state.showUpdateDomain ?
                        <div>
                          <button 
                            className="yt-btn info link x-small"
                            disabled={!this.state.firmSubDomain || !this.state.firmSubDomain.trim() || this.state.firmSubDomain.trim().length < 3}
                            onClick={this._handleUpdateDomain}
                          >
                            Save
                          </button>
                          <button
                            className="yt-btn link muted  x-small"
                            onClick={() => this.setState({
                              firmSubDomain: null
                              , showUpdateDomain: false 
                            })} 
                          >
                            Cancel
                          </button>
                          <br/>
                          <button
                            className="yt-btn danger link x-small"
                            disabled={!selectedFirm.domain}
                            onClick={this._handleRemoveDomain}
                          >
                            Remove Subdomain
                          </button>
                        </div>
                        :
                        <button 
                          className="yt-btn link info x-small"
                          onClick={() => this.setState({
                            firmSubDomain: selectedFirm.domain ? selectedFirm.domain.split('.')[0] : ''
                            , showUpdateDomain: true 
                          })} 
                        > 
                          Edit domain
                        </button>
                      }
                    </div>
                  </div>
                  <small><em>NOTE: Any changes to the custom domain can take several hours to go through.</em></small>
                  <br/>
                  <br/>
                  <div className="-settings-card-info">
                    <div className="-info">
                      <small><strong>Logo</strong></small>
                      { firmLogo ?
                        <div className="-settings-firm-logo">
                          <img src={firmLogo}/>
                        </div>
                        :
                        <div className="-settings-firm-logo">
                          <div className="empty-state-hero">
                            <div style={{padding: '8px'}}>
                              <p className="u-centerText">
                                <em>Upload firm logo</em>
                                <br/>
                                <small className="u-centerText"><em>Recommended dimensions - 200x60</em></small>
                                <br/>
                                <small className="u-centerText"><em>Should be visible on white background</em></small>
                              </p>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                    <div>
                      { firmLogo ?
                        <div>
                          <button
                            className="yt-btn link info  x-small"
                            onClick={() => this.setState({newImageFileOpen: true})}
                            type="button"
                          >
                            Update logo
                          </button>
                          <br/>
                          <button 
                            className="yt-btn link danger x-small"
                            onClick={this._handleRemoveLogo}
                            type="button"
                          >
                            Remove logo
                          </button>
                        </div>
                        :
                        <button
                          className="yt-btn x-small"
                          onClick={() => this.setState({newImageFileOpen: true})}
                          type="button"
                        >
                          Add firm logo
                        </button>
                      }
                    </div>
                  </div>
                  <div className="-settings-card-info">
                    <div className="-info">
                      <p>
                        <strong>AssureSign URL</strong>
                      </p>
                      <SelectFromObject
                        change={this._handleAssureSignUrl}
                        name="selectedAssureSignUrl"
                        items={assureSignUrls}
                        placeholder="Select default AssureSign URL..."
                        required={false}
                        value="value"
                        selected={selectedFirm.assureSign_url ? selectedFirm.assureSign_url : selectedAssureSignUrl}
                        display="name"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="-settings-card-info">
                      <div className="-info">
                        <ToggleSwitchInput
                          change={this._handleToggleESigAccess}
                          label={"E-Signature Access"}
                          name={"eSigAccess"}
                          rounded={true}
                          value={selectedFirm.eSigAccess}
                        />
                      </div>
                      { selectedFirm.eSigAccess ?
                        <button
                          className="yt-btn link info x-small"
                          onClick={this._openAssureSignModal}
                          type="button"
                        >
                          Edit Credentials
                        </button>
                        :
                        null
                      }
                    </div>
                    <div className="-settings-card-info">
                      <div className="-info">
                        <ToggleSwitchInput
                          change={this._handleToggleDeveloperAccess}
                          label={"Developer Access"}
                          name={"developer_account"}
                          rounded={true}
                          value={selectedFirm.developer_account}
                        />
                      </div>
                    </div>
                  </div>
                  
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
                        <em>No primary address on file</em>
                      </p>
                    }
                    <hr/>
                    <p><strong>Additional addresses</strong></p>
                    <div className="yt-container">
                      { addressListItems && addressListItems.length > 0 ?
                        addressListItems.map((address, i) => 
                          address._id !== selectedFirm._primaryAddress ? // The primary address will already be listed above.
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
                          )
                        :
                        null
                      }
                    </div>
                    <div className="yt-container">
                      { this.state.isAddingAddress ?
                        <AddressEditor
                          pointers={{_firm: selectedFirm._id}}
                          onSubmit={this._handleNewAddress}
                          editorClasses="-quick-view"
                        />
                        :
                        <div>
                          <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link info x-small"><i className="fal fa-plus"/> Add address</button>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Staff</strong></p>
                    <button className="yt-btn x-small" onClick={() => this.setState({inviteModalOpen: true})}>Invite Staff Members </button>
                    {/* <Link className="yt-btn  x-small " to={`/admin/staff/new?firm=${match.params.firmId}`}> Invite Staff Members</Link> */}
                  </div>
                  <hr/>
                  <div className="admin-table-wrapper">
                    <table className="yt-table striped">
                      { subscription && activeStaff.length > subscription.licenses ? 
                        <caption className="u-danger"><strong>WARNING:</strong> The number of active licenses ({activeStaff.length}) exceeds the purchased subscription licenses ({subscription.licenses}) </caption>
                        : !subscription ?
                        <caption className="u-danger"><strong>WARNING:</strong> This firm has no active subscription</caption>
                        : 
                        <caption>Using {activeStaff.length} of {subscription ? subscription.licenses : 0} active licenses</caption>
                      }
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Permissions</th>
                          <th>Status</th>
                          <th></th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        { staffEmpty ?
                          (staffFetching ? <tr><td>Loading staff...</td></tr> : <tr><td>No Staff.</td></tr>)
                          :
                          staffListItems.map((staff, i) =>
                            <AdminStaffListItem
                              key={'staff_' + staff._id + "_" + i}
                              staff={staff}
                              user={userStore.byId[staff._user]}
                              selectedFirm={staff._firm}
                              handleResendInvite={this._handleResendInvite}
                              sending={this.state.sending}
                              success={this.state.success}
                              selectedStaff={this.state.selectedStaff}
                            />
                          )
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="yt-col full s_40 m_30">
                {/* <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Firm Logo</strong></p>
                  </div>
                  <hr/>
                  
                  { logoUrl ?
                    <div className="-settings-firm-logo">
                      <img src={logoUrl}/>
                      <button
                        className="yt-btn link info block x-small"
                        onClick={() => this.setState({newImageFileOpen: true})}
                        type="button"
                      >
                        Update Firm Logo
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
                            Add Firm Logo
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div> */}
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Subscription info</strong></p>
                  </div>
                  <hr/>
                  { subscription ? 
                    <div>
                      <ManageLicensesModal 
                        close={() => this.setState({manageLicenses: false})}
                        isOpen={this.state.manageLicenses}
                        numActiveStaff={activeStaff.length}
                        subscription={subscription}
                      />
                      <p>
                        Created on {DateTime.fromISO(subscription.created_at).toLocaleString(DateTime.DATETIME_MED)}
                        { subscription._createdBy && userMap[subscription._createdBy] ?
                          <span> by
                            <Link to={`/admin/users/${subscription._createdBy}`} target="_blank"> {userMap[subscription._createdBy].username}</Link>
                          </span>
                          : null
                        }
                      </p>
                      { subscription.created_at != subscription.updated_at ? 
                        <p><small><em>Last updated {DateTime.fromISO(subscription.updated_at).toLocaleString(DateTime.DATETIME_MED)}</em></small></p>
                        :
                        null 
                      }
                      <br/>
                      <div className="yt-row space-between center-vert">
                        <span><strong>Licenses:</strong> {subscription.licenses}</span>
                      
                        <button className="yt-btn x-small link info" onClick={()=> this.setState({manageLicenses: true, newLicenses: subscription.licenses + 1})}><i className="fal fa-users-medical"/> Add licenses</button>
                      </div>
                      <br/>
                      <p><strong>Status:</strong></p>
                      { this.state.changePublishStatus ?
                        <div>
                          <SelectFromArray
                            items={[
                              'trialing'
                              , 'active'
                              , 'incomplete'
                              , 'incomplete_expired'
                              , 'past_due'
                              , 'canceled'
                              , 'unpaid'
                            ]}
                            change={this._handleFormChange}
                            name="status"
                            value={subscription.status}
                          />
                          <div>
                            <button className="yt-btn x-small danger link" onClick={()=> this.setState({changePublishStatus: false})}>cancel</button>
                            <button className="yt-btn x-small info" onClick={()=> this._saveStatusChange()}>save</button>
                          </div>
                        </div>
                        :
                        <div>
                          <div className={subStatus}>{_.startCase(subscription.status).toUpperCase()}</div>
                          <button className="yt-btn x-small link danger" onClick={()=> this.setState({changePublishStatus: true})}>change</button>
                        </div>
                      }
                    </div>
                    :
                    <div className="empty-state-hero">
                      <div> 
                        <p className="u-centerText"><em>No subscription</em></p>
                        <button onClick={this._createSubscription} className="yt-btn x-small">Create Subscription</button>
                      </div>
                    </div>
                  }
                </div>
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Clients & Contacts</strong></p>
                  </div>
                  <hr/>
                  <div className="-quick-list">

                    { clientsEmpty ?
                      (clientsFetching ? <div><span><i className="fal fa-spinner fa-spin"/> </span> Loading client stats...</div> : <div>No clients.</div>)
                      :
                      <Link to={`/admin/firms/${match.params.firmId}/clients`} className="-item">
                        <p><strong>Total Clients: </strong> {clientList.items.length}</p>
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
                      <Link to={`/admin/firms/${match.params.firmId}/contacts`} className="-item">
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
            <InviteStaffModal
              close={() => this.setState({inviteModalOpen: false})}
              firm={selectedFirm}
              isOpen={this.state.inviteModalOpen}
              maxInvites={subscription ? subscription.licenses - activeStaff.length : 0}
            />
            <NewImageModal
              close={() => this.setState({newImageFileOpen: false})}
              handleUploaded={this._handleNewImageFile}
              isOpen={this.state.newImageFileOpen}
              filePointers={{_firm: match.params.firmId}}
            />
            <AdminUpdateAssureSignModal
              apiKey={this.state.apiKey}
              apiUsername={this.state.apiUsername}
              availableStaff={staffUserListItems}
              close={this._cancelUpdateEsigCredentials}
              contextIdentifier={this.state.contextIdentifier}
              handleFormChange={this._handleFormChange}
              handleFormSubmit={this._handleUpdateEsigCredentials}
              handleStaffChange={this._handleSelectedStaffChange}
              isOpen={this.state.assureSignModalOpen}
              selectedStaffId={this.state.selectedStaffId}
            />
          </div>
        }
      </AdminFirmLayout>
    )
  }
}

AdminSingleFirm.propTypes = {
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
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber 
    , staffStore: store.staff 
    , subscriptionStore: store.subscription 
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleFirm)
);
