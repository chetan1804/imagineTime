/**
 * Sets up the routing for all ClientTask Response views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/client-task-responses.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientTaskResponse views
import AdminCreateClientTaskResponse from './views/AdminCreateClientTaskResponse.js.jsx';
import AdminClientTaskResponseList from './views/AdminClientTaskResponseList.js.jsx';
import AdminSingleClientTaskResponse from './views/AdminSingleClientTaskResponse.js.jsx';
import AdminUpdateClientTaskResponse from './views/AdminUpdateClientTaskResponse.js.jsx';

class ClientTaskResponseAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleClientTaskResponsePath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-task-responses', path: null }]}
          component={AdminClientTaskResponseList}
          exact
          path="/admin/client-task-responses"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-task-responses', path: '/admin/client-task-responses'}, {display: 'New ', path: null}]}
          component={AdminCreateClientTaskResponse}
          exact
          path="/admin/client-task-responses/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-task-responses', path: '/admin/client-task-responses'}, {display: 'ClientTask Response details', path: null}]}
          component={AdminSingleClientTaskResponse}
          exact
          path="/admin/client-task-responses/:clientTaskResponseId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All client-task-responses', path: '/admin/client-task-responses'}, {display: 'ClientTask Response Details', path: singleClientTaskResponsePath}, {display: 'Update', path: null}]}
          component={AdminUpdateClientTaskResponse}
          exact
          path="/admin/client-task-responses/:clientTaskResponseId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ClientTaskResponseAdminRouter;
