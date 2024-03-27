/**
 * View component for /notifications
 *
 * Generic notification list view. Defaults to 'all' with:
 * this.props.dispatch(notificationActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
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
import NotificationListItem from '../components/NotificationListItem.js.jsx';

class NotificationList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(notificationActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { notificationStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the notificationList meta info here so we can reference 'isFetching'
    const notificationList = notificationStore.lists ? notificationStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual notification objetcs
     */
    const notificationListItems = notificationStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !notificationListItems
      || !notificationList
    );

    const isFetching = (
      !notificationListItems
      || !notificationList
      || notificationList.isFetching
    )

    return (
      <NotificationLayout>
        <h1> Notification List </h1>
        <hr/>
        <Link to={'/notifications/new'}> New Notification </Link>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <ul>
              {notificationListItems.map((notification, i) =>
                <NotificationListItem key={notification._id + i} notification={notification} />
              )}
            </ul>
          </div>
        }
      </NotificationLayout>
    )
  }
}

NotificationList.propTypes = {
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
  )(NotificationList)
);
