// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientUserListItem = ({
  clientUser
}) => {
  return (
    <tr >
      <td><Link to={`/admin/client-users/${clientUser._id}`}>{clientUser.name}</Link></td>
      <td>{DateTime.fromISO(clientUser.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/client-users/${clientUser._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminClientUserListItem.propTypes = {
  clientUser: PropTypes.object.isRequired
}

export default AdminClientUserListItem;
