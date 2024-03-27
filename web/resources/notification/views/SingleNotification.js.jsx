/**
 * View component for /notifications/:notificationId
 *
 * Displays a single notification from the 'byId' map in the notification reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as notificationActions from '../notificationActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';

// import resource components
import NotificationLayout from '../components/NotificationLayout.js.jsx';


class SingleNotification extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(notificationActions.fetchSingleIfNeeded(match.params.notificationId));
  }

  render() {
    const { notificationStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual notification object from the map
     */
    const selectedNotification = notificationStore.selected.getItem();

    const isEmpty = (
      !selectedNotification
      || !selectedNotification._id
      || notificationStore.selected.didInvalidate
    );

    const isFetching = (
      notificationStore.selected.isFetching
    )

    return (
      <NotificationLayout>
        <h3> Single Notification </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedNotification.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Notification would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Notification </Link>
          </div>
        }
      </NotificationLayout>
    )
  }
}

SingleNotification.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    notificationStore: store.notification
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SingleNotification)
);
