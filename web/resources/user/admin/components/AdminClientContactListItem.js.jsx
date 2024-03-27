// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientContactListItem = ({
  contact 
}) => {
  return (
    <tr>
      <td><Link to={`/admin/users/${contact._id}`}>{contact.firstname} {contact.lastname}</Link></td>
      <td>{contact.username}</td>
      <td>{contact.clientName}</td>
      <td>{contact.status}</td>
      <td>{DateTime.fromISO(contact.updated_at).toLocaleString(DateTime.DATETIME_SHORT)}</td>
    </tr>
  )
}

AdminClientContactListItem.propTypes = {
  contact: PropTypes.object.isRequired
}

export default AdminClientContactListItem;
