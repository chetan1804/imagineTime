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
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import views
import WorkspaceClientWorkflows from './views/WorkspaceClientWorkflows.js.jsx';

class ClientWorkflowFirmRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    const clientId = this.props.location.pathname.split('/')[4] ?  this.props.location.pathname.split('/')[4] : null;
    console.log('render this ');
    return (
      <Switch>
   
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Workspace', path: `/firm/${firmId}/clients/${clientId}`}, {display: 'ClientWorkflows', path: null}]}
          component={WorkspaceClientWorkflows}
          // render={()=> <h3>ClientWorkflows</h3>}
          exact
          path="/firm/:firmId/workspaces/:clientId/client-workflows"
          login={true}
        />
     
      </Switch>
    )
  }
}

export default ClientWorkflowFirmRouter;
