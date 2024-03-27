/**
 * Sets up the routing for all ClientWorkflow views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/client-workflows.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientWorkflow views
import AdminCreateClientWorkflow from './views/AdminCreateClientWorkflow.js.jsx';
import AdminClientWorkflowList from './views/AdminClientWorkflowList.js.jsx';
import AdminSingleClientWorkflow from './views/AdminSingleClientWorkflow.js.jsx';
import AdminUpdateClientWorkflow from './views/AdminUpdateClientWorkflow.js.jsx';

class ClientWorkflowAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleClientWorkflowPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflows', path: null }]}
          component={AdminClientWorkflowList}
          exact
          path="/admin/client-workflows"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflows', path: '/admin/client-workflows'}, {display: 'New ', path: null}]}
          component={AdminCreateClientWorkflow}
          exact
          path="/admin/client-workflows/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflows', path: '/admin/client-workflows'}, {display: 'ClientWorkflow details', path: null}]}
          component={AdminSingleClientWorkflow}
          exact
          path="/admin/client-workflows/:clientWorkflowId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflows', path: '/admin/client-workflows'}, {display: 'ClientWorkflow Details', path: singleClientWorkflowPath}, {display: 'Update', path: null}]}
          component={AdminUpdateClientWorkflow}
          exact
          path="/admin/client-workflows/:clientWorkflowId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ClientWorkflowAdminRouter;
