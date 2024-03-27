/**
 * Sets up the routing for all Admin views.
 *
 * NOTE: All imported [Module]PortalRouter files must be wrapped in a Route wrapper
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
import PortalDashboard from './views/PortalDashboard.js.jsx';
import InvoicePortal from '../../resources/clientInvoice/portal/views/InvoicePortalList.js.jsx'
import PaymentPortal from '../../resources/payments/portal/views/PaymentPortalList.js.jsx'

// import admin components
import PortalLayout from './components/PortalLayout.js.jsx';

class PortalRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute login={true} exact path="/portal" render={() => <Redirect to="/user/forward"/> } />
        <YTRoute clientUser={true} exact path="/portal/:clientId" render={props => <Redirect to={`/portal/${props.match.params.clientId}/files`}/> } />
        <YTRoute clientUser={true} path="/portal/:clientId/invoices" component={InvoicePortal} />
        <YTRoute clientUser={true} path="/portal/:clientId/payments" component={PaymentPortal} />
        <YTRoute clientUser={true} path="/portal/:clientId/dashboard" component={PortalDashboard} />
      </Switch>
    )
  }
}

export default PortalRouter;
