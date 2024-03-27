// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const StaffClientListItem = ({
  staffClient
}) => {
  return (
    <li>
      <Link to={`/staff-clients/${staffClient._id}`}> {staffClient.name}</Link>
    </li>
  )
}

StaffClientListItem.propTypes = {
  staffClient: PropTypes.object.isRequired
}

export default StaffClientListItem;
