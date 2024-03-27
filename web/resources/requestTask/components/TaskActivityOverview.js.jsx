/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { DateTime } from 'luxon';
const async = require('async');

// import actions
// import * as addressActions from '../../../address/addressActions';
import * as requestTaskActions from '../requestTaskActions';
import * as userActions from '../../user/userActions';
import * as taskActivityActions from '../../taskActivity/taskActivityActions';
import * as staffActions from '../../staff/staffActions';
import * as fileActions from '../../file/fileActions';
import * as firmActions from '../../firm/firmActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils, permissions, fileUtils, downloadsUtil } from '../../../global/utils';
import { TextAreaInput } from '../../../global/components/forms';
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

// import resource components
import TaskActivityListItem from '../components/TaskActivityListItem.js.jsx';
import FileMicroListItem from '../../file/components/FileMicroListItem.js.jsx';

class TaskActivityOverview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
        selectedDate: null
        , requestTaskId: props.match.params.requestTaskId
        , submitting: false
        , content: ""
        , showMobileActionOption: false
        , files: []
        , onProcess: false
    }
    this._bind(
      '_handleFormChange'
      , '_handleSaveTaskComment'
      , '_handleUpdateStatus'
      , '_handleDownLoadAllFiles'
      , '_handleCloseMobileOption'
    )
  }

  componentDidMount() {
    const { dispatch, match, location } = this.props;
    const { requestTaskId } = this.state;
    dispatch(fileActions.fetchListByRequestTask(requestTaskId)).then(json => {
      if (json && json.success && json.files) {
        this.setState({
          files: json.files
        })
        json.files.map(file => dispatch(fileActions.addSingleFileToMap(file)));
      }
    });
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(requestTaskActions.fetchSingleIfNeeded(requestTaskId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(taskActivityActions.fetchList('_requestTask', requestTaskId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
  }

  componentWillReceiveProps(prevProps) {
    const { dispatch, location, match } = prevProps;
    const { requestTaskId } = this.state;

    if (match.params.requestTaskId !== requestTaskId) {
      this.setState({ requestTaskId: match.params.requestTaskId });
      dispatch(requestTaskActions.fetchSingleIfNeeded(match.params.requestTaskId));
      dispatch(taskActivityActions.fetchListIfNeeded('_requestTask', match.params.requestTaskId));  
    }
  }

  _groupActivitiesByDate(activityListItems) {
    const dates = activityListItems.map(activity => DateTime.fromISO(activity.created_at).toISODate())
    let activitiesGroupedByDate = {};
    // Create an array for each date.
    dates.forEach(date => activitiesGroupedByDate[date] = [])
    // push all activities to their respective date arrays.
    activityListItems.forEach(activity => activitiesGroupedByDate[DateTime.fromISO(activity.created_at).toISODate()].push(activity))
    return activitiesGroupedByDate;
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

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState(newState);
  }

  _handleSaveTaskComment() {
    const { dispatch, requestTaskStore, match } = this.props;
    const requestTask = requestTaskStore.selected.getItem();
    this.setState({ submitting: true });
    const taskActivity = {
      text: "commented"
      , note: this.state.content
      , _requestTask: requestTask._id
      , _request: requestTask._request
    }
    dispatch(taskActivityActions.sendCreateTaskActivity(taskActivity)).then(json => {
      if (json.success && json.item) {
        dispatch(taskActivityActions.addSingleTaskActivityToMap(json.item));
        dispatch(taskActivityActions.addTaskActivityToList(json.item, ...['_requestTask', requestTask._id]));
        this.setState({ submitting: false, content: "" }, () => {
          if (match.params.viewingAs === "activity") {
            let lastActivity = document.querySelectorAll('.activity-card-wrapper');
            lastActivity = lastActivity ? [...lastActivity] : null;
            lastActivity = lastActivity ? lastActivity[lastActivity.length-1] : null;
            if (lastActivity) {
              lastActivity.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });
      }
    });
  }

  _handleUpdateStatus(action) {
    const { dispatch, match, requestTaskStore } = this.props;
    const requestTask = requestTaskStore.selected.getItem();
    requestTask["_firm"] = match.params.firmId;
    requestTask["requestDate"] = DateTime.local() 
    requestTask["action"] = action;
    this.setState({ submitting: true });

    dispatch(requestTaskActions.sendUpdateRequestTask(requestTask)).then(json => {
      if (!json.success) {
        alert(json.error);
      }
      this.setState({ submitting: false });
    });
  }

  _handleDownLoadAllFiles() {
    this.setState({ onProcess: true });
    const { fileMap, staffStore, loggedInUser, match, requestTaskStore, firmStore } = this.props;
    const requestTask = requestTaskStore.selected.getItem();
    const selectedFirm = firmStore.selected.getItem();

    if (fileMap && requestTask && requestTask._returnedFiles && requestTask._returnedFiles.length) {
      const isStaff = permissions.isStaff(staffStore, loggedInUser, match.params.firmId);
      const selectedFileIds = _.cloneDeep(requestTask._returnedFiles);
      const userLevel = isStaff ? "staffclient" : "clientuser";
      const sendData = {
        selectedFileIds
        , files: _.cloneDeep(this.state.files)
        , filesMap: _.cloneDeep(fileMap)
        , userLevel
      };
      if (requestTask._returnedFiles.length > 1 && selectedFirm && selectedFirm.zipFilesDownload) {
        downloadsUtil.bulkZipped(sendData, response => {
          this.setState({ onProcess: false });
        });
      } else if (fileMap) {
        let downloadLinks = requestTask._returnedFiles.map(item => fileMap[item] ? fileUtils.getDownloadLink(fileMap[item]) : null);
        async.map(downloadLinks, (link, cb) => {
          if (link) {
            var a  = document.createElement("a"); 
            a.setAttribute('href', `${link}?userLevel=${userLevel}&type=downloaded`); 
            a.setAttribute('download', '');
            a.setAttribute('target', '_blank');
            a.click(); 
          }
          cb();
        }, () => {
          this.setState({ onProcess: false });
        });
      } else {
        this.setState({ onProcess: false });
      }
    }
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const { 
      match
      , requestTaskStore
      , userStore
      , userMap
      , taskActivityStore
      , loggedInUser
      , location
      , staffStore
      , fileStore
      , fileMap
    //   , fileActivityStore
    //   , userStore
    //   , loggedInUser
    //   , fileStore
    //   , clientStore
    } = this.props;

    const {
        requestTaskId
        , submitting
        , content
        , showMobileActionOption
        , onProcess
    } = this.state;

    const requestTask = requestTaskStore.selected.getItem();
    const taskActivityItems = taskActivityStore.util.getList('_requestTask', requestTaskId);
    const filteredActivityListItems = taskActivityItems ? this._filterListByDate(taskActivityItems) : [];
    const taskActivitiesGroupedByDate = filteredActivityListItems ? this._groupActivitiesByDate(filteredActivityListItems) : [];
    const isStaff = permissions.isStaff(staffStore, loggedInUser, match.params.firmId);
    const isEmpty = (
        requestTaskStore.selected.didInvalidate
        || taskActivityStore.selected.didInvalidate
        || userStore.selected.didInvalidate
        || staffStore.selected.didInvalidate
        || fileStore.selected.didInvalidate
        || !requestTask
        || !userMap
        || !taskActivityItems
        || !fileMap
    );

    const isFetching = (
        requestTaskStore.selected.isFetching
        || taskActivityStore.selected.isFetching
        || userStore.selected.isFetching
        || staffStore.selected.isFetching
        || fileStore.selected.isFetching
        || !userMap
        || !requestTask
        || !taskActivityItems
        || !fileMap
    );

    const statusText = requestTask ? requestTask.status === "unpublished" ? "Pending" : requestTask.status === "published" ? "In Progress" : "Completed" : "Please wait...";
    const statusClassIcon = requestTask ? requestTask.status === "Pending" ? "fal fa-circle fa-2x" : requestTask.status === "published" ? "fal fa-check-circle fa-2x" : "fas fa-check-circle fa-2x" : "fal fa-circle fa-2x";
    const viewingAs = match.params.viewingAs;

    let creator = !isEmpty ? `${userMap[requestTask._createdBy] ? `${userMap[requestTask._createdBy].firstname} ${userMap[requestTask._createdBy].lastname}` : ""} ` : "";
    creator = !isEmpty ? requestTask._createdBy === loggedInUser._id ? "(You)" : creator : "";

    const fromPortal = location && location.state && location.state.breadcrumbs && location.state.breadcrumbs[0] && location.state.breadcrumbs[0].fromPortal ? 
      location.state.breadcrumbs[0].fromPortal : null;
    const preffixUrl = requestTask && requestTask._id && match.url.includes("/task-activity") ? `${match.url.substr(0, match.url.lastIndexOf("/task-activity"))}/task-activity/${requestTask._id}` : match.url.substr(0, match.url.lastIndexOf("/"));

    const preffixFileUrl = 
      match.params.firmId && match.params.clientId ? `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/files`
      : !match.params.firmId && match.params.clientId ? `/portal/${match.params.clientId}/files` : match.url;

    const displayFooter = (isStaff && match.params.requestTaskStatus === "unpublished") || (viewingAs === "upload" && match.params.requestTaskStatus !== "unpublished" && loggedInUser && loggedInUser._id);



    return (
      <div className="quick-view" style={{ maxWidth: "500px" }}>
        <div className="-header">
          <Link disabled={onProcess} to={`${match.url.indexOf('/task-activity') > 0 ? match.url.substring(0, match.url.indexOf('/task-activity')) : match.url.substring(0, match.url.lastIndexOf('/'))}`}>Close</Link>
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
            <div className="-sidebar-overview" style={{ opacity: isFetching ? 0.5 : 1 }}>
                <div className="-body">
                    <div className={`-options -mobile-layout yt-toolbar`} onClick={() => this.setState({ showMobileActionOption: !showMobileActionOption })}>
                      <div>
                      <CloseWrapper
                          isOpen={showMobileActionOption}
                          closeAction={this._handleCloseMobileOption}
                      />
                      <i className="far fa-ellipsis-h"></i>
                      <MobileActionsOption
                          isOpen={showMobileActionOption}
                          closeAction={() => this.setState({showMobileActionOption: false})}
                          viewingAs="request-task-quick-view"
                          handleDownLoadAllFiles={this._handleDownLoadAllFiles}
                          handleUpdateStatus={this._handleUpdateStatus}
                          requestTask={requestTask}
                          submitting={submitting}
                          isStaff={isStaff}
                      />
                      </div>
                    </div>
                    <div className="yt-col full">
                        <div className="u-pullRight">
                            <small>{DateTime.fromISO(requestTask.created_at).toFormat('LLL d yyyy')}</small>
                        </div>
                        <div className="yt-row center-vert">
                            <div className="-icon">
                                <i className="fas fa-tasks fa-3x" aria-hidden="true"></i>
                            </div>
                            <div className="padding">
                                {`${_.startCase(requestTask.status)} Task`}
                                <p className="-info">Created by {creator}</p>
                            </div>
                        </div>
                    </div>
                    <div className="tab-bar-nav -request-task-overview">
                        <ul className={`navigation ${fromPortal ? "-remove-detail" : ""}`}>
                            {  
                              fromPortal ? null :
                              <li>
                                <Link className={`action-link ${viewingAs === "detail" ? "active" : ""}`}
                                  disabled={onProcess}
                                  to={`${preffixUrl}/detail`}>Details
                                </Link>
                              </li>
                            }
                            <li>
                              <Link className={`action-link ${viewingAs === "upload" ? "active" : ""}`}
                                disabled={onProcess}
                                to={`${preffixUrl}/upload`}>Uploads
                              </Link>
                            </li>
                            <li>
                              <Link className={`action-link ${viewingAs === "activity" ? "active" : ""}`}
                                disabled={onProcess}
                                to={`${preffixUrl}/activity`}>Task Activity
                              </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="-overview-content">
                        {
                            viewingAs === "detail" ?
                            <div className="content-detail">
                                <div className="yt-row center-vert">
                                    <label className="-ov-title">Status:</label>
                                    <i className={statusClassIcon} aria-hidden="true"></i>
                                    <label>{statusText}</label>
                                </div>
                                {
                                    requestTask.status === "published" ?
                                    <div className="yt-row center-vert">
                                        <label className="-ov-title">Request Date:</label>
                                        <label>{DateTime.fromISO(requestTask.requestDate).toLocaleString(DateTime.DATE_SHORT)}</label>
                                    </div> : null
                                }
                                <div className="yt-row center-vert">
                                    <label className="-ov-title">Category:</label>
                                    <label>{requestTask.category}</label>
                                </div>
                                <div className="yt-row center-vert">
                                    <label className="-ov-title">Due Date:</label>
                                    <label>{DateTime.fromISO(requestTask.dueDate).toLocaleString(DateTime.DATE_SHORT)}</label>
                                </div>
                                <div className="yt-row center-vert">
                                    <label className="-ov-title">Description:</label>
                                    <label>{requestTask.description}</label>
                                </div>
                                <div className="yt-row center-vert">
                                    <label className="-ov-title -hide">Assignee:</label>
                                    <div className="left-title-list">
                                        <label className="-ov-title">Assignee:</label>
                                        {requestTask.assignee.map((assignee, i) => 
                                            assignee && assignee._id ? userMap[assignee._id] ?
                                            <label key={i}>{userMap[assignee._id].firstname} {userMap[assignee._id].lastname}</label>
                                            : <label key={i}>{assignee.firstname} {assignee.lastname}</label> : null
                                        )}
                                    </div>
                                </div>
                            </div>
                            : 
                            viewingAs === "upload" ?
                            <div className="content-upload">
                                <div className="yt-row center-vert">
                                  {
                                    fileMap && requestTask && requestTask._returnedFiles && requestTask._returnedFiles.length ?
                                    // preffixFileUrl
                                    requestTask._returnedFiles.map((fileId, i) => 
                                      !fileMap[fileId] ? null :
                                      <FileMicroListItem 
                                        key={i}
                                        file={fileMap[fileId]}
                                        filePath={`${preffixFileUrl}/${fileId}`}
                                      />
                                    )
                                    : <p className="u-muted"><em>No upload</em></p>
                                  }
                                </div>
                            </div>
                            :
                            viewingAs === "activity" ?
                            <div className="content-activity">
                                {/* {taskActivityItems.map((activity, i) => 
                                    <div className="yt-row center-vert" key={i}>
                                        <label className="-ov-title">
                                            {loggedInUser._id === activity._createdBy ? "(You)" : userMap[activity._createdBy] ? userMap[activity._createdBy].firstname : ""} {userMap[activity._createdBy] ? userMap[activity._createdBy].lastname : ""}
                                        </label>
                                        <label>{activity.text}</label>
                                    </div>
                                )} */}
                                { 
                                  taskActivityItems.length ? 
                                  Object.keys(taskActivitiesGroupedByDate).map(key =>
                                    <div key={key} className="activity-day-group">
                                        <div className="-day">
                                            {DateTime.fromISO(key).toFormat('D') == DateTime.local().toFormat('D') ? 
                                            "Today"
                                            :
                                            DateTime.fromISO(key).toFormat('D')
                                            }
                                        </div>
                                        { taskActivitiesGroupedByDate[key].map((activity, i) => 
                                            <TaskActivityListItem
                                                key={i}
                                                activity={activity}
                                                loggedInUser={loggedInUser}
                                                creator={userMap[activity._createdBy] || {}}
                                                user={userMap[activity._user] || {}}
                                                fileMap={fileMap}
                                                client={{}}
                                                match={match}
                                                preffixFileUrl={preffixFileUrl}
                                            />
                                            )
                                        }
                                    </div>
                                  )
                                  : 
                                  <div className="content-upload">
                                    <div className="yt-row center-vert">
                                      <p className="u-muted"><em>No task activity</em></p>
                                    </div>
                                  </div>
                                }
                            </div>
                            : null
                        }
                    </div>
                </div>
                <footer className="-footer">
                  <div className="note-editor">
                    <div className="-note-input">
                      <TextAreaInput
                        autoFocus={false}
                        change={this._handleFormChange}
                        name="content"
                        rows="2"
                        placeholder="Send a question or comment..."
                        // onEnter={this.props.submitOnEnter ? this._handleSaveNote : null}
                        value={content}
                      />
                      <div className="yt-row left">
                        <button className="yt-btn xx-small link bordered -mobile-yt-hide" onClick={this._handleDownLoadAllFiles} disabled={(requestTask && requestTask._returnedFiles.length > 0 ? false : true) || onProcess}>Download All Files</button>
                        {
                          isStaff ? <button className="yt-btn xx-small -mobile-yt-hide" onClick={this._handleUpdateStatus.bind(this, "completed")} disabled={requestTask.status !== "published" || submitting || !isStaff || onProcess}>Complete</button> : null
                        }
                        {
                          isStaff ? <button className="yt-btn xx-small -mobile-yt-hide" onClick={this._handleUpdateStatus.bind(this, "published")} disabled={requestTask.status !== "unpublished" || submitting || !isStaff || onProcess}>Publish</button> : null
                        }
                        <button className="yt-btn xx-small info" onClick={this._handleSaveTaskComment} disabled={!content || !content.trim() || submitting || onProcess}>Comment</button>
                      </div>
                    </div>
                  </div>
                </footer>
            </div>
        }
        </div>
    )
  }
}

TaskActivityOverview.propTypes = {
  dispatch: PropTypes.func.isRequired
}

TaskActivityOverview.defaultProps = {

}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
      requestTaskStore: store.requestTask
      , userStore: store.user
      , userMap: store.user.byId
      , taskActivityStore: store.taskActivity
      , loggedInUser: store.user.loggedIn.user
      , staffStore: store.staff
      , fileStore: store.file
      , fileMap: store.file.byId
      , firmStore: store.firm
    // fileActivityStore: store.fileActivity
    // , userStore: store.user
    // , loggedInUser: store.user.loggedIn.user
    // , fileStore: store.file
    // , clientStore: store.client
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(TaskActivityOverview)
);
