// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

const ClientWorkflowTemplateListItem = ({
  clientWorkflowTemplate
  , match
  , onClick
}) => {
  return (
    onClick ?
    <li onClick={onClick} className="action-link">
      <p>{clientWorkflowTemplate.title}</p>
    </li>
    :
    <li>
      <Link to={`${match.url}/${clientWorkflowTemplate._id}`}> {clientWorkflowTemplate.title}</Link>
    </li>
  )
}

ClientWorkflowTemplateListItem.propTypes = {
  clientWorkflowTemplate: PropTypes.object.isRequired
}

export default withRouter(ClientWorkflowTemplateListItem);
