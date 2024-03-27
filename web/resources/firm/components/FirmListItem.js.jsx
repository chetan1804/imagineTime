// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const FirmListItem = ({
  firm
}) => {
  return (
    <li>
      <Link to={`/firms/${firm._id}`}> {firm.name}</Link>
    </li>
  )
}

FirmListItem.propTypes = {
  firm: PropTypes.object.isRequired
}

export default FirmListItem;
