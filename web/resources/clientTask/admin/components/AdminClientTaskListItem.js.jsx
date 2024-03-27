// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientTaskListItem = ({
  task
}) => {
  return (
    <tr >
      <td><Link to={`/admin/client-tasks/${clientTask._id}`}>{clientTask.name}</Link></td>
      <td>{DateTime.fromISO(clientTask.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/client-tasks/${clientTask._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminClientTaskListItem.propTypes = {
  clientTask: PropTypes.object.isRequired
}

export default AdminClientTaskListItem;
