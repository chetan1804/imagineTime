/**
 * Set up routing for all ClientWorkflow views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientWorkflow views
import ClientWorkflows from './views/ClientWorkflows.js.jsx';
import SingleClientWorkflow from './views/SingleClientWorkflow.js.jsx';

class ClientWorkflowPortalRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/portal/:clientId/client-workflows" component={ClientWorkflows} />
        <YTRoute exact path="/portal/:clientId/client-workflows/:clientWorkflowId" component={SingleClientWorkflow}/>
      </Switch>
    )
  }
}

export default ClientWorkflowPortalRouter;
