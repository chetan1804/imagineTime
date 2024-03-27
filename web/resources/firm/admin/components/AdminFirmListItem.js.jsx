// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminFirmListItem = ({
  firm
}) => {
  return (
    <tr >
      <td><Link to={`/admin/firms/${firm._id}`}>{firm.name}</Link></td>
      <td>{DateTime.fromISO(firm.updated_at).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td>{firm.created_by}</td>
      <td className="u-textRight"><Link to={`/admin/firms/${firm._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminFirmListItem.propTypes = {
  firm: PropTypes.object.isRequired
}

export default AdminFirmListItem;
