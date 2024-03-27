/**
 * Sets up the routing for all Notification views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/notifications.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import notification views
import AdminCreateNotification from './views/AdminCreateNotification.js.jsx';
import AdminNotificationList from './views/AdminNotificationList.js.jsx';
import AdminSingleNotification from './views/AdminSingleNotification.js.jsx';
import AdminUpdateNotification from './views/AdminUpdateNotification.js.jsx';

class NotificationAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleNotificationPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notifications', path: null }]}
          component={AdminNotificationList}
          exact
          path="/admin/notifications"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notifications', path: '/admin/notifications'}, {display: 'New ', path: null}]}
          component={AdminCreateNotification}
          exact
          path="/admin/notifications/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notifications', path: '/admin/notifications'}, {display: 'Notification details', path: null}]}
          component={AdminSingleNotification}
          exact
          path="/admin/notifications/:notificationId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notifications', path: '/admin/notifications'}, {display: 'Notification Details', path: singleNotificationPath}, {display: 'Update', path: null}]}
          component={AdminUpdateNotification}
          exact
          path="/admin/notifications/:notificationId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default NotificationAdminRouter;
