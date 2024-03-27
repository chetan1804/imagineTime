/**
 * Sets up the routing for all Firm Client Workspace views.
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
import { Switch, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

import SignatureList from './views/SignatureList.js.jsx';


class SignatureRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Signatures', path: null }]}
          component={SignatureList}
          path="/firm/:firmId/signatures"
          exact
          staff={true}
        />
      </Switch>
    )
  }
}

const mapStoreToProps = (store, props) => {
    return props;
}

export default withRouter(
  connect(
  mapStoreToProps
)(SignatureRouter)
);