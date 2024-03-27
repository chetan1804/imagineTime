// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientNoteListItem = ({
  clientNote
}) => {
  return (
    <li>
      <Link to={`/client-notes/${clientNote._id}`}> {clientNote.name}</Link>
    </li>
  )
}

ClientNoteListItem.propTypes = {
  clientNote: PropTypes.object.isRequired
}

export default ClientNoteListItem;
