/**
 * Set up routing for all practice quickTask views
 *
 */

// import primary libraries
import React from 'react';
import { Switch } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientWorkflow views
import PracticeQuickTaskList from './views/PracticeQuickTaskList.js.jsx';
import PracticeSingleQuickTask from './views/PracticeSingleQuickTask.js.jsx';

class QuickTaskPracticeRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/firm/:firmId/workspaces/:clientId/quick-tasks" component={PracticeQuickTaskList} />
        <YTRoute exact path="/firm/:firmId/workspaces/:clientId/:quickTaskId" component={PracticeSingleQuickTask} />
      </Switch>
    )
  }
}

export default QuickTaskPracticeRouter;