/**
 * post-login landing page for the client portal 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../../components/Binder.js.jsx';
import YTRoute from '../../components/routing/YTRoute.js.jsx';

// import Portal components
// import PortalDueSoon from '../components/PortalDueSoon.js.jsx';
import PortalLayout from '../components/PortalLayout.js.jsx';
// import PortalSchedule from '../components/PortalSchedule.js.jsx';
import PortalOnBoardingReminder from '../components/PortalOnBoardingReminder.js.jsx';
import ClientPostPortalList from '../../../resources/clientPost/portal/views/ClientPostPortalList.js.jsx';

// import other resource components
import ActivityListItem from '../../../resources/activity/components/ActivityListItem.js.jsx';

// import actions
import * as clientActions from '../../../resources/client/clientActions';
import * as clientActivityActions from '../../../resources/clientActivity/clientActivityActions';
import * as clientTaskActions from '../../../resources/clientTask/clientTaskActions';
import * as clientUserActions from '../../../resources/clientUser/clientUserActions';
import * as firmActions from '../../../resources/firm/firmActions';
import * as staffActions from '../../../resources/staff/staffActions';
import * as staffClientActions from '../../../resources/staffClient/staffClientActions';
import * as clientWorkflowActions from '../../../resources/clientWorkflow/clientWorkflowActions';
import * as userActions from '../../../resources/user/userActions';
import * as fileActivityActions from '../../../resources/fileActivity/fileActivityActions';

class PortalDashboard extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      onBoardingReminderOpen: false
    }
    this._bind(
      '_getClientTasksWithClientWorkflow'
      , '_groupActivitiesByDate'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    if(!loggedInUser.onBoarded) {
      this.setState({
        onBoardingReminderOpen: true
      })
    }

    /**
     * add this to each portal view 
     */
    dispatch(clientUserActions.fetchClientUserLoggedInByClientIfNeeded(match.params.clientId));


    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal

    dispatch(clientActivityActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(fileActivityActions.fetchListIfNeeded('_client', match.params.clientId)); // client's activity

    /**
     * NOTE: We are fetching all open clientTasks for this client. That includes tasks belonging
     * to "archived", "draft", and "published" clientWorkflows. We'll have to use the clientWorkflow.items array
     * to build a list of clientTasks that are visible to the client. This could get slow.
     * 
     * TODO: Consider creating a custom api call for this that returns only open clientTasks
     * on 'published' clientWorkflows.
     */
    dispatch(clientTaskActions.fetchListIfNeeded('_client', match.params.clientId, 'status', 'open'));

    // For some reason fetchSingleIfNeeded is returning an undefined item here. I can't figure out why. - Wes
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
      if(clientRes.success) {
      const client = clientRes.item;
        if(client && !client.onBoarded) {
          this.setState({
            onBoardingReminderOpen: true
          });
        }
        dispatch(firmActions.fetchSingleIfNeeded(client._firm));
        dispatch(staffActions.fetchListIfNeeded('_firm', client._firm));
        dispatch(userActions.fetchListIfNeeded('_firmStaff', client._firm));
      }
    });
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientWorkflowActions.fetchListIfNeeded('_client', match.params.clientId, 'status', 'published'))
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
  }

  componentDidUpdate(nextProps) {
    const { dispatch, match } = nextProps;
    if(this.props.match.params.clientId !== match.params.clientId) {
      dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId)).then(clientRes => {
        if(clientRes.success) {
          dispatch(firmActions.fetchSingleIfNeeded(clientRes.item._firm));
        }
      })
    }
  }

  _getClientTasksWithClientWorkflow(publishedClientWorkflowList) {    
    const { clientTaskStore } = this.props;
    let clientTaskListItems = [];
    publishedClientWorkflowList.forEach(clientWorkflow => {
      // look at each clientWorkflow's item array.
      clientWorkflow.items.forEach(item => {
        // check if the item is a clientTask that exists in the store (meaning it has a clientStatus of 'open')
        if(item._clientTask && clientTaskStore.byId[item._clientTask]) {
          let clientTask = clientTaskStore.byId[item._clientTask]
          // Add the clientWorkflow id so it's possible to build a link to this task.
          clientTask._clientWorkflow = clientWorkflow._id;
          // Push it to the array.
          clientTaskListItems.push(clientTask)
        }
      });
    });
    return clientTaskListItems.sort((a, b) => new Date(a.dueDate || a.created_at) - new Date(b.dueDate || b.created_at))
  }

  // This method assumes that your list is presorted by date.
  // We can use this method to group by any date by passing dateField. Currently it's being used to group activities by created_at and clientTasks by dueDate.
  _groupActivitiesByDate(activityListItems, dateField) {
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
    return sortedActivities;
  }

  render() {
    const { 
      clientStore
      , clientActivityStore
      , clientTaskStore
      , firmStore
      , history
      , loggedInUser
      , match
      , userStore
      , clientWorkflowStore
      , fileActivityStore
    } = this.props;

    const { onBoardingReminderOpen } = this.state; 

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    
    const publishedClientWorkflowList = clientWorkflowStore.util.getList('_client', match.params.clientId, 'status', 'published')

    const clientTaskListItems = publishedClientWorkflowList ? this._getClientTasksWithClientWorkflow(publishedClientWorkflowList) : [];
    const clientTaskList = (
      clientTaskStore.lists
      && clientTaskStore.lists._client
      && clientTaskStore.lists._client[match.params.clientId]
    );

    // NOTE: clientActivity lists are sorted on the server newest to oldest since that's pretty much always how we want to display them.
    const clientActivityListItems = clientActivityStore.util.getList('_client', match.params.clientId)
    const clientActivityList = clientActivityListItems ? clientActivityStore.lists._client[match.params.clientId] : null

    // file activity list
    const fileActivityList = fileActivityStore.lists && fileActivityStore.lists._client ? fileActivityStore.lists._client[match.params.clientId] : null;
    const fileActivityListItems = fileActivityStore.util.getList('_client', match.params.clientId);

    if (clientActivityList && clientActivityListItems && fileActivityList && fileActivityListItems && fileActivityListItems.length) {
      clientActivityListItems.push(...fileActivityListItems);
    }

    const clientActivitiesGroupedByDate = clientActivityList && clientActivityListItems && fileActivityList && fileActivityListItems  ? this._groupActivitiesByDate(clientActivityListItems, 'created_at') : null;

    const isEmpty = (
      !clientActivityList
      || !clientActivityListItems
      || !clientTaskList
      || !selectedClient
      || !selectedFirm
      || !fileActivityList
      || !fileActivityListItems
    )

    const isFetching = (
      !clientActivityList
      || clientActivityList.isFetching
      || !clientTaskList
      || clientTaskList.isFetching
      || !selectedClient
      || selectedClient.isFetching
      || !selectedFirm
      || selectedFirm.isFetching
      || !fileActivityList
      || !fileActivityListItems
    )
    return  (
      <PortalLayout>
        <Helmet> 
          <title>Portal Dashboard</title>
        </Helmet>
        {!isEmpty && !isFetching && onBoardingReminderOpen ?
          <PortalOnBoardingReminder
            user={loggedInUser}
            client={selectedClient}
            closeAction={() => this.setState({onBoardingReminderOpen: false})} // This will hide the reminder until the next time this view mounts.
            confirmAction={() => history.push(`/user/finish/welcome/${match.params.clientId}`)}
          />
          :
          null
        }
        <h1>Good { DateTime.local().hour > 11 ? 'Afternoon' : 'Morning'}, {loggedInUser.firstname}</h1>
        <p>Welcome back to your {selectedClient ? `dashboard for your ${selectedClient.name} account` : 'client portal dashboard'}.</p>
        {/* <div className="tab-bar-nav">
          <ul className="navigation">
            <li>
              <NavLink exact to={`/portal/${match.params.clientId}/dashboard`}>Activity</NavLink>
            </li>
            <li>
              <NavLink to={`/portal/${match.params.clientId}/dashboard/due-soon`}>Due Soon</NavLink>
            </li>
            <li>
              <NavLink to={`/portal/${match.params.clientId}/dashboard/schedule`}>Schedule</NavLink>
            </li>
          </ul>
        </div> */}
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
        <Switch>
          <YTRoute clientUser={true} exact path="/portal/:clientId/dashboard" render={() => 
            <div className="-portal-content">
              <div className="yt-row with-gutters space-between">
                <div className="yt-col full s_60 m_50">
                  <h3>Latest Activity </h3>
                  <div className="activity-list">
                  { Object.keys(clientActivitiesGroupedByDate).sort((a,b) => b - a).map((key, i) =>
                    <div className="activity-day-group" key={key + "_" + i}>
                      <div className="-day">
                        {DateTime.fromISO(key).toFormat('D') == DateTime.local().toFormat('D') ? 
                          "Today"
                        :
                          DateTime.fromISO(key).toFormat('D')
                        }
                      </div>
                      { clientActivitiesGroupedByDate[key].map((activity, i) => 
                          <ActivityListItem
                            key={activity._id + "_" + i}
                            activity={activity}
                            loggedInUser={loggedInUser}
                            user={userStore.byId[activity._user] || {}}
                            viewingAs="portal"
                          />
                        )
                      }
                    </div>
                  )}
                  </div>
                </div>
                <div className="yt-col full s_40 m_25 portal-info-helper">
                  <div className="-content-box">
                    <div className="-icon">
                      <i className="fal fa-lightbulb-on"/>
                    </div>
                    <p>Your activity timeline shows you all actions taken within portal. Both by you and the team at {selectedFirm ? selectedFirm.name : 'the firm'}</p>
                  </div>
                  {/* <div className="-need-help" style={{marginTop: '32px'}}>
                    <p className="u-centerText">Need to chat?</p>
                    <button className="yt-btn bordered block x-small info">Schedule a call</button>
                  </div> */}
                </div>
              </div>
            </div>
          }/>
          {/* <YTRoute clientUser={true} path="/portal/:clientId/dashboard/due-soon" render={() => 
            <PortalDueSoon
              groupItemsByDate={this._groupActivitiesByDate}
              clientTaskListItems={clientTaskListItems}
            />
          }/>
          <YTRoute clientUser={true} path="/portal/:clientId/dashboard/schedule" render={() => 
            <PortalSchedule
              clientTaskListItems={clientTaskListItems}
            />
          }/> */}
        </Switch>
        }
      </PortalLayout>
    )
  }
}


PortalDashboard.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client
    , clientActivityStore: store.clientActivity
    , clientTaskStore: store.clientTask
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user
    , clientWorkflowStore: store.clientWorkflow
    , fileActivityStore: store.fileActivity
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PortalDashboard)
);

