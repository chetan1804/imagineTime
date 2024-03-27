// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientTaskTemplateListItem = ({
  clientTaskTemplate
}) => {
  return (
    <li>
      <Link to={`/client-task-templates/${clientTaskTemplate._id}`}> {clientTaskTemplate.name}</Link>
    </li>
  )
}

ClientTaskTemplateListItem.propTypes = {
  clientTaskTemplate: PropTypes.object.isRequired
}

export default ClientTaskTemplateListItem;
