/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';

// import third-party libraries
import classNames from 'classnames';
import { DateTime } from 'luxon';


// import actions
import * as activityActions from '../../../activity/activityActions';
import * as clientActivityActions from '../../../clientActivity/clientActivityActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as fileActions from '../../../file/fileActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as clientTaskActions from '../../../clientTask/clientTaskActions';
import * as clientWorkflowActions from '../../clientWorkflowActions';
import * as clientTaskResponseActions from '../../../clientTaskResponse/clientTaskResponseActions';
import * as userActions from '../../../user/userActions';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';

// import resource components
import PracticeClientTaskViewer from '../../../clientTask/practice/components/PracticeClientTaskViewer.js.jsx';
import ClientWorkflowStatusIndicator from '../../components/ClientWorkflowStatusIndicator.js.jsx';

class PracticeClientWorkflowQuickview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      confirmSendReminderModalOpen: false
      , confirmAssignClientWorkflowModalOpen: false
      , confirmArchiveClientWorkflowModalOpen: false
      , viewing: 'tasks'
    }
    this._bind(
      '_goBack'
      , '_sendReminder'
      , '_setStatus'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    // get stuff for global nav 
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));

    // get stuff for this view 
    dispatch(clientActivityActions.fetchListIfNeeded('_client', match.params.clientId, '_firm', match.params.firmId, 'isReminder', 'true'));
    dispatch(clientActions.fetchSingleIfNeeded(match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(fileActions.fetchListIfNeeded('~client', match.params.clientId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    // dispatch(staffClientActions.fetchListIfNeeded('_client', match.params.clientId));

    // TODO:  Make this dynamic 
    // dispatch(clientTaskActions.fetchListIfNeeded('all'));
    dispatch(clientTaskActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));

    dispatch(clientWorkflowActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientWorkflowActions.fetchSingleIfNeeded(match.params.clientWorkflowId));
    dispatch(clientTaskResponseActions.fetchListIfNeeded('_clientWorkflow', match.params.clientWorkflowId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.firmId)); // fetches clientUser/contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
  }

  componentDidUpdate() {
    const { dispatch, match } = this.props; 
    dispatch(clientActivityActions.fetchListIfNeeded('_client', match.params.clientId, '_firm', match.params.firmId, 'isReminder', 'true'));
  }

  _goBack() {
    // e.preventDefault()
    this.props.history.goBack();
  }

  _setStatus(status) {
    const { dispatch, loggedInUser, match, clientWorkflowStore } = this.props;
    let clientWorkflow = _.cloneDeep(clientWorkflowStore.byId[match.params.clientWorkflowId])
    clientWorkflow.status = status
    dispatch(clientWorkflowActions.sendUpdateClientWorkflow(clientWorkflow)).then(clientWorkflowRes => {
      this.setState({
        confirmAssignClientWorkflowModalOpen: false
        , confirmArchiveClientWorkflowModalOpen: false
      })
    })
  }

  _sendReminder() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.sendClientReminder(match.params.clientId)).then(clientRes => {
      dispatch(clientActivityActions.invalidateList('_client', match.params.clientId, '_firm', match.params.firmId, 'isReminder', 'true'));
      this.setState({
        confirmSendReminderModalOpen: false
      });
    })
  }

  render() {
    const { 
      clientStore
      , clientActivityStore
      , clientUserStore
      , firmStore 
      , location
      , match
      , clientWorkflowStore
      , clientTaskResponseStore
      , clientTaskStore
      , userStore 
    } = this.props;

    const selectedClient = clientStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();
    const selectedClientWorkflow = clientWorkflowStore.selected.getItem();

    const clientTaskList = clientTaskStore.lists && clientTaskStore.lists._clientWorkflow ? clientTaskStore.lists._clientWorkflow[match.params.clientWorkflowId] : null;
    const clientTaskListItems = clientTaskStore.util.getList("_clientWorkflow", match.params.clientWorkflowId);
    // ^ unneccessary w/ selectedClientWorkflow.items

    // Filter out clientTasks with a status of 'draft' so that they aren't included in the progress percent calculation.
    const activeClientTaskListItems = clientTaskListItems ? clientTaskListItems.filter(clientTask => clientTask.status && clientTask.status !== 'draft') : []
    // Filter out clientTasks that are not yet completed.
    const completeClientTaskListItems = activeClientTaskListItems ? activeClientTaskListItems.filter(clientTask => clientTask.status === 'completed') : []

    const clientActivityList = clientActivityStore.util.getListInfo('_client', match.params.clientId, '_firm', match.params.firmId, 'isReminder', 'true')
    const clientActivityListItems = clientActivityStore.util.getList('_client', match.params.clientId, '_firm', match.params.firmId, 'isReminder', 'true')

    const clientTaskResponseList = clientTaskResponseStore.lists && clientTaskResponseStore.lists._clientWorkflow ? clientTaskResponseStore.lists._clientWorkflow[match.params.clientWorkflowId] : null;
    const clientTaskResponseListItems = clientTaskResponseStore.util.getList("_clientWorkflow", match.params.clientWorkflowId);

    const groupedResponses = clientTaskResponseListItems ? _.groupBy(clientTaskResponseListItems, '_clientTask') : {};

    const clientUserListItems = clientUserStore.util.getList('_client', match.params.clientId);

    // console.log(groupedResponses);
    const isEmpty = (
      clientStore.selected.didInvalidate
      || firmStore.selected.didInvalidate
      || !selectedClient
      || !selectedClient._id
      || !selectedFirm
      || !selectedFirm._id
      || clientWorkflowStore.selected.didInvalidate
      || !selectedClientWorkflow
      || !selectedClientWorkflow._id
    );

    const isFetching = (
      clientStore.selected.isFetching
      || firmStore.selected.isFetching
      || !clientActivityList
      || clientActivityList.isFetching
      || !clientTaskList
      || clientTaskList.isFetching
      || clientWorkflowStore.selected.isFetching
    )

    // Since clientTasks now have a status, we do not need to count responses to determine completeness. We'll just count active tasks and completed tasks.
    const progressPercent = !selectedClientWorkflow ? 0 : Math.floor(completeClientTaskListItems.length / activeClientTaskListItems.length) * 100;

    let progressClass = classNames(
      `progress-bar-${progressPercent || '0'}` // fallback to 0 when progressPercent is NaN.
    )

    return (
      <div className="quick-view">
        <div className="-header yt-row">
          <div  className="yt-col _33">
            <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows`}>Close</Link>
          </div>
          <div  className="yt-col _33">
            <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/${match.params.clientWorkflowId}/update`} className="yt-btn x-small info">Manage Tasks</Link>
          </div>
          <div  className="yt-col _33">
          { !isEmpty && !isFetching ?
            <ClientWorkflowStatusIndicator
              status={selectedClientWorkflow.status}
            />
            :
            null
          }
          </div>
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
              <div className="-client-workflow-info">
                <h3>{selectedClientWorkflow.title}</h3>
                <p>{selectedClientWorkflow.description}</p>
                <p><small>Completed {completeClientTaskListItems.length} of {activeClientTaskListItems.length} </small></p>
                <div className={progressClass} >
                  <div className="-progress">
                    <div className="-complete">
                    </div>
                  </div>
                </div>

                {/* { clientTaskListItems && Object.keys(groupedResponses).length < clientTaskListItems.length ? // The length of groupedResponses is kind of irrelevant since a task can have multiple responses. */}
                { clientActivityListItems && clientActivityListItems.length > 0 ?
                  <div className="yt-row space-between center-vert" style={{marginTop: "8px"}}>
                    {/* the first item in clientActivityListItems is the newest one. */}
                    <small>{`Last reminder: ${DateTime.fromISO(clientActivityListItems[0].created_at).toRelativeCalendar()}`}</small>
                  </div>
                  :
                  null
                }
              </div>
              <div className="tab-bar-nav">
                <ul className="navigation">
                  <li>
                    <span className={`action-link ${this.state.viewing === 'tasks' ? 'active' : null}`} onClick={() => this.setState({viewing: 'tasks'})}>Tasks</span>
                  </li>
                  <li>
                    <span className={`action-link ${this.state.viewing === 'notes' ? 'active' : null}`} onClick={() => this.setState({viewing: 'notes'})}>Notes</span>
                  </li>
                 
                </ul>
              </div>
              { this.state.viewing === 'tasks' ? 
                <div className="-task-wrapper tab-bar-content">
                  { selectedClientWorkflow.items && selectedClientWorkflow.items.length > 0 ?
                    selectedClientWorkflow.items.map((item, i) => 
                      <div key={item._clientTask ? item._clientTask + '_' + i : item._clientWorkflow + '_' + i}>
                        { item._clientTask ?
                          <PracticeClientTaskViewer
                            clientTask={clientTaskStore.byId[item._clientTask]}
                            clientTaskResponses={groupedResponses[item._clientTask]}
                          />
                          : 
                          <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/${item._clientWorkflow}`}>{clientWorkflowStore.byId[item._clientWorkflow] ? clientWorkflowStore.byId[item._clientWorkflow].title : 'Sub-task' }</Link>
                        }
                      </div>
                    )
                    :
                    <div className="empty-state-hero">
                      <div className="u-centerText">
                        <em>There are no tasks for this flow just yet.  </em>
                        <br/>
                        <br/>
                        <Link to={`/firm/${match.params.firmId}/workspaces/${match.params.clientId}/client-workflows/${match.params.clientWorkflowId}/update`} className="yt-btn small info">Add some tasks now</Link>
                      </div>
                    </div>
                  }
                </div>
                :
                <div className="-notes -task-notes">
                  <p className="u-muted"><em>Notes</em></p>
                </div>
              }
            </div>
            <div className="-footer">
            { clientTaskListItems ?
              selectedClientWorkflow.status === 'draft' && selectedClientWorkflow.items && selectedClientWorkflow.items.length > 0 ?
              <div className="yt-row space-between center-vert" style={{marginTop: "8px"}}>
                <button className="yt-btn bordered xx-small" onClick={() => this.setState({confirmAssignClientWorkflowModalOpen: true})}>Assign to Client</button>
              </div>
              :
              selectedClientWorkflow.status === 'published' ?
              <div className="yt-row space-between center-vert" style={{marginTop: "8px"}}>
                <button className="yt-btn bordered xx-small info" onClick={() => this.setState({confirmSendReminderModalOpen: true})}>Send Reminder</button>
                <button className="yt-btn bordered xx-small" onClick={() => this.setState({confirmArchiveClientWorkflowModalOpen: true})}>Archive</button>
              </div>
              :
              null
              :
              null 
            }
            </div>
            <AlertModal
              alertMessage={<div> <h4>Are you sure?</h4> This will send a reminder email to all contacts for {selectedClient.name} to complete this task.</div> }
              alertTitle="Send reminder"
              closeAction={() => this.setState({confirmSendReminderModalOpen: false})}
              confirmAction={this._sendReminder}
              confirmText="Yes, remind 'em"
              declineAction={this._closeDeleteModal}
              declineText="Never mind"
              isOpen={this.state.confirmSendReminderModalOpen}
              type="warning"
            />
            <AlertModal
              alertMessage={<div> <h4>Are you sure?</h4> Are you ready to make this clientWorkflow visible to the client?</div> }
              alertTitle="Publish clientWorkflow"
              closeAction={() => this.setState({confirmAssignClientWorkflowModalOpen: false})}
              confirmAction={() => this._setStatus('published')}
              confirmText="Yes, I'm ready"
              declineText="Never mind"
              isOpen={this.state.confirmAssignClientWorkflowModalOpen}
              type="warning"
            />
            <AlertModal
              alertMessage={<div> <h4>Are you sure?</h4> Are you ready to archive this clientWorkflow?</div> }
              alertTitle="Archive clientWorkflow"
              closeAction={() => this.setState({confirmArchiveClientWorkflowModalOpen: false})}
              confirmAction={() => this._setStatus('archived')}
              confirmText="Yes"
              declineText="Never mind"
              isOpen={this.state.confirmArchiveClientWorkflowModalOpen}
              type="warning"
            />
          </div>
        }
      </div>
    )
  }
}

PracticeClientWorkflowQuickview.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PracticeClientWorkflowQuickview.defaultProps = {

}


const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientStore: store.client
    , clientActivityStore: store.clientActivity
    , clientUserStore: store.clientUser 
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , clientWorkflowStore: store.clientWorkflow 
    , clientTaskResponseStore: store.clientTaskResponse
    , clientTaskStore: store.clientTask 
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeClientWorkflowQuickview)
);
