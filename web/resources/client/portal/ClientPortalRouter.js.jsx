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
import AccountInfo from './views/AccountInfo.js.jsx';
import UpdateAccountSettings from './views/UpdateAccountSettings.js.jsx';

class ClientPortalRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute clientUser={true} path="/portal/:clientId/account" component={AccountInfo} />
        <YTRoute clientUser={true} exact path="/portal/:clientId/account/update" component={UpdateAccountSettings}/>
      </Switch>
    )
  }
}

export default ClientPortalRouter;
