// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';

import { DateTime } from 'luxon';


const FileActivityListItem = ({
  activity
  , loggedInUser
  , user
  , client
  , viewingAs
}) => {

  if (user && !user._id && !user.firstname && activity._user && activity.user) {
    user = activity.user;
  }
  const fullName = user && user._id ? `${user.firstname} ${user.lastname}` : null;
  const displayName = user._id === loggedInUser._id ? '(You)' : fullName || 'a user';
  let displayText = activity.text.replace('%USER%', displayName) // customize output
  displayText = displayText.replace("%CLIENT%", client.name);
  displayText = viewingAs === "taskActivity" ? `${displayName} ${displayText}` : displayText;

  return (
    <div className="activity-card-wrapper">
      <div className="card activity-card -show-path ">
        <div className="card-body">
          <div className="yt-row">
            <ProfilePic user={user}/>
            <div className="yt-col">
              {/* <Link to={activity.workspace} className="-text">{`${displayText}`}</Link> */}
              <label>{displayText}</label>
              <div className="-date">{DateTime.fromISO(activity.created_at).toLocaleString(DateTime.TIME_SIMPLE)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

FileActivityListItem.propTypes = {
  activity: PropTypes.object.isRequired
}

export default FileActivityListItem;
