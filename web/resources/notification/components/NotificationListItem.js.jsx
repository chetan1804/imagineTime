// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const NotificationListItem = ({
  notification
}) => {
  return (
    <li>
      <Link to={`/notifications/${notification._id}`}> {notification.name}</Link>
    </li>
  )
}

NotificationListItem.propTypes = {
  notification: PropTypes.object.isRequired
}

export default NotificationListItem;
