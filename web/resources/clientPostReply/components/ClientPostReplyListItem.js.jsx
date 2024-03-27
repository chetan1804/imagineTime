// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ClientPostReplyListItem = ({
  clientPostReply
}) => {
  return (
    <li>
      <Link to={`/client-post-replies/${clientPostReply._id}`}> {clientPostReply.name}</Link>
    </li>
  )
}

ClientPostReplyListItem.propTypes = {
  clientPostReply: PropTypes.object.isRequired
}

export default ClientPostReplyListItem;
