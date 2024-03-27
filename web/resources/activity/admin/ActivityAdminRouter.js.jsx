/**
 * Sets up the routing for all Activity views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/activities.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import activity views
import AdminCreateActivity from './views/AdminCreateActivity.js.jsx';
import AdminActivityList from './views/AdminActivityList.js.jsx';
import AdminSingleActivity from './views/AdminSingleActivity.js.jsx';
import AdminUpdateActivity from './views/AdminUpdateActivity.js.jsx';

class ActivityAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleActivityPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All activities', path: null }]}
          component={AdminActivityList}
          exact
          path="/admin/activities"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All activities', path: '/admin/activities'}, {display: 'New ', path: null}]}
          component={AdminCreateActivity}
          exact
          path="/admin/activities/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All activities', path: '/admin/activities'}, {display: 'Activity details', path: null}]}
          component={AdminSingleActivity}
          exact
          path="/admin/activities/:activityId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All activities', path: '/admin/activities'}, {display: 'Activity Details', path: singleActivityPath}, {display: 'Update', path: null}]}
          component={AdminUpdateActivity}
          exact
          path="/admin/activities/:activityId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ActivityAdminRouter;
