// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const TagListItem = ({
  tag
}) => {
  return (
    <li>
      <Link to={`/tags/${tag._id}`}> {tag.name}</Link>
    </li>
  )
}

TagListItem.propTypes = {
  tag: PropTypes.object.isRequired
}

export default TagListItem;
