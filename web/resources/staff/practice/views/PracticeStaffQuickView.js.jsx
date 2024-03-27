/**
 * View component for /firm/:firmId/settings/staff/:staffId
 * 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { DateTime } from 'luxon';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../staffActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';

// import resource components
import AddressCard from '../../../address/components/AddressCard.js.jsx';
import AddressEditor from '../../../address/components/AddressEditor.js.jsx';
import PhoneNumberEditor from '../../../phoneNumber/components/PhoneNumberEditor.js.jsx';
import PhoneNumberListItem from '../../../phoneNumber/components/PhoneNumberListItem.js.jsx';
import ProfilePic from '../../../user/components/ProfilePic.js.jsx';

class PracticeStaffQuickView extends Binder {
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
    }
    this._bind(
      '_handleEditPhone'
      , '_handleNewPhone'
      , '_handleEditAddress'
      , '_handleNewAddress'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    // get stuff for global nav 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));

    // get stuff for this view
    dispatch(staffActions.fetchSingleIfNeeded(match.params.staffId)).then(staffRes => {
      if(staffRes.success) {
        const staff = staffRes.item
        dispatch(addressActions.fetchListIfNeeded('_user', staff._user))
        dispatch(phoneNumberActions.fetchListIfNeeded('_user', staff._user))
      }
    });
  }

  _handleEditPhone(phoneNumberId) {
    this.setState({
      selectedPhoneId: phoneNumberId
      , isEditingPhone: true
    })
  }

  _handleNewPhone(phoneNumberId, userId) {
    const { dispatch } = this.props;
    if(phoneNumberId) {
      dispatch(phoneNumberActions.addPhoneNumberToList(phoneNumberId, '_user', userId))
    }
    this.setState({
      isAddingPhone: false
    });
  }
  
  _handleEditAddress(addressId) {
    this.setState({
      selectedAddressId: addressId
      , isEditingAddress: true
    })
  }

  _handleNewAddress(addressId, userId) {
    const { dispatch } = this.props;
    if(addressId && userId) {
      dispatch(addressActions.addAddressToList(addressId, '_user', userId))
    }
    this.setState({
      isAddingAddress: false
    });
  }

  render() {
    const { 
      addressStore
      , loggedInUser
      , match
      , phoneNumberStore
      , staffStore
      , userStore
    } = this.props;

    const selectedStaff = staffStore.selected.getItem();
    const selectedUser = selectedStaff ? userStore.byId[selectedStaff._user] : null;

    const addressList = selectedUser && addressStore.lists && addressStore.lists._user ? addressStore.lists._user[selectedUser._id] : null;
    const addressListItems = selectedUser ? addressStore.util.getList('_user', selectedUser._id) : null;

    const phoneNumberList = selectedUser && phoneNumberStore.lists && phoneNumberStore.lists._user ? phoneNumberStore.lists._user[selectedUser._id] : null;
    const phoneNumberListItems = selectedUser ? phoneNumberStore.util.getList('_user', selectedUser._id) : null;

    const primaryAddress = selectedUser && selectedUser._primaryAddress && addressListItems ? addressStore.byId[selectedUser._primaryAddress] : null;
    const primaryPhone = selectedUser && selectedUser._primaryPhone && phoneNumberListItems ? phoneNumberStore.byId[selectedUser._primaryPhone] : null;

    const isEmpty = (
      !addressListItems
      || !phoneNumberListItems
      || !selectedStaff
      || !selectedStaff._id
      || !selectedUser
      || !selectedUser._id
    );

    const isFetching = (
      staffStore.selected.isFetching
      || !addressList
      || addressList.isFetching
      || !phoneNumberList
      || phoneNumberList.isFetching
    )

    const hasEditPermission = (
      loggedInUser && (loggedInUser.isAdmin || (selectedUser && loggedInUser._id === selectedUser._id))
    )

    return (
      <div className="quick-view">
        <div className="-header">
          <Link to={`/firm/${match.params.firmId}/settings/staff`}>Close</Link>
        </div>
        { isEmpty ?
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
                  <small>{selectedUser.username}</small>
                </div>
              </div>
              <div className="-user-personal-info">
                <div className='-quick-view-field-wrapper'>
                  <label>Address{addressListItems && addressListItems.length > 1 ? 'es' : null}</label>
                  { primaryAddress ?
                    <AddressCard
                      address={primaryAddress}
                      editable={hasEditPermission}
                      handleEditAddress={this._handleEditAddress}
                    />
                    :
                    <em>No primary address on file</em>
                  }
                  { addressListItems && addressListItems.length > 0 ?
                    addressListItems.map((address, i) => 
                      address._id !== selectedUser._primaryAddress ? // The primary address will already be listed above.
                      <AddressCard
                        address={address}
                        editable={hasEditPermission}
                        handleEditAddress={this._handleEditAddress}
                        key={address._id + i}
                      />
                      :
                      null
                    )
                    :
                    null
                  }
                </div>
                { hasEditPermission ?
                    this.state.isAddingAddress ?
                    <AddressEditor
                      pointers={{_user: selectedUser._id}}
                      onSubmit={(addressId) => this._handleNewAddress(addressId, selectedUser._id)}
                      editorClasses="-quick-view"
                    />
                    :
                    <button onClick={() => this.setState({isAddingAddress: true})} className="yt-btn link x-small"><i className="fal fa-plus"/> Add address</button>
                  :
                  null
                }

                <div className='-quick-view-field-wrapper'>
                  <label>Phone</label>
                  { primaryPhone ?
                    hasEditPermission && this.state.isEditingPhone && this.state.selectedPhoneId === selectedUser._primaryPhone ?
                    <PhoneNumberEditor
                      editorClasses="-quick-view"
                      onSubmit={() => this.setState({isEditingPhone: false, selectedPhoneId: null})}
                      phoneNumberId={selectedUser._primaryPhone}
                    />
                    :
                    <PhoneNumberListItem
                      handleEditPhone={hasEditPermission ? this._handleEditPhone : null}
                      phoneNumber={primaryPhone}
                    />
                    :
                    <em>No primary phone on file</em>
                  }
                  { phoneNumberListItems && phoneNumberListItems.length > 0 ?
                    phoneNumberListItems.map((phoneNumber, i) =>
                      phoneNumber._id === selectedUser._primaryPhone ? // The primary phone will already be listed above.
                      null
                      :
                      hasEditPermission && this.state.isEditingPhone && this.state.selectedPhoneId === phoneNumber._id ?
                      <PhoneNumberEditor
                        editorClasses="-quick-view"
                        key={phoneNumber._id + i}
                        onSubmit={() => this.setState({isEditingPhone: false, selectedPhoneId: null})}
                        phoneNumberId={phoneNumber._id}
                      />
                      :
                      <PhoneNumberListItem
                        handleEditPhone={hasEditPermission ? this._handleEditPhone : null}
                        key={phoneNumber._id + i}
                        phoneNumber={phoneNumber}
                      />
                    )
                    :
                    null
                  }
                </div>
                { hasEditPermission ?
                    this.state.isAddingPhone ?
                    <PhoneNumberEditor
                      editorClasses="-quick-view"
                      onSubmit={(phoneNumberId) => this._handleNewPhone(phoneNumberId, selectedUser._id)}
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
                  :
                  null
                }
                <div className="-quick-view-field-wrapper">
                  <label>Account Permission</label>
                  <p>{selectedUser.permission || 'n/a'}</p>
                </div>
              </div>
              <Link to={`/firm/${match.params.firmId}/contacts/details/${selectedUser._id}`}>Details</Link>
            </div>
            <div className="-footer">

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
                showButtons={false}
              />
            </Modal>
          </div>
        }
      </div>
    )
  }
}

PracticeStaffQuickView.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeStaffQuickView.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    addressStore: store.address 
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber 
    , staffStore: store.staff
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeStaffQuickView)
);
