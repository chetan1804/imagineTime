// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const SubscriptionListItem = ({
  subscription
}) => {
  return (
    <li>
      <Link to={`/subscriptions/${subscription._id}`}> {subscription.name}</Link>
    </li>
  )
}

SubscriptionListItem.propTypes = {
  subscription: PropTypes.object.isRequired
}

export default SubscriptionListItem;
