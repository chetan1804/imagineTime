/**
 * Sets up the routing for all Note views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/notes.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import note views
import AdminCreateNote from './views/AdminCreateNote.js.jsx';
import AdminNoteList from './views/AdminNoteList.js.jsx';
import AdminSingleNote from './views/AdminSingleNote.js.jsx';
import AdminUpdateNote from './views/AdminUpdateNote.js.jsx';

class NoteAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleNotePath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notes', path: null }]}
          component={AdminNoteList}
          exact
          path="/admin/notes"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notes', path: '/admin/notes'}, {display: 'New ', path: null}]}
          component={AdminCreateNote}
          exact
          path="/admin/notes/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notes', path: '/admin/notes'}, {display: 'Note details', path: null}]}
          component={AdminSingleNote}
          exact
          path="/admin/notes/:noteId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All notes', path: '/admin/notes'}, {display: 'Note Details', path: singleNotePath}, {display: 'Update', path: null}]}
          component={AdminUpdateNote}
          exact
          path="/admin/notes/:noteId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default NoteAdminRouter;
