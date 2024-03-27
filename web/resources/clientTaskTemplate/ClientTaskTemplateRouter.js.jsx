/**
 * Set up routing for all ClientTaskTemplate views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import clientTaskTemplate views
import CreateClientTaskTemplate from './views/CreateClientTaskTemplate.js.jsx';
import ClientTaskTemplateList from './views/ClientTaskTemplateList.js.jsx';
import SingleClientTaskTemplate from './views/SingleClientTaskTemplate.js.jsx';
import UpdateClientTaskTemplate from './views/UpdateClientTaskTemplate.js.jsx';

class ClientTaskTemplateRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/client-task-templates" component={ClientTaskTemplateList} />
        <YTRoute exact login={true} path="/client-task-templates/new" component={CreateClientTaskTemplate} />
        <YTRoute exact path="/client-task-templates/:clientTaskTemplateId" component={SingleClientTaskTemplate}/>
        <YTRoute exact login={true} path="/client-task-templates/:clientTaskTemplateId/update" component={UpdateClientTaskTemplate}/>
      </Switch>
    )
  }
}

export default ClientTaskTemplateRouter;
