// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminShareLinkListItem = ({
  shareLink
}) => {
  return (
    <tr >
      <td><Link to={`/admin/share-links/${shareLink._id}`}>{shareLink.name}</Link></td>
      <td>{DateTime.fromISO(shareLink.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/share-links/${shareLink._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminShareLinkListItem.propTypes = {
  shareLink: PropTypes.object.isRequired
}

export default AdminShareLinkListItem;
