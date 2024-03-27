/**
 * Set up routing for all ClientPost views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientPost views
import ClientPostPortalList from './views/ClientPostPortalList.js.jsx'; 
import SingleClientPost from '../views/SingleClientPost.js.jsx'; 

class ClientPostPortalRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact clientUser={true} path="/portal/:clientId/client-posts" component={ClientPostPortalList} />
        <YTRoute exact clientUser={true} path="/portal/:clientId/client-posts/:clientPostId" component={SingleClientPost}/>       
      </Switch>
    )
  }
}

export default ClientPostPortalRouter;
