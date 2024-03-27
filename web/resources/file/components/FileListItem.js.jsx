// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const FileListItem = ({
  file
}) => {
  return (
    <li>
      <Link to={`/files/${file._id}`}> {file.name}</Link>
    </li>
  )
}

FileListItem.propTypes = {
  file: PropTypes.object.isRequired
}

export default FileListItem;
