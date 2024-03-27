/**
 * Sets up the routing for all Subscription views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/subscriptions.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import subscription views
import AdminCreateSubscription from './views/AdminCreateSubscription.js.jsx';
import AdminSubscriptionList from './views/AdminSubscriptionList.js.jsx';
import AdminSingleSubscription from './views/AdminSingleSubscription.js.jsx';
import AdminUpdateSubscription from './views/AdminUpdateSubscription.js.jsx';

class SubscriptionAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleSubscriptionPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All subscriptions', path: null }]}
          component={AdminSubscriptionList}
          exact
          path="/admin/subscriptions"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All subscriptions', path: '/admin/subscriptions'}, {display: 'New ', path: null}]}
          component={AdminCreateSubscription}
          exact
          path="/admin/subscriptions/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All subscriptions', path: '/admin/subscriptions'}, {display: 'Subscription details', path: null}]}
          component={AdminSingleSubscription}
          exact
          path="/admin/subscriptions/:subscriptionId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All subscriptions', path: '/admin/subscriptions'}, {display: 'Subscription Details', path: singleSubscriptionPath}, {display: 'Update', path: null}]}
          component={AdminUpdateSubscription}
          exact
          path="/admin/subscriptions/:subscriptionId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default SubscriptionAdminRouter;
