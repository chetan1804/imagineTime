/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries


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
import ProfilePic from '../../../../global/components/navigation/ProfilePic.js.jsx';

// import resource components


class AccountUsers extends Binder {
  constructor(props) {
    super(props);
    this.state = {

    }
    this._bind(

    )
  }

  // Moved all of these fetches from this sub-view to the parent view (AccountInfo) because most of the data is also needed in the other sub-view (ClientSettingsOverview).
  // componentDidMount() {
  //   const { dispatch, loggedInUser, clientId } = this.props;
  //   dispatch(addressActions.fetchListIfNeeded('_client', clientId));
  //   dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
  //   dispatch(clientActions.fetchSingleIfNeeded(clientId)).then(clientRes => {
  //     if(clientRes.success) {
  //       const client = clientRes.item;
  //       if(client._primaryAddress) {
  //         dispatch(addressActions.fetchSingleIfNeeded(client._primaryAddress))
  //       }
  //       if(client._primaryPhone) {
  //         dispatch(phoneNumberActions.fetchSingleIfNeeded(client._primaryPhone))
  //       }
  //       dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
  //       dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
  //       dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
  //     }
  //   });
  //   dispatch(clientUserActions.fetchListIfNeeded('_client', clientId)).then(cuRes => {
  //     if(cuRes.success) {
  //       cuRes.list.forEach(cu => {
  //         dispatch(addressActions.fetchListIfNeeded('_user', cu._user));
  //         dispatch(phoneNumberActions.fetchListIfNeeded('_user', cu._user));
  //       })
  //     }
  //   });
  //   dispatch(phoneNumberActions.fetchListIfNeeded('_client', clientId));
  //   dispatch(staffClientActions.fetchListIfNeeded('_client', clientId)).then(staffRes => {
  //     if(staffRes.success) {
  //       staffRes.list.forEach(s => {
  //         dispatch(addressActions.fetchListIfNeeded('_user', s._user));
  //         dispatch(phoneNumberActions.fetchListIfNeeded('_user', s._user));
  //       })
  //     }
  //   });
  //   dispatch(userActions.fetchListIfNeeded('_client', clientId));
  // }

  render() {
    const {
      match
      , clientId
      , clientStore
      , clientUserStore
      , firmStore
      , loggedInUser
      , staffClientStore
      , userStore
    } = this.props;

    const selectedFirm = firmStore.selected.getItem();
    const selectedClient = clientStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', clientId);

    // staffClient  list 
    const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[clientId] : null;
    const staffClientListItems = staffClientStore.util.getList('_client', clientId);
    
    return (
      <div className="-portal-content">
        <h2>Users</h2>
        <h3>Users in {selectedClient.name}</h3>
        <div className="-contact-list">

          {clientUserListItems ? 
            clientUserListItems.map((cu, i) =>
              userStore.byId[cu._user] ? 
                <div className="-contact-card" key={cu._id + '_cu_' + i}>
                  <div className="yt-row">
                    <ProfilePic user={userStore.byId[cu._user]}/>
                    <div>
                      <div className="-name">{userStore.byId[cu._user].firstname} {userStore.byId[cu._user].lastname} {cu._user == loggedInUser._id ? "(You)" : null}</div>
                      <small>{userStore.byId[cu._user].username}</small>
                    </div>
                  </div>
                </div>
              :
              <i className="fal fa-spinner fa-spin" key={cu._id + '_cu_' + i}/>
            )
            :
            <p><em>No contacts yet</em></p>
          }
          <div className="-portal-content">
            <h3>{selectedFirm.name} users in {selectedClient.name}</h3>
            <div className="-contact-list">

              {staffClientListItems ? 
                staffClientListItems.map((sc, i) =>
                  userStore.byId[sc._user] ? 
                    <div className="-contact-card" key={sc._id + '_sc_' + i}>
                      <div className="yt-row">
                        <ProfilePic user={userStore.byId[sc._user]}/>
                        <div>
                          <div className="-name">{userStore.byId[sc._user].firstname} {userStore.byId[sc._user].lastname} {sc._user == loggedInUser._id ? "(You)" : null}</div>
                          <small>{userStore.byId[sc._user].username}</small>
                        </div>
                      </div>
                    </div>
                  :
                  <i className="fal fa-spinner fa-spin" key={sc._id + '_sc_' + i}/>
                )
                :
                <p><em>No contacts yet</em></p>
              }
            </div>
          </div>
        </div>
      </div>
    )
  }
}

AccountUsers.propTypes = {
  dispatch: PropTypes.func.isRequired
}

AccountUsers.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientUserStore: store.clientUser
    , clientStore: store.client
    , firmStore: store.firm
    , staffClientStore: store.staffClient 
    , userStore: store.user
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(AccountUsers)
);
