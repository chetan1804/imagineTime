// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminFileListItem = ({
  file
}) => {
  return (
    <tr >
      <td><Link to={`/admin/files/${file._id}`}>{file.filename}</Link></td>
      <td>{DateTime.fromISO(file.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/files/${file._id}/update`}>Update Tags</Link></td>
    </tr>
  )
}

AdminFileListItem.propTypes = {
  file: PropTypes.object.isRequired
}

export default AdminFileListItem;
