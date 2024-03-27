/**
 * Set up routing for all ClientPost views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import clientPost views
import CreateClientPost from './views/CreateClientPost.js.jsx';
import ClientPostList from './views/ClientPostList.js.jsx';
import SingleClientPost from './views/SingleClientPost.js.jsx';
import UpdateClientPost from './views/UpdateClientPost.js.jsx';

class ClientPostRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/client-posts" component={ClientPostList} />
        <YTRoute exact login={true} path="/client-posts/new" component={CreateClientPost} />
        <YTRoute exact path="/client-posts/:clientPostId" component={SingleClientPost}/>
        <YTRoute exact login={true} path="/client-posts/:clientPostId/update" component={UpdateClientPost}/>
      </Switch>
    )
  }
}

export default ClientPostRouter;
