/**
 * Sets up the routing for all Firm Contact views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/Firm/clients.
 */

// import primary libraries
import React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

import PracticeContactsList from './views/PracticeContactsList.js.jsx';
import PracticeContactDetails from './views/PracticeContactDetails.js.jsx';

class UserFirmRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    return (
      <Switch>
      
        <YTRoute
          breadcrumbs={[{display: 'Contacts', path: `/firm/${firmId}/contacts` }, {display: 'Contact details', path: null }]}
          component={PracticeContactDetails}
          path="/firm/:firmId/contacts/details/:userId"
          exact
          login={true}
          />
        <YTRoute
          breadcrumbs={[{display: 'Contacts', path: null }]}
          component={PracticeContactsList}
          path="/firm/:firmId/contacts"
          // exact
          staff={true}
        />
      </Switch>
    )
  }
}

export default UserFirmRouter;
