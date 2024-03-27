// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminNotificationListItem = ({
  notification
}) => {
  return (
    <tr >
      <td><Link to={`/admin/notifications/${notification._id}`}>{notification.name}</Link></td>
      <td>{DateTime.fromISO(notification.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/notifications/${notification._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminNotificationListItem.propTypes = {
  notification: PropTypes.object.isRequired
}

export default AdminNotificationListItem;
