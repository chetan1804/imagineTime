// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';

import { DateTime } from 'luxon';


const ActivityListItem = ({
  activity
  , loggedInUser
  , user
  , viewingAs
  , clientStore
}) => {
  // console.log(activity.created_at)
  // const displayName = user._id === loggedInUser._id ? 'You' : user.firstname || 'A user';

  activity = _.cloneDeep(activity);
  let displayName = "";
  let displayText = "";

  if (loggedInUser && user && user._id === loggedInUser._id) {
    displayName = 'You';
  } else if (user && user.firstname) {
    displayName = user.firstname;
    if (user.lastname) {
      displayName += ` ${user.lastname}`;
    }
  } else {
    if (activity && activity.link && activity.text && activity.text.indexOf('by') > -1) {
      displayName = activity.text.substr(activity.text.lastIndexOf('by') + 3);
    } else {
      displayName = 'A user';
    }
  }
  
  if (activity && !activity.link) {
    if (viewingAs === "workspace") {
      activity.link = `/firm/${activity._firm}/workspaces/${activity._client}/files/${activity._file}?tab=activity`;
    } else if (viewingAs === "portal") {
      activity.link = `/portal/${activity._client}/files/${activity._file}`;
    }
    if (activity.text.indexOf('Viewed by') > -1) {
      activity.text = `${displayName} viewed a file`;
    } else if (activity.text.indexOf('Moved by') > -1) {
      activity.text = `${displayName} moved a file`;
    } else if (activity.text.indexOf('Rename to') > -1) {
      activity.text = `${displayName} renamed a file`;
    } else if (activity.text.indexOf('Reinstate by') > -1) {
      activity.text = `${displayName} reinstated a file`;
    } else if (activity.text.indexOf('archived by') > -1) {
      activity.text = `${displayName} archived a file`;
    } else if (activity.text.indexOf('Changed visibility to') > -1) {
      activity.text = `${displayName} changed the visibility status of a file`;
    } else if (activity.text.indexOf('Shared by') > -1) {
      activity.text = `${displayName} shared a file`;
    } else if (activity.text.indexOf('Downloaded by') > -1) {
      activity.text = `${displayName} downloaded a file`;
    } else if (activity.text.indexOf('Deleted by') > -1) {
      activity.text = `${displayName} deleted a file`;
    }
  }

  if (activity && activity.text && activity.text.indexOf('undefined') > -1) {
    displayText = activity.text.replace('undefined', displayName) // customize output;
  } else if (activity && activity.text && activity.text.indexOf('null') > -1) {
    displayText = activity.text.replace('null', displayName) // customize output;
  } else {
    displayText = activity.text.replace('%USER%', displayName) // customize output
  }

  if (displayText && displayText.indexOf('%CLIENT%') > -1) {
    let workspaceName = "";
    if (activity._client) {
      workspaceName = clientStore && clientStore.byId && clientStore.byId[activity._client] && clientStore.byId[activity._client].name;
    } else {
      workspaceName = "different workspace";
    }

    displayText = displayText.replace('%CLIENT%', workspaceName) // customize output
  }

  console.log(`---activity---`, activity);
  console.log('---displayText---', displayText);

  return (
    <div className="activity-card-wrapper">
      <div className="card activity-card -show-path ">
        <div className="card-body">
          <div className="yt-row">
            <ProfilePic user={user}/>
            <div className="yt-col">
              <Link to={activity.link} className="-text">{`${displayText}`}</Link>
              <div className="-date">{DateTime.fromISO(activity.created_at).toLocaleString(DateTime.TIME_SIMPLE)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

ActivityListItem.propTypes = {
  activity: PropTypes.object.isRequired
}

export default ActivityListItem;
