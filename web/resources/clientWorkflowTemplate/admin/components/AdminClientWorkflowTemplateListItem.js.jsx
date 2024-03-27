// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import _ from 'lodash';
import { DateTime } from 'luxon';

const AdminClientWorkflowTemplateListItem = ({
  clientWorkflowTemplate
}) => {
  return (
    <tr >
      <td><Link to={`/admin/client-workflow-templates/${clientWorkflowTemplate._id}`}>{clientWorkflowTemplate.name}</Link></td>
      <td>{DateTime.fromISO(clientWorkflowTemplate.updated).toLocaleString(DateTime.DATETIME_SHORT)}</td>
      <td className="u-textRight"><Link to={`/admin/client-workflow-templates/${clientWorkflowTemplate._id}/update`}>Update</Link></td>
    </tr>
  )
}

AdminClientWorkflowTemplateListItem.propTypes = {
  clientWorkflowTemplate: PropTypes.object.isRequired
}

export default AdminClientWorkflowTemplateListItem;
