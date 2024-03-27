/**
 * Set up routing for all Notification views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import notification views
import CreateNotification from './views/CreateNotification.js.jsx';
import NotificationList from './views/NotificationList.js.jsx';
import SingleNotification from './views/SingleNotification.js.jsx';
import UpdateNotification from './views/UpdateNotification.js.jsx';

class NotificationRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/notifications" component={NotificationList} />
        <YTRoute exact login={true} path="/notifications/new" component={CreateNotification} />
        <YTRoute exact path="/notifications/:notificationId" component={SingleNotification}/>
        <YTRoute exact login={true} path="/notifications/:notificationId/update" component={UpdateNotification}/>
      </Switch>
    )
  }
}

export default NotificationRouter;
