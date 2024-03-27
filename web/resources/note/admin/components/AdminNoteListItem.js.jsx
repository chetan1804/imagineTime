// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminNoteListItem = ({
  note
}) => {
  return (
    <tr >
      <td><Link to={`/admin/notes/${note._id}`}>{note.name}</Link></td>
      <td>{DateTime.fromISO(note.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/notes/${note._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminNoteListItem.propTypes = {
  note: PropTypes.object.isRequired
}

export default AdminNoteListItem;
