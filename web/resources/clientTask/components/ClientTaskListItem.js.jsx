// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientTaskListItem = ({
  task
}) => {
  return (
    <li>
      <Link to={`/client-tasks/${clientTask._id}`}> {clientTask.name}</Link>
    </li>
  )
}

ClientTaskListItem.propTypes = {
  clientTask: PropTypes.object.isRequired
}

export default ClientTaskListItem;
