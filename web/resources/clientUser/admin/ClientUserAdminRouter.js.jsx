/**
 * Sets up the routing for all Client User views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/client-users.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientUser views
import AdminCreateClientUser from './views/AdminCreateClientUser.js.jsx';
import AdminClientUserList from './views/AdminClientUserList.js.jsx';
import AdminSingleClientUser from './views/AdminSingleClientUser.js.jsx';
import AdminUpdateClientUser from './views/AdminUpdateClientUser.js.jsx';

class ClientUserAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleClientUserPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-users', path: null }]}
          component={AdminClientUserList}
          exact
          path="/admin/client-users"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-users', path: '/admin/client-users'}, {display: 'New ', path: null}]}
          component={AdminCreateClientUser}
          exact
          path="/admin/client-users/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-users', path: '/admin/client-users'}, {display: 'Client User details', path: null}]}
          component={AdminSingleClientUser}
          exact
          path="/admin/client-users/:clientUserId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-users', path: '/admin/client-users'}, {display: 'Client User Details', path: singleClientUserPath}, {display: 'Update', path: null}]}
          component={AdminUpdateClientUser}
          exact
          path="/admin/client-users/:clientUserId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ClientUserAdminRouter;
