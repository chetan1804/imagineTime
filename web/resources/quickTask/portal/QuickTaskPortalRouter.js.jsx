/**
 * Set up routing for all portal quickTask views
 *
 */

// import primary libraries
import React from 'react';
import { Switch } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientWorkflow views
import PortalQuickTasks from './views/PortalQuickTasks.js.jsx';
import PortalSingleQuickTask from './views/PortalSingleQuickTask.js.jsx';

class QuickTaskPortalRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact clientUser={true} path="/portal/:clientId/quick-tasks" component={PortalQuickTasks} />
        <YTRoute exact clientUser={true} path="/portal/:clientId/quick-tasks/:quickTaskId" component={PortalSingleQuickTask} />
      </Switch>
    )
  }
}

export default QuickTaskPortalRouter;
