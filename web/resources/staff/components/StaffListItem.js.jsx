// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const StaffListItem = ({
  staff
}) => {
  return (
    <li>
      <Link to={`/staff/${staff._id}`}> {staff.name}</Link>
    </li>
  )
}

StaffListItem.propTypes = {
  staff: PropTypes.object.isRequired
}

export default StaffListItem;
