// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import ProfilePic from '../../../global/components/navigation/ProfilePic.js.jsx';

import { DateTime } from 'luxon';

const ClientNoteItem = ({
  clientNote 
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
          <p><strong>{user.firstname} {user.lastname}</strong> <small className="u-muted">{DateTime.fromISO(clientNote.created_at).toRelativeCalendar()}</small></p>
          <p>
            {clientNote.content}
          </p>
        </div>
      </div>
    )
  }
}

ClientNoteItem.propTypes = {
  clientNote: PropTypes.object.isRequired
  , user: PropTypes.object 
}

ClientNoteItem.defaultProps = {
  user: null
}

export default withRouter(ClientNoteItem);
