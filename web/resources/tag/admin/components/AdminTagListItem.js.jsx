// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminTagListItem = ({
  tag
}) => {
  return (
    <tr >
      <td><Link to={`/admin/tags/${tag._id}`}>{tag.name}</Link></td>
      <td>{DateTime.fromISO(tag.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/tags/${tag._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminTagListItem.propTypes = {
  tag: PropTypes.object.isRequired
}

export default AdminTagListItem;
