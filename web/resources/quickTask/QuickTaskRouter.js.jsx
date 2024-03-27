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
import CreateQuickTask from './views/CreateQuickTask.js.jsx';
import QuickTaskList from './views/QuickTaskList.js.jsx';
import SingleQuickTask from './views/SingleQuickTask.js.jsx';
import UpdateQuickTask from './views/UpdateQuickTask.js.jsx';

class QuickTaskRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/quick-tasks" component={QuickTaskList} />
        <YTRoute exact login={true} path="/quick-tasks/new" component={CreateQuickTask} />
        <YTRoute exact path="/quick-tasks/:quickTaskId" component={SingleQuickTask}/>
        <YTRoute exact login={true} path="/quick-tasks/:quickTaskId/update" component={UpdateQuickTask}/>
      </Switch>
    )
  }
}

export default QuickTaskRouter;
