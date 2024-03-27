/**
 * Sets up the routing for all Admin views.
 *
 * NOTE: All imported [Module]PracticeRouter files must be wrapped in a Route wrapper
 * inside the switch in order to resolve correctly.  See <UserAdminRouter/>
 * below as an example.
 */

// import primary libraries
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';

// import global components
import Binder from '../components/Binder.js.jsx';
import YTRoute from '../components/routing/YTRoute.js.jsx';

// import admin views
import StaffDashboard from './views/StaffDashboard.js.jsx';

// import admin components
import PracticeLayout from './components/PracticeLayout.js.jsx';

class PracticeRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute login={true} exact path="/firm" render={() => <Redirect to="/user/forward"/> } />
        <YTRoute staff={true} exact path="/firm/:firmId" render={props => <Redirect to={`/firm/${props.match.params.firmId}/workspaces`}/> } />
        <YTRoute staff={true} exact path="/firm/:firmId/dashboard" component={StaffDashboard} />
      </Switch>
    )
  }
}

export default PracticeRouter;
