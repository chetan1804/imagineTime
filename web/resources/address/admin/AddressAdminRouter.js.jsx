/**
 * Sets up the routing for all Address views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/addresses.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import address views
import AdminCreateAddress from './views/AdminCreateAddress.js.jsx';
import AdminAddressList from './views/AdminAddressList.js.jsx';
import AdminSingleAddress from './views/AdminSingleAddress.js.jsx';
import AdminUpdateAddress from './views/AdminUpdateAddress.js.jsx';

class AddressAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleAddressPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All addresses', path: null }]}
          component={AdminAddressList}
          exact
          path="/admin/addresses"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All addresses', path: '/admin/addresses'}, {display: 'New ', path: null}]}
          component={AdminCreateAddress}
          exact
          path="/admin/addresses/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All addresses', path: '/admin/addresses'}, {display: 'Address details', path: null}]}
          component={AdminSingleAddress}
          exact
          path="/admin/addresses/:addressId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All addresses', path: '/admin/addresses'}, {display: 'Address Details', path: singleAddressPath}, {display: 'Update', path: null}]}
          component={AdminUpdateAddress}
          exact
          path="/admin/addresses/:addressId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default AddressAdminRouter;
