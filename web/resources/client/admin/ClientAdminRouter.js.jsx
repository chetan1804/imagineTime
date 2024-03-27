/**
 * Sets up the routing for all Client views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/clients.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import client views
import AdminCreateClient from './views/AdminCreateClient.js.jsx';
import AdminClientList from './views/AdminClientList.js.jsx';
import AdminSingleClient from './views/AdminSingleClient.js.jsx';
import AdminUpdateClient from './views/AdminUpdateClient.js.jsx';
import AdminUpdateClientUser from '../../clientUser/admin/views/AdminUpdateClientUser.js.jsx';
import AdminUpdateStaffClient from '../../staffClient/admin/views/AdminUpdateStaffClient.js.jsx'; 

class ClientAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleClientPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clients', path: null }]}
          component={AdminClientList}
          exact
          path="/admin/clients"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clients', path: '/admin/clients'}, {display: 'New ', path: null}]}
          component={AdminCreateClient}
          exact
          path="/admin/clients/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clients', path: '/admin/clients'}, {display: 'Client details', path: null}]}
          component={AdminSingleClient}
          exact
          path="/admin/clients/:clientId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clients', path: '/admin/clients'}, {display: 'Client Details', path: singleClientPath}, {display: 'Update', path: null}]}
          component={AdminUpdateClient}
          exact
          path="/admin/clients/:clientId/update"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'Client Details', path: singleClientPath}, {display: 'Update', path: null}]}
          component={AdminUpdateClientUser}
          exact
          path="/admin/clients/:clientId/client-users/:clientUserId/update"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'Client Details', path: singleClientPath}, {display: 'Update', path: null}]}
          component={AdminUpdateStaffClient}
          exact
          path="/admin/clients/:clientId/staff-clients/:staffClientId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ClientAdminRouter;
