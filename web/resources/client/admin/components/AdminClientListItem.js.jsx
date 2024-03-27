// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientListItem = ({
  client
}) => {
  return (
    <tr >
      <td><Link to={`/admin/clients/${client._id}`}>{client.name}</Link></td>
      <td>{DateTime.fromISO(client.updated_at).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/clients/${client._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminClientListItem.propTypes = {
  client: PropTypes.object.isRequired
}

export default AdminClientListItem;
