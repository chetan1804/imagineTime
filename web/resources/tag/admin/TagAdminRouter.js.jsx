/**
 * Sets up the routing for all Tag views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/tags.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import tag views
import AdminCreateTag from './views/AdminCreateTag.js.jsx';
import AdminTagList from './views/AdminTagList.js.jsx';
import AdminSingleTag from './views/AdminSingleTag.js.jsx';
import AdminUpdateTag from './views/AdminUpdateTag.js.jsx';

class TagAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleTagPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tags', path: null }]}
          component={AdminTagList}
          exact
          path="/admin/tags"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tags', path: '/admin/tags'}, {display: 'New ', path: null}]}
          component={AdminCreateTag}
          exact
          path="/admin/tags/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tags', path: '/admin/tags'}, {display: 'Tag details', path: null}]}
          component={AdminSingleTag}
          exact
          path="/admin/tags/:tagId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All tags', path: '/admin/tags'}, {display: 'Tag Details', path: singleTagPath}, {display: 'Update', path: null}]}
          component={AdminUpdateTag}
          exact
          path="/admin/tags/:tagId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default TagAdminRouter;
