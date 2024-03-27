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

class TaskActivityRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
      </Switch>
    )
  }
}

export default TaskActivityRouter;
