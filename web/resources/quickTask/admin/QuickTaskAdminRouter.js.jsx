/**
 * Sets up the routing for all QuickTask views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/quick-tasks.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import QuickTask views
import AdminQuickTaskList from './views/AdminQuickTaskList.js.jsx';

class QuickTaskAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleQuickTaskPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All QuickTasks', path: null }]}
          component={AdminQuickTaskList}
          exact
          path="/admin/quick-tasks"
          role="admin"
        />
      </Switch>
    )
  }
}

export default QuickTaskAdminRouter;
