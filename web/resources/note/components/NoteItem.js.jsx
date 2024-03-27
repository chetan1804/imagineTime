// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';

import { DateTime } from 'luxon';

const NoteItem = ({
  note 
  , user 
}) => {
  if(!user) {
    return (
      <div className="note-item">
        <div className="-profile-pic">
          <div className="loading -small"></div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="note-item">
        <div className="-profile-pic">
          <ProfilePic
            user={user}
          />
        </div>
        <div className="-content">
          <p><strong>{user.firstname} {user.lastname}</strong> <small className="u-muted">{DateTime.fromISO(note.created_at).toRelativeCalendar()}</small></p>
          <p>
            {note.content}
          </p>
        </div>
      </div>
    )
  }
}

NoteItem.propTypes = {
  note: PropTypes.object.isRequired
  , user: PropTypes.object 
}

NoteItem.defaultProps = {
  user: null
}

export default withRouter(NoteItem);
