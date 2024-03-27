/**
 * Set up routing for all ClientPostReply views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import clientPostReply views
import CreateClientPostReply from './views/CreateClientPostReply.js.jsx';
import ClientPostReplyList from './views/ClientPostReplyList.js.jsx';
import SingleClientPostReply from './views/SingleClientPostReply.js.jsx';
import UpdateClientPostReply from './views/UpdateClientPostReply.js.jsx';

class ClientPostReplyRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/client-post-replies" component={ClientPostReplyList} />
        <YTRoute exact login={true} path="/client-post-replies/new" component={CreateClientPostReply} />
        <YTRoute exact path="/client-post-replies/:clientPostReplyId" component={SingleClientPostReply}/>
        <YTRoute exact login={true} path="/client-post-replies/:clientPostReplyId/update" component={UpdateClientPostReply}/>
      </Switch>
    )
  }
}

export default ClientPostReplyRouter;
