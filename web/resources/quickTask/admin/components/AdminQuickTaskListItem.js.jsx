// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminQuickTaskListItem = ({
  quickTask
  , client
  , firm
}) => {
  return (
    <tr >
      <td>{client ? client.name : null}</td>
      <td>{firm ? firm.name : null}</td>
      <td>{quickTask.status}</td>
      <td>{quickTask.type}</td>
      <td>{DateTime.fromISO(quickTask.created_at).toLocaleString(DateTime.DATETIME_SHORT)}</td>
    </tr>
  )
}

AdminQuickTaskListItem.propTypes = {
  quickTask: PropTypes.object.isRequired
}

export default AdminQuickTaskListItem;
