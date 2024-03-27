/**
 * Sets up the routing for all Staff Client views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/staff-clients.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import staffClient views
import AdminCreateStaffClient from './views/AdminCreateStaffClient.js.jsx';
import AdminStaffClientList from './views/AdminStaffClientList.js.jsx';
import AdminSingleStaffClient from './views/AdminSingleStaffClient.js.jsx';
import AdminUpdateStaffClient from './views/AdminUpdateStaffClient.js.jsx';

class StaffClientAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleStaffClientPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff-clients', path: null }]}
          component={AdminStaffClientList}
          exact
          path="/admin/staff-clients"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff-clients', path: '/admin/staff-clients'}, {display: 'New ', path: null}]}
          component={AdminCreateStaffClient}
          exact
          path="/admin/staff-clients/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff-clients', path: '/admin/staff-clients'}, {display: 'Staff Client details', path: null}]}
          component={AdminSingleStaffClient}
          exact
          path="/admin/staff-clients/:staffClientId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff-clients', path: '/admin/staff-clients'}, {display: 'Staff Client Details', path: singleStaffClientPath}, {display: 'Update', path: null}]}
          component={AdminUpdateStaffClient}
          exact
          path="/admin/staff-clients/:staffClientId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default StaffClientAdminRouter;
