// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const NoteListItem = ({
  note
  , user
}) => {
  return (
    <li>
      <div>
        <p>{note.created_at}</p>
        <p>Created by: {user.firstname} {user.lastname}</p>
        <span>{note.content}</span>
      </div>
    </li>
  )
}

NoteListItem.propTypes = {
  note: PropTypes.object.isRequired
}

export default NoteListItem;
