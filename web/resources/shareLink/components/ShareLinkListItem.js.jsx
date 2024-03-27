// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ShareLinkListItem = ({
  shareLink
}) => {
  return (
    <li>
      <Link to={`/share-links/${shareLink._id}`}> {shareLink.name}</Link>
    </li>
  )
}

ShareLinkListItem.propTypes = {
  shareLink: PropTypes.object.isRequired
}

export default ShareLinkListItem;
