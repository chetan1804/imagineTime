/**
 * View component for /firm/:firmId/workspaces/:clientId
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import actions
import * as activityActions from '../../activityActions';
import * as clientActions from '../../../client/clientActions';
import * as clientActivityActions from '../../../clientActivity/clientActivityActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';
import * as fileActivityActions from '../../../fileActivity/fileActivityActions';
import * as fileActions from '../../../file/fileActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import { CalendarDatePicker } from '../../../../global/components/forms';

// import resource components
import ActivityListItem from '../../components/ActivityListItem.js.jsx';
import WorkspaceLayout from '../../../client/practice/components/WorkspaceLayout.js.jsx';

class WorkspaceActivity extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      selectedDate: null
    }
    this._bind(
      '_handleFormChange'
      , '_filterListByDate'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    // get stuff for global nav & permissions 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    dispatch(activityActions.fetchListIfNeeded('_client', match.params.clientId)); // firm activity by client.
    dispatch(clientActivityActions.fetchListIfNeeded('_client', match.params.clientId)); // client's activity
    dispatch(fileActivityActions.fetchListIfNeeded('_client', match.params.clientId)); // client's activity
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    // {
    //   '~firm': props.match.params.firmId
    //   , _client: props.match.params.clientId || 'null'
    //   , status: 'not-archived'
    // }
    if (match.params.clientId) {
      dispatch(fileActions.fetchListIfNeeded('~firm', match.params.firmId, '_client', match.params.clientId, 'status', 'not-archived'));
    }
    
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _filterListByDate(activityList) {
    const { selectedDate } = this.state;
    let newActivityList;
    if(selectedDate) {
      // Filter out activities newer than the selected date. Ignore the time and only compare dates.
      // We were not zeroing milliseconds which was excluding activites with a date equal to selectedDate. It works correctly now.
      newActivityList = activityList.filter(activity => new Date(activity.created_at).setHours(0, 0, 0, 0) <= selectedDate.setHours(0, 0, 0, 0));
    } else {
      newActivityList = _.cloneDeep(activityList);
    }
    return newActivityList;
  }

  _groupActivitiesByDate(activityListItems) {
    const activitiesGroupedByDate = {};
    const sortedActivities = {};

    // activityListItems = _.orderBy(activityListItems, [item => item.created_at], ['desc']);
    activityListItems.forEach(activity => {
      let date = DateTime.fromISO(activity.created_at).toFormat('yyyyMMdd');
      if (activitiesGroupedByDate[date]) {
        activitiesGroupedByDate[date].push(activity);
      } else {
        activitiesGroupedByDate[date] = [];
        activitiesGroupedByDate[date].push(activity);
      }
    });

    Object.keys(activitiesGroupedByDate).forEach(date => {
      let activites = activitiesGroupedByDate[date];
      if (activites) {
        activites = _.orderBy(activites, [item => item.created_at], ['desc']);
      }
      sortedActivities[date] = activites;
    });

    // activityListItems.forEach(activity => activitiesGroupedByDate[DateTime.fromISO(activity.created_at).toISODate()].push(activity));
    // const dates = activityListItems.map(activity => DateTime.fromISO(activity.created_at).toISODate());
    // let activitiesGroupedByDate = {};
    // // Create an array for each date.
    // dates.sort((a, b) => b - a).forEach(date => activitiesGroupedByDate[date] `=` [])
    // activityListItems.forEach(activity => activitiesGroupedByDate[DateTime.fromISO(activity.created_at).toISODate()].push(activity));
    // console.log('activitiesGroupedByDate', Object.keys(activitiesGroupedByDate))
    return sortedActivities;
  }

  render() {
    const {
      activityStore
      , clientStore
      , clientActivityStore
      , clientUserStore 
      , firmStore
      , location 
      , loggedInUser
      , match 
      , staffStore 
      , staffClientStore 
      , userStore 
      , fileActivityStore
    } = this.props;
    
    // client & firm 
    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    // clientUsers(contacts) list 
    const clientUserList = clientUserStore.lists && clientUserStore.lists._client ? clientUserStore.lists._client[match.params.clientId] : null;
    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // staffClient  list 
    const staffClientList = staffClientStore.lists && staffClientStore.lists._client ? staffClientStore.lists._client[match.params.clientId] : null;
    const staffClientListItems = staffClientStore.util.getList('_client', match.params.clientId);

    // activity  list 
    const activityList = activityStore.lists && activityStore.lists._client ? activityStore.lists._client[match.params.clientId] : null;
    const activityListItems = activityStore.util.getList('_client', match.params.clientId);

    // file activity list
    const fileActivityList = fileActivityStore.lists && fileActivityStore.lists._client ? fileActivityStore.lists._client[match.params.clientId] : null;
    const fileActivityListItems = fileActivityStore.util.getList('_client', match.params.clientId);

    console.log('debugging list', activityListItems, fileActivityListItems);

    if (activityList && activityListItems && fileActivityList && fileActivityListItems && fileActivityListItems.length) {
      activityListItems.push(...fileActivityListItems);
    }

    /**
     * TODO: Figure out how we are going to display client and firm activity in a sensible way.
     */
    // clientActivityList
    const clientActivityList = clientActivityStore.lists && clientActivityStore.lists._client ? clientActivityStore.lists._client[match.params.clientId] : null;
    const clientActivityListItems = clientActivityStore.util.getList('_client', match.params.clientId);

    const filteredActivityListItems = activityList && fileActivityList && activityListItems && fileActivityListItems ? this._filterListByDate(activityListItems) : [];

    console.log('filteredActivityListItems', filteredActivityListItems)

    const activitiesGroupedByDate = filteredActivityListItems ? this._groupActivitiesByDate(filteredActivityListItems) : [];

    const isEmpty = (
      !activityList
      || !activityListItems
      || !fileActivityList
      || !fileActivityListItems
      || !selectedClient
      || !selectedClient._id
      || clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
    );

    const isFetching = (
      !activityList
      || !activityListItems
      || !fileActivityList
      || !fileActivityListItems
      || activityList.isFetching
      || clientStore.selected.isFetching
      || !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
      || !staffClientListItems
      || !staffClientList
      || staffClientList.isFetching
    )
    return (
      <WorkspaceLayout>
        <Helmet><title>Workspace Activity</title></Helmet>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <h2>Empty.</h2>
          )
          :
          <div className="-mob-layout-ytcol100 space-between">
            <div className="yt-col _50 -yt-no-padding">
              <h3>Latest Activity </h3>

              <div className="activity-list ">
              {/* The activities list is returned form the server sorted in descending order by created_at.
              */}
              { Object.keys(activitiesGroupedByDate).sort((a,b) => b - a).map(key =>
                <div key={key} className="activity-day-group">
                  <div className="-day">
                    {DateTime.fromISO(key).toFormat('D') == DateTime.local().toFormat('D') ? 
                      "Today"
                    :
                      DateTime.fromISO(key).toFormat('MM/dd/yyyy')
                    }
                  </div>
                  { activitiesGroupedByDate[key].map((activity, i) => 
                      <ActivityListItem
                        key={activity._id + '_' + i}
                        activity={activity}
                        loggedInUser={loggedInUser}
                        user={userStore.byId[activity._user] || {}}
                        viewingAs="workspace"
                        clientStore={clientStore}
                      />
                    )
                  }
                </div>
              )}
              </div>
            </div>
            <div className="yt-col _50">
              <div className="-schedule -fixed">
                {/* <h3>Schedule </h3>
                <CalendarDatePicker
                  change={this._handleFormChange}
                  daySize={50}
                  highlightedDates={activityListItems.map(activity => activity.created_at)}
                  name="selectedDate"
                  numberOfMonths={1}
                  value={this.state.selectedDate || new Date()}
                /> */}
              </div>
            </div>
          </div>
      }
      </WorkspaceLayout>
    )
  }
}

WorkspaceActivity.propTypes = {
  dispatch: PropTypes.func.isRequired
}

WorkspaceActivity.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  console.log('loading one')
  return {
    activityStore: store.activity 
    , clientStore: store.client
    , clientActivityStore: store.clientActivity
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff 
    , staffClientStore: store.staffClient 
    , userStore: store.user
    , fileActivityStore: store.fileActivity
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(WorkspaceActivity)
);
