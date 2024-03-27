// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminStaffClientListItem = ({
  staffClient
}) => {
  return (
    <tr >
      <td><Link to={`/admin/staff-clients/${staffClient._id}`}>{staffClient.name}</Link></td>
      <td>{DateTime.fromISO(staffClient.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/staff-clients/${staffClient._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminStaffClientListItem.propTypes = {
  staffClient: PropTypes.object.isRequired
}

export default AdminStaffClientListItem;
