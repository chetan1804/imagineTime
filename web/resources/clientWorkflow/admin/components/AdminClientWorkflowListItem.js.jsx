// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientWorkflowListItem = ({
  clientWorkflow
}) => {
  return (
    <tr >
      <td><Link to={`/admin/client-workflows/${clientWorkflow._id}`}>{clientWorkflow.name}</Link></td>
      <td>{DateTime.fromISO(clientWorkflow.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/client-workflows/${clientWorkflow._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminClientWorkflowListItem.propTypes = {
  clientWorkflow: PropTypes.object.isRequired
}

export default AdminClientWorkflowListItem;
