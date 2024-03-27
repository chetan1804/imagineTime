// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminSubscriptionListItem = ({
  subscription
}) => {
  return (
    <tr >
      <td><Link to={`/admin/subscriptions/${subscription._id}`}>{subscription.name}</Link></td>
      <td>{DateTime.fromISO(subscription.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/subscriptions/${subscription._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminSubscriptionListItem.propTypes = {
  subscription: PropTypes.object.isRequired
}

export default AdminSubscriptionListItem;
