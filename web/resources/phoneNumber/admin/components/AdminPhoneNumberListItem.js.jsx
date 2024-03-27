// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminPhoneNumberListItem = ({
  phoneNumber
}) => {
  return (
    <tr >
      <td><Link to={`/admin/phone-numbers/${phoneNumber._id}`}>{phoneNumber.name}</Link></td>
      <td>{DateTime.fromISO(phoneNumber.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/phone-numbers/${phoneNumber._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminPhoneNumberListItem.propTypes = {
  phoneNumber: PropTypes.object.isRequired
}

export default AdminPhoneNumberListItem;
