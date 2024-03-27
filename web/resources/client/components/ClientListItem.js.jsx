// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientListItem = ({
  client
}) => {
  return (
    <li>
      <Link to={`/clients/${client._id}`}> {client.name}</Link>
    </li>
  )
}

ClientListItem.propTypes = {
  client: PropTypes.object.isRequired
}

export default ClientListItem;
