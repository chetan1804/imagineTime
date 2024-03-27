// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminAddressListItem = ({
  address
}) => {
  return (
    <tr >
      <td><Link to={`/admin/addresses/${address._id}`}>{address.name}</Link></td>
      <td>{DateTime.fromISO(address.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/addresses/${address._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminAddressListItem.propTypes = {
  address: PropTypes.object.isRequired
}

export default AdminAddressListItem;
