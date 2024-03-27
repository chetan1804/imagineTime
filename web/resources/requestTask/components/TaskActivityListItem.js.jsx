// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';

import { DateTime } from 'luxon';


const TaskActivityListItem = ({
  activity
  , loggedInUser
  , user
  , client
  , viewingAs
  , creator
  , fileMap
  , preffixFileUrl
}) => {

  if (user && !user._id && !user.firstname && activity._user && activity.user) {
    user = activity.user;
  }

  if (creator && !creator._id && !creator.firstname && activity._createdBy && activity.creator) {
    creator = activity.creator;
  }

  const fullName = user && user._id ? `${user.firstname} ${user.lastname}` : null;
  const displayName = user._id === loggedInUser._id ? '(You)' : fullName || 'a user';
  let displayText = activity.text.replace('%USER%', displayName) // customize output

  const creatorName = creator && creator._id ? `${creator.firstname} ${creator.lastname}` : null;
  const displayCreatorName = creator._id === loggedInUser._id ? '(You)' : creatorName || 'a user';
  displayText = `${displayCreatorName} ${displayText}`;

  return (
    <div className="activity-card-wrapper">
      <div className="card activity-card -show-path ">
        <div className="card-body">
          <div className="yt-row">
            <ProfilePic user={creator}/>
            <div className="yt-col">
              {/* <Link to={activity.workspace} className="-text">{`${displayText}`}</Link> */}
              <label>{displayText}</label>
              {
                activity && fileMap && !activity.note && activity._file && activity._file.length ?
                <div className="-task-activity-file-list">
                  { activity._file.map((fileId, i) => 
                    !fileMap[fileId] ? null :
                    <Link key={i} to={`${preffixFileUrl}/${fileId}`}>{fileMap[fileId].filename}</Link> 
                  ) }
                </div>
                : activity && activity.note ?
                <div className="-task-activity-file-list">
                  <small>{activity.note}</small>
                </div>
                : null
              }
              <div className="-date">{DateTime.fromISO(activity.created_at).toLocaleString(DateTime.TIME_SIMPLE)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

TaskActivityListItem.propTypes = {
  activity: PropTypes.object.isRequired
}

export default TaskActivityListItem;
