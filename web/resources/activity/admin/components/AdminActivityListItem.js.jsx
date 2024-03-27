// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminActivityListItem = ({
  activity
}) => {
  return (
    <tr >
      <td><Link to={`/admin/activities/${activity._id}`}>{activity.name}</Link></td>
      <td>{DateTime.fromISO(activity.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/activities/${activity._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminActivityListItem.propTypes = {
  activity: PropTypes.object.isRequired
}

export default AdminActivityListItem;
