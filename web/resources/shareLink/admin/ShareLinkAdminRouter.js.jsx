/**
 * Sets up the routing for all Share Link views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/share-links.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import shareLink views
import AdminCreateShareLink from './views/AdminCreateShareLink.js.jsx';
import AdminShareLinkList from './views/AdminShareLinkList.js.jsx';
import AdminSingleShareLink from './views/AdminSingleShareLink.js.jsx';
import AdminUpdateShareLink from './views/AdminUpdateShareLink.js.jsx';

class ShareLinkAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleShareLinkPath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All share-links', path: null }]}
          component={AdminShareLinkList}
          exact
          path="/admin/share-links"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All share-links', path: '/admin/share-links'}, {display: 'New ', path: null}]}
          component={AdminCreateShareLink}
          exact
          path="/admin/share-links/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All share-links', path: '/admin/share-links'}, {display: 'Share Link details', path: null}]}
          component={AdminSingleShareLink}
          exact
          path="/admin/share-links/:shareLinkId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All share-links', path: '/admin/share-links'}, {display: 'Share Link Details', path: singleShareLinkPath}, {display: 'Update', path: null}]}
          component={AdminUpdateShareLink}
          exact
          path="/admin/share-links/:shareLinkId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ShareLinkAdminRouter;
