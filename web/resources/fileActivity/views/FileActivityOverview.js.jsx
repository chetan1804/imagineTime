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

// import actions
// import * as addressActions from '../../../address/addressActions';
import * as fileActivityActions from '../../fileActivity/fileActivityActions'; 
import * as userActions from '../../user/userActions';
import * as fileActions from '../../file/fileActions';
import * as clientActions from '../../client/clientActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { displayUtils, permissions } from '../../../global/utils';

// import resource components
import FileActivityListItem from '../../activity/components/fileActivityListItem.js.jsx';

class FileActivityOverview extends Binder {
  constructor(props) {
    super(props);
    this.state = {
        selectedDate: null
    }
    this._bind()
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(fileActivityActions.fetchListIfNeeded('_firm', match.params.firmId, '_file', match.params.fileId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(fileActions.fetchSingleIfNeeded(match.params.fileId));
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
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

  componentWillUnmount() {
    const { dispatch, match } = this.props;
    dispatch(fileActivityActions.invalidateList('_firm', match.params.firmId, '_file', match.params.fileId));
  }

  render() {
    const { 
      match
      , fileActivityStore
      , userStore
      , loggedInUser
      , fileStore
      , clientStore
    } = this.props;

    // file activity
    const activityListItems = fileActivityStore.util.getList('_firm', match.params.firmId, '_file', match.params.fileId);
    const filteredActivityListItems = activityListItems ? this._filterListByDate(activityListItems) : [];
    const filesActivitiesGroupedByDate = filteredActivityListItems ? this._groupActivitiesByDate(filteredActivityListItems) : [];
    const selectedFile = fileStore ? fileStore.selected.getItem() : null;   
    const icon = selectedFile ? displayUtils.getFileIcon(selectedFile.category, selectedFile.contentType, selectedFile) : null;
    let textErrorDisplay = null;

    if (selectedFile && selectedFile._client && match.params.clientId && selectedFile._client != match.params.clientId) {
      textErrorDisplay = 'The file is not associated with this client.';
    } else if (selectedFile && selectedFile.status === 'deleted') {
      textErrorDisplay = 'The file has been deleted.';
    }

    const isEmpty = (
      fileActivityStore.selected.didInvalidate
      , userStore.selected.didInvalidate
      , fileStore.selected.didInvalidate
      , clientStore.selected.didInvalidate
      , !selectedFile
    );

    const isFetching = (
      fileActivityStore.selected.isFetching
      , userStore.selected.isFetching
      , fileStore.selected.isFetching
      , clientStore.selected.isFetching
    );

    return (
      <div className="quick-view">
        <div className="-header">
          <Link to={`${match.url.substring(0, match.url.indexOf('/file-activity'))}`}>Close</Link>
        </div>
        { isEmpty  || textErrorDisplay?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>{textErrorDisplay || 'Empty.'}</p>
              </div>
            </div>
          )
          :
            <div style={{ opacity: isFetching ? 0.5 : 1 }}>
                <div className="-body" >
                    <div className="-user-info" style={{ marginBottom: "1em" }}>
                        <span className="-icon">
                            <img src={`/img/icons/${icon}.png`} style={{ width: "60px" }} />
                        </span>                        
                        <div className="-text" style={{ lineHeight: "1.2" }}>
                            <Link className="-filename" to={`/firm/${match.params.firmId}/files/${selectedFile._id}`}>
                                {selectedFile ? selectedFile.filename : ""}
                            </Link>
                            <br/>
                            <small>
                            { userStore.byId[selectedFile._user] ?
                                <span>by {userStore.byId[selectedFile._user].firstname} {userStore.byId[selectedFile._user].lastname}</span>
                                :
                                selectedFile.uploadName ?
                                <span>by <em>{selectedFile.uploadName} (not logged in)</em></span>
                                :
                                null
                            }
                            </small>
                        </div>
                    </div>

                    { Object.keys(filesActivitiesGroupedByDate).map(key =>
                        <div key={key} className="activity-day-group">
                        <div className="-day">
                            {DateTime.fromISO(key).toFormat('D') == DateTime.local().toFormat('D') ? 
                            "Today"
                            :
                            DateTime.fromISO(key).toFormat('D')
                            }
                        </div>
                        { filesActivitiesGroupedByDate[key].map((activity, i) => 
                            <FileActivityListItem
                                key={activity._id + '_' + i}
                                activity={activity}
                                loggedInUser={loggedInUser}
                                user={userStore.byId[activity._user] || {}}
                                client={clientStore.byId[activity._client] || {}}
                            />
                            )
                        }
                        </div>
                    )}
                </div>
            </div>
        }
        </div>
    )
  }
}

FileActivityOverview.propTypes = {
  dispatch: PropTypes.func.isRequired
}

FileActivityOverview.defaultProps = {

}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    fileActivityStore: store.fileActivity
    , userStore: store.user
    , loggedInUser: store.user.loggedIn.user
    , fileStore: store.file
    , clientStore: store.client
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(FileActivityOverview)
);
