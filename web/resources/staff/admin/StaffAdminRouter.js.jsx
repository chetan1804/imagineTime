/**
 * Sets up the routing for all Staff views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/staff.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import staff views
import AdminCreateStaff from './views/AdminCreateStaff.js.jsx';
import AdminStaffList from './views/AdminStaffList.js.jsx';
import AdminSingleStaff from './views/AdminSingleStaff.js.jsx';
import AdminUpdateStaff from './views/AdminUpdateStaff.js.jsx';

class StaffAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleStaffPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff', path: null }]}
          component={AdminStaffList}
          exact
          path="/admin/staff"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff', path: '/admin/staff'}, {display: 'New ', path: null}]}
          component={AdminCreateStaff}
          exact
          path="/admin/staff/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff', path: '/admin/staff'}, {display: 'Staff details', path: null}]}
          component={AdminSingleStaff}
          exact
          path="/admin/staff/:staffId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All staff', path: '/admin/staff'}, {display: 'Staff Details', path: singleStaffPath}, {display: 'Update', path: null}]}
          component={AdminUpdateStaff}
          exact
          path="/admin/staff/:staffId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default StaffAdminRouter;
