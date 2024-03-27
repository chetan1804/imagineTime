/**
 * View component for /admin/clients/:clientId
 *
 * Displays a single client from the 'byId' map in the client reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';


// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientLayout from '../components/AdminClientLayout.js.jsx';

import { DateTime } from 'luxon';


class AdminSingleClient extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
        dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm))
        dispatch(staffActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firm', clientRes.item._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', clientRes.item._firm));
      } 
    });
    // dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId)).then(cuRes => {
    //   if(cuRes.success) {
    //     const userIds = cuRes.list.map(cu => cu._user);
    //     const uniqIds = Array.from(new Set(userIds));
    //     dispatch(userActions.fetchListIfNeeded('_id', uniqIds));
    //   }
    // })
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));

    
  }

  render() {
    const { 
      clientStore 
      , clientUserStore 
      , firmStore 
      , location
      , match
      , staffClientStore
      , userStore 
    } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual client object from the map
     */
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId)
    // console.log(clientUserList);
    // console.log(clientUserListItems);
    const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[match.params.clientId] : null;
    const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId)

    const isEmpty = (
      !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
    );

    const isFetching = (
      clientStore.selected.isFetching
    )

    const clientUsersEmpty = (
      !clientUserListItems
      || !clientUserList
    );

    const clientUsersFetching = (
      !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
    )

    const staffClientsEmpty = (
      !staffClientListItems
      || !staffClientList
    );

    const staffClientsFetching = (
      !staffClientListItems
      || !staffClientList
      || staffClientList.isFetching
    )

    return (
      <AdminClientLayout>
        <Helmet>
          <title>Admin Single Client</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Client </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="yt-row with-gutters">
              <div className="yt-col full s_60 m_70">
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>General client info</strong></p>
                    <div>
                      <Link to={`/portal/${selectedClient._id}`} target="_blank" className="yt-btn x-small link info">Go to portal view <i className="fad fa-external-link"/></Link>
                    </div>
                  </div>
                  <hr/>
                  <h1> { selectedClient.name }
                  </h1>
                  <hr/>
                  <p> <strong>Firm: </strong> { selectedFirm ? selectedFirm.name : ''}</p>
                  <br/>
                  <Link to={`${this.props.match.url}/update`}> Update Client </Link>
                </div>
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Client's contacts</strong></p>
                    <Link className="yt-btn x-small" to={`/admin/client-users/new?client=${match.params.clientId}`}> Add Contact</Link>
                  </div>
                  <hr/>                  
                  <div className="admin-table-wrapper">
                    <table className="yt-table striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Last modified</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        { clientUsersEmpty  ?
                          (clientUsersFetching ? <tr><td>Loading contacts...</td></tr> : <tr><td>No contacts.</td></tr>)
                          :
                          clientUserListItems.map((cu, i) =>
                            <tr key={cu._id + i}>
                              <td>{userStore.byId[cu._user] ? `${userStore.byId[cu._user].firstname} ${userStore.byId[cu._user].lastname}` : 'loading'}</td>
                              <td>{userStore.byId[cu._user] ? userStore.byId[cu._user].username : ''}</td>
                              <td>{DateTime.fromISO(cu.updated_at).toLocaleString(DateTime.DATE_SHORT)}</td>
                              <td><Link to={`/admin/clients/${match.params.clientId}/client-users/${cu._id}/update`}>Update</Link></td>
                            </tr>
                          )
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="content-container">
                  <div className="yt-row space-between">
                    <p><strong>Assinged staff</strong></p>
                    <Link className="yt-btn x-small" to={`/admin/staff-clients/new?client=${match.params.clientId}`}> Add Staff</Link>
                  </div>
                  <hr/>
                  <div className="admin-table-wrapper">
                    <table className="yt-table striped">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Last modified</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        { staffClientsEmpty  ?
                          (staffClientsFetching ? <tr><td>Loading contacts...</td></tr> : <tr><td>No staff.</td></tr>)
                          :
                          staffClientListItems.map((su, i) =>
                            <tr key={su._id + i}>
                              <td>{userStore.byId[su._user] ? `${userStore.byId[su._user].firstname} ${userStore.byId[su._user].lastname}` : 'loading'}</td>
                              <td>{userStore.byId[su._user] ? userStore.byId[su._user].username : ''}</td>
                              <td>{DateTime.fromISO(su.updated_at).toLocaleString(DateTime.DATE_SHORT)}</td>
                              <td><Link to={`/admin/clients/${match.params.clientId}/staff-clients/${su._id}/update`}>Update</Link></td>
                            </tr>
                          )
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </AdminClientLayout>
    )
  }
}

AdminSingleClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientStore: store.client
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , staffClientStore: store.staffClient 
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleClient)
);
