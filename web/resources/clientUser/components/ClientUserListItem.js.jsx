// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientUserListItem = ({
  clientUser
}) => {
  return (
    <li>
      <Link to={`/client-users/${clientUser._id}`}> {clientUser.name}</Link>
    </li>
  )
}

ClientUserListItem.propTypes = {
  clientUser: PropTypes.object.isRequired
}

export default ClientUserListItem;
