/**
 * Sets up the routing for all ClientTask views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/client-tasks.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import task views
import AdminCreateClientTask from './views/AdminCreateClientTask.js.jsx';
import AdminClientTaskList from './views/AdminClientTaskList.js.jsx';
import AdminSingleClientTask from './views/AdminSingleClientTask.js.jsx';
import AdminUpdateClientTask from './views/AdminUpdateClientTask.js.jsx';

class ClientTaskAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleClientTaskPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tasks', path: null }]}
          component={AdminClientTaskList}
          exact
          path="/admin/client-tasks"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tasks', path: '/admin/client-tasks'}, {display: 'New ', path: null}]}
          component={AdminCreateClientTask}
          exact
          path="/admin/client-tasks/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tasks', path: '/admin/client-tasks'}, {display: 'ClientTask details', path: null}]}
          component={AdminSingleClientTask}
          exact
          path="/admin/client-tasks/:clientTaskId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tasks', path: '/admin/client-tasks'}, {display: 'ClientTask Details', path: singleClientTaskPath}, {display: 'Update', path: null}]}
          component={AdminUpdateClientTask}
          exact
          path="/admin/client-tasks/:clientTaskId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ClientTaskAdminRouter;
