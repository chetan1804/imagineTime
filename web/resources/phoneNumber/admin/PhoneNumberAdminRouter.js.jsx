/**
 * Sets up the routing for all Phone Number views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/phone-numbers.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import phoneNumber views
import AdminCreatePhoneNumber from './views/AdminCreatePhoneNumber.js.jsx';
import AdminPhoneNumberList from './views/AdminPhoneNumberList.js.jsx';
import AdminSinglePhoneNumber from './views/AdminSinglePhoneNumber.js.jsx';
import AdminUpdatePhoneNumber from './views/AdminUpdatePhoneNumber.js.jsx';

class PhoneNumberAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singlePhoneNumberPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All phone-numbers', path: null }]}
          component={AdminPhoneNumberList}
          exact
          path="/admin/phone-numbers"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All phone-numbers', path: '/admin/phone-numbers'}, {display: 'New ', path: null}]}
          component={AdminCreatePhoneNumber}
          exact
          path="/admin/phone-numbers/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All phone-numbers', path: '/admin/phone-numbers'}, {display: 'Phone Number details', path: null}]}
          component={AdminSinglePhoneNumber}
          exact
          path="/admin/phone-numbers/:phoneNumberId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All phone-numbers', path: '/admin/phone-numbers'}, {display: 'Phone Number Details', path: singlePhoneNumberPath}, {display: 'Update', path: null}]}
          component={AdminUpdatePhoneNumber}
          exact
          path="/admin/phone-numbers/:phoneNumberId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default PhoneNumberAdminRouter;
