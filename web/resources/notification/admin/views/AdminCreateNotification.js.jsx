/**
 * View component for /admin/notifications/new
 *
 * Creates a new notification from a copy of the defaultItem in the notification reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as notificationActions from '../../notificationActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminNotificationForm from '../components/AdminNotificationForm.js.jsx';
import AdminNotificationLayout from '../components/AdminNotificationLayout.js.jsx';

class AdminCreateNotification extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      notification: _.cloneDeep(props.defaultNotification.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the notification
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(notificationActions.fetchDefaultNotification());
    dispatch(userActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      notification: _.cloneDeep(nextProps.defaultNotification.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(notificationActions.sendCreateNotification(this.state.notification)).then(notificationRes => {
      if(notificationRes.success) {
        dispatch(notificationActions.invalidateList());
        history.push(`/admin/notifications/${notificationRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match, userStore } = this.props;
    const { notification, formHelpers } = this.state;
    const isEmpty = (!notification);

    const userListItems = userStore.util.getList('all')

    return (
      <AdminNotificationLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminNotificationForm
            notification={notification}
            cancelLink="/admin/notifications"
            formHelpers={formHelpers}
            formTitle="Create Notification"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            userListItems={userListItems}
            />
        }
      </AdminNotificationLayout>
    )
  }
}

AdminCreateNotification.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultNotification: store.notification.defaultItem
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateNotification)
);
