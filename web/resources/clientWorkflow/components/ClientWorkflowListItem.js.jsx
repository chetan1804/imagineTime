// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientWorkflowListItem = ({
  clientWorkflow
}) => {
  return (
    <li>
      <Link to={`/client-workflows/${clientWorkflow._id}`}> {clientWorkflow.name}</Link>
    </li>
  )
}

ClientWorkflowListItem.propTypes = {
  clientWorkflow: PropTypes.object.isRequired
}

export default ClientWorkflowListItem;
