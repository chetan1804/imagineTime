// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientActivityListItem = ({
  clientActivity
}) => {
  return (
    <li>
      <Link to={`/client-activities/${clientActivity._id}`}> {clientActivity.name}</Link>
    </li>
  )
}

ClientActivityListItem.propTypes = {
  clientActivity: PropTypes.object.isRequired
}

export default ClientActivityListItem;
