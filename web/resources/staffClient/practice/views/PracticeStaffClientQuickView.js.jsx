/**
 * View component for /firm/:firmId/clients/:clientId/staff/:staffId
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';

// import actions
import * as activityActions from '../../../activity/activityActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../staffClientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
// import resource components
import ProfilePic from '../../../user/components/ProfilePic.js.jsx';

class PracticeStaffClientQuickview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      fetchingStaffClient: false
      , viewing: 'activity'
      , confirmUnassignStaffModalOpen: false
    }
    this._bind(
      '_formatActivityText'
      , '_goBack'
      , '_handleToggleNotifications'
      , '_handleUnassignStaff'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    // get stuff for global nav 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));

    // get stuff for this view 
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId))
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchSingleIfNeeded(match.params.staffId)).then(staffRes => {
      if(staffRes.success) {
        // Fetch this staff member's activity related to this client.
        dispatch(activityActions.fetchListIfNeeded('_user', staffRes.item._user, '_client', match.params.clientId))
      }
    });
    // get list of all clients that this staff member is assigned to.
    dispatch(staffClientActions.fetchListIfNeeded('_staff', match.params.staffId));

    dispatch(userActions.fetchListIfNeeded('_client', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
  }

  _goBack() {
    this.props.history.goBack();
  }

  _formatActivityText(activity) {
    const { loggedInUser, userStore } = this.props;
    const user = userStore.byId[activity._user]
    const displayName = user._id === loggedInUser._id ? 'You' : user.firstname;
    return activity.text.replace('%USER%', displayName) // customize output
  }

  _handleToggleNotifications(selectedStaffClient) {
    const { dispatch } = this.props;
    this.setState({
      fetchingStaffClient: true
    })
    if(selectedStaffClient && selectedStaffClient._id) {
      let newStaffClient = _.cloneDeep(selectedStaffClient)
      newStaffClient.sendNotifs = !newStaffClient.sendNotifs
      dispatch(staffClientActions.sendUpdateStaffClient(newStaffClient)).then(scRes => {
        this.setState({
          fetchingStaffClient: false
        })
      });
    }
  }

  _handleUnassignStaff(staffClientId) {
    const { dispatch, history, match } = this.props;
    if(staffClientId) {
      // This is the list used on the main client settings list. Make sure it refetches if/when the user navigates back.
      dispatch(staffClientActions.invalidateList('_firm', match.params.firmId));
      // These two lists are used on this view and PracticeStaffClientQuickView. Remove the item so we don't need to refetch.
      dispatch(staffClientActions.removeStaffClientFromList(staffClientId, '_client', match.params.clientId));
      dispatch(staffClientActions.removeStaffClientFromList(staffClientId, '_staff', match.params.staffId));
      dispatch(staffClientActions.sendDelete(staffClientId)).then(staffClientRes => {
        if(staffClientRes.success) {
          this.setState({
            confirmUnassignStaffModalOpen: false
          }, () => history.push(match.url.substring(0, match.url.lastIndexOf('/'))))
        } else {
          alert(staffClientRes.error)
          this.setState({
            confirmUnassignStaffModalOpen: false
          }, () => history.push(match.url.substring(0, match.url.lastIndexOf('/'))))
        }
      });
    }
  }

  render() {
    const {
      activityStore
      , clientStore
      , firmStore
      , match
      , staffStore
      , staffClientStore
      , userStore
    } = this.props;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const selectedStaff = staffStore.selected.getItem();
    const selectedUser = selectedStaff ? userStore.byId[selectedStaff._user] : null;

    const staffClientListItems = staffClientStore.util.getList('_staff', match.params.staffId);
    const staffClientList = staffClientStore && staffClientStore.lists && staffClientStore.lists._staff ? staffClientStore.lists._staff[match.params.staffId] : null

    // filter out the current staffClient to get a list of this staff member's other assignments.
    const staffOtherClientsList = staffClientListItems ? staffClientListItems.filter(staffClient => staffClient._client != match.params.clientId) : null;
    // filter out everything but the current staffClient.
    const selectedStaffClient = staffClientListItems ? staffClientListItems.filter(staffClient => staffClient._client == match.params.clientId)[0] : null;
    
    const activityListItems = selectedUser ? activityStore.util.getList('_user', selectedUser._id, '_client', match.params.clientId) : null;

    const isEmpty = (
      clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || !selectedStaff
      || !selectedStaff._id
      || !selectedUser
      || !selectedUser._id
      || !staffClientListItems
      || !staffClientList
      || staffClientList.didInvalidate
    );

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
      || staffStore.selected.isFetching
      || !staffClientList
      || staffClientList.isFetching
    )

    const staffAssignedClients = [];
    const staffAssignedClientList = [];
    if (staffOtherClientsList && staffOtherClientsList.length > 0) {
      staffOtherClientsList.map((staffClient, i) => {
        const client = clientStore.byId[staffClient._client];
        if (client && client._id && client.status === "visible") {
          staffAssignedClientList.push(<li key={`${staffClient._id}_${i}`}><Link to={`/firm/${client._firm}/clients/${client._id}`} key={`staff_client_${staffClient._id}`}>{client.name}</Link></li>);
        }
      });

      if (staffAssignedClientList.length) {
        staffAssignedClients.push(
          <ul style={{listStyleType: 'none', margin: '0', padding: '0'}}>{staffAssignedClientList}</ul>
        )
      }
    }

    if (!staffAssignedClients.length) {
      staffAssignedClients.push(
        <p className="u-muted"><em>No other Assignments</em></p>
      );
    }


    return (
      <div className="quick-view">
        <div className="-header">
          <Link to={`/firm/${match.params.firmId}/clients/${match.params.clientId}/staff`}>Close</Link>
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
              <div className="-staff-info">
                <ProfilePic user={selectedUser}/>
                <div className="-text">
                  <strong>{selectedUser.firstname} {selectedUser.lastname}</strong>
                  <br/>
                  <small>{selectedUser.username}</small>
                </div>
              </div>
              <div className="tab-bar-nav">
                <ul className="navigation">
                  <li>
                    <span className={`action-link ${this.state.viewing === 'activity' ? 'active' : null}`} onClick={() => this.setState({viewing: 'activity'})}>Details</span>
                  </li>
                  <li>
                    <span className={`action-link ${this.state.viewing === 'other' ? 'active' : null}`} onClick={() => this.setState({viewing: 'other'})}>Other Assignments</span>
                  </li>
                </ul>
              </div>
              { this.state.viewing === 'activity' ? 
                <div className="-staff-activity-list">
                  <div className="yt-row center-vert u-muted">
                    <div className={`-notification-icon -toggle ${selectedStaffClient && !selectedStaffClient.sendNotifs ? '-off' : '-on'} yt-col _10`}>
                    { this.state.fetchingStaffClient ?
                      <i className="fas fa-spinner fa-spin"/>
                      :
                      <i className={`fas fa-bell${selectedStaffClient && !selectedStaffClient.sendNotifs ? '-slash' : ''}`} onClick={() => this._handleToggleNotifications(selectedStaffClient)}/>
                    }
                    </div>
                    <label className='yt-col _90'>{selectedUser.firstname || 'This user'} {selectedStaffClient && selectedStaffClient.sendNotifs ? <b>is </b> : 'is '}  {selectedStaffClient && !selectedStaffClient.sendNotifs ? <b>not</b> : ''} receiving notifications for {selectedClient.name || 'this client'}</label>
                  </div>
                  <h3>Recent Activity</h3>
                { activityListItems && activityListItems.length > 0 ?
                  activityListItems.map((activity, i) => 
                  <div className="activity-list-item yt-row" key={`activity_list_item_${i}`}>
                    <div className="yt-col">
                      <a href={activity.link} className="-text">{this._formatActivityText(activity)}</a>
                    </div>
                    <div className="yt-col">
                      <span className="u-pullRight">{DateTime.fromISO(activity.created_at).toLocaleString(DateTime.DATE_SHORT)}</span>
                    </div>
                  </div>
                  )
                  :
                  <em>No activity</em>
                }
                </div>
                :
                <div className="-staff-assignment-list">
                  {staffAssignedClients}
                </div>
              }
            </div>
            <div className="-footer">
              <button onClick={() => this.setState({ confirmUnassignStaffModalOpen: true })} className="yt-btn x-small info">Unassign Staff</button>
            </div>
            <AlertModal
              alertMessage={<div> <h4>Are you sure?</h4> Do you want to unassign this staff member from this client?</div> }
              alertTitle="Unassign staff"
              closeAction={() => this.setState({confirmUnassignStaffModalOpen: false})}
              confirmAction={() => this._handleUnassignStaff(selectedStaffClient ? selectedStaffClient._id : null)}
              confirmText="Yes"
              declineText="Never mind"
              isOpen={this.state.confirmUnassignStaffModalOpen}
              type="warning"
            />
          </div>
        }
      </div>
    )
  }
}

PracticeStaffClientQuickview.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeStaffClientQuickview.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    activityStore: store.activity
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    , staffClientStore: store.staffClient
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeStaffClientQuickview)
);
