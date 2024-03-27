/**
 * Sets up the routing for all Admin views.
 *
 * NOTE: All imported [Module]AdminRouter files must be wrapped in a Route wrapper
 * inside the switch in order to resolve correctly.  See <UserAdminRouter/>
 * below as an example.
 */

// import primary libraries
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import admin views
import AdminDashboard from './views/AdminDashboard.js.jsx';
import StyleGuide from './views/StyleGuide.js.jsx';

// import admin components
import AdminLayout from './components/AdminLayout.js.jsx';

class AdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute 
          breadcrumbs={[{display: 'Dashboard', path: null}]}
          component={AdminDashboard} 
          exact 
          path="/admin" 
          role="admin"  
        />
        <YTRoute 
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'Style guide', path: null }]}
          component={StyleGuide} 
          exact 
          path="/admin/style-guide" 
          role="admin"  
        />
      </Switch>
    )
  }
}

export default AdminRouter;
