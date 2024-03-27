/**
 * Sets up the routing for all Firm views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/firms.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import firm views
import AdminCreateFirm from './views/AdminCreateFirm.js.jsx';
import AdminFirmList from './views/AdminFirmList.js.jsx';
import AdminSingleFirm from './views/AdminSingleFirm.js.jsx';
import AdminUpdateFirm from './views/AdminUpdateFirm.js.jsx';

// import resource views
import AdminFirmClientList from '../../client/admin/views/AdminFirmClientList.js.jsx';
import AdminFirmCreateClient from '../../client/admin/views/AdminFirmCreateClient.js.jsx'; 
import AdminFirmContactList from '../../user/admin/views/AdminFirmContactList.js.jsx';

class FirmAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    // let singleFirmPath = this.props.location.pathname.replace('/update', '');
    const firmId = this.props.location.pathname.split('/')[3];
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: null }]}
          component={AdminFirmList}
          exact
          path="/admin/firms"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: '/admin/firms'}, {display: 'New ', path: null}]}
          component={AdminCreateFirm}
          exact
          path="/admin/firms/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: '/admin/firms'}, {display: 'Firm details', path: null}]}
          component={AdminSingleFirm}
          exact
          path="/admin/firms/:firmId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: '/admin/firms'}, {display: 'Firm Details', path: `/admin/firms/${firmId}`}, {display: 'Update', path: null}]}
          component={AdminUpdateFirm}
          exact
          path="/admin/firms/:firmId/update"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: '/admin/firms'}, {display: 'Firm Details', path: `/admin/firms/${firmId}`}, {display: 'Clients', path: null}]}
          component={AdminFirmClientList}
          exact
          path="/admin/firms/:firmId/clients"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: '/admin/firms'}, {display: 'Firm Details', path: `/admin/firms/${firmId}`}, {display: 'Clients', path: null}]}
          component={AdminFirmCreateClient}
          exact
          path="/admin/firms/:firmId/clients/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All firms', path: '/admin/firms'}, {display: 'Firm Details', path: `/admin/firms/${firmId}`}, {display: 'Client Contacts', path: null}]}
          component={AdminFirmContactList}
          exact
          path="/admin/firms/:firmId/contacts"
          role="admin"
        />
      </Switch>
    )
  }
}

export default FirmAdminRouter;
