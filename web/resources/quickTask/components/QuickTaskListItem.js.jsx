// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const QuickTaskListItem = ({
  quickTask
}) => {
  return (
    <li>
      <Link to={`/quick-tasks/${quickTask._id}`}> {quickTask.name}</Link>
    </li>
  )
}

QuickTaskListItem.propTypes = {
  quickTask: PropTypes.object.isRequired
}

export default QuickTaskListItem;
