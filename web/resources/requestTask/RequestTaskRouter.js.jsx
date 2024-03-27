/**
 * Set up routing for all QuickTask views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import quickTask views
import WorkspaceRequests from '../request/views/WorkspaceRequests.js.jsx';

class RequestTaskRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Request List', path: null}]}
          component={WorkspaceRequests}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-list/:requestId"
          staff={true}
        />
      </Switch>
    )
  }
}

export default RequestTaskRouter;
