// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientTaskResponseListItem = ({
  clientTaskResponse
}) => {
  return (
    <tr >
      <td><Link to={`/admin/client-task-responses/${clientTaskResponse._id}`}>{clientTaskResponse.name}</Link></td>
      <td>{DateTime.fromISO(clientTaskResponse.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/client-task-responses/${clientTaskResponse._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminClientTaskResponseListItem.propTypes = {
  clientTaskResponse: PropTypes.object.isRequired
}

export default AdminClientTaskResponseListItem;
