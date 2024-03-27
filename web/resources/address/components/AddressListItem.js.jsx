// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const AddressListItem = ({
  address
}) => {
  return (
    <li>
      <Link to={`/addresses/${address._id}`}> {address.name}</Link>
    </li>
  )
}

AddressListItem.propTypes = {
  address: PropTypes.object.isRequired
}

export default AddressListItem;
