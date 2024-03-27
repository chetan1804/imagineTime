/**
 * Sets up the routing for all File views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/files.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import file views
import AdminCreateFile from './views/AdminCreateFile.js.jsx';
import AdminFileList from './views/AdminFileList.js.jsx';
import AdminSingleFile from './views/AdminSingleFile.js.jsx';
import AdminUpdateFile from './views/AdminUpdateFile.js.jsx';

class FileAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleFilePath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All files', path: null }]}
          component={AdminFileList}
          exact
          path="/admin/files"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All files', path: '/admin/files'}, {display: 'New ', path: null}]}
          component={AdminCreateFile}
          exact
          path="/admin/files/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All files', path: '/admin/files'}, {display: 'File details', path: null}]}
          component={AdminSingleFile}
          exact
          path="/admin/files/:fileId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All files', path: '/admin/files'}, {display: 'File Details', path: singleFilePath}, {display: 'Update', path: null}]}
          component={AdminUpdateFile}
          exact
          path="/admin/files/:fileId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default FileAdminRouter;
