// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientTaskResponseListItem = ({
  clientTaskResponse
}) => {
  return (
    <li>
      <Link to={`/client-task-responses/${clientTaskResponse._id}`}> {clientTaskResponse.name}</Link>
    </li>
  )
}

ClientTaskResponseListItem.propTypes = {
  clientTaskResponse: PropTypes.object.isRequired
}

export default ClientTaskResponseListItem;
