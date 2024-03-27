/**
 * Sets up the routing for all Practice Client Workspace views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path.
 */

// import primary libraries
import React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import client views
import PracticeClientSettingsList from './views/PracticeClientSettingsList.js.jsx'; 
import PracticeClientSettingsListAchive from './views/PracticeClientSettingsListAchive.js.jsx';
import PracticeCreateClient from './views/PracticeCreateClient.js.jsx';
import PracticeClientBulkImport from './views/PracticeClientBulkImport.js.jsx';

import PracticeClientBilling from './views/PracticeClientBilling.js.jsx';
import PracticeClientIntegrations from './views/PracticeClientIntegrations.js.jsx';
import PracticeInviteClientUser from '../../clientUser/practice/views/PracticeInviteClientUser.js.jsx';
import PracticeClientOverview from './views/PracticeClientOverview.js.jsx';

import ClientSettingsContacts from '../../user/practice/views/ClientSettingsContacts.js.jsx';
import ClientSettingsAssignedStaff from '../../staff/practice/views/ClientSettingsAssignedStaff.jsx';
import NotificationStaffClientForm from '../../notification/components/NotificationStaffClientForm.js.jsx';
import NotificationClientLayout from '../../notification/components/NotificationClientLayout.js.jsx';
import WorkspaceList from './views/WorkspaceList.js.jsx';
class ClientSettingsRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    const clientId = this.props.location.pathname.split('/')[4] ?  this.props.location.pathname.split('/')[4] : null;

    return (
      <Switch>
    
        {/**
          Client Settings  
         */}
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: null }]}
          component={PracticeClientSettingsList}
          path="/firm/:firmId/clients"
          exact
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: null }]}
          component={PracticeClientSettingsList}
          path="/firm/:firmId/clients?page=:currentPage&per=:perPage"
          exact
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: null }]}
          component={PracticeClientSettingsListAchive}
          path="/firm/:firmId/clients/archived"
          exact
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'New ', path: null}]}
          component={PracticeCreateClient}
          exact
          path="/firm/:firmId/clients/new"
          staffOwner={true}
        />
         <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Import ', path: null}]}
          component={PracticeClientBulkImport}
          exact
          path="/firm/:firmId/clients/import"
          staffOwner={true}
        />
        <YTRoute 
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Overview ', path: null}]}
          component={PracticeClientOverview}
          exact
          path="/firm/:firmId/clients/:clientId"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Settings', path: `/firm/${firmId}/clients/${clientId}`}, {display: 'Invite contacts', path: null}]}
          component={PracticeInviteClientUser}
          exact
          path="/firm/:firmId/clients/:clientId/contacts/invite"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Settings', path: `/firm/${firmId}/clients/${clientId}`}, {display: 'Billing', path: null}]}
          component={PracticeClientBilling}
          exact
          path="/firm/:firmId/clients/:clientId/billing"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Settings', path: `/firm/${firmId}/clients/${clientId}`}, {display: 'Integrations', path: null}]}
          component={PracticeClientIntegrations}
          exact
          path="/firm/:firmId/clients/:clientId/integrations"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Contacts', path: null}]}
          component={ClientSettingsContacts}
          exact
          path="/firm/:firmId/clients/:clientId/contacts/:contactsStatus"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Contacts', path: null}]}
          component={ClientSettingsContacts}
          path="/firm/:firmId/clients/:clientId/contacts"
          staffOwner={true}
        />
        <YTRoute  
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Notifications', path: null}]}
          component={NotificationClientLayout}
          path="/firm/:firmId/clients/:clientId/notifications"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Assigned staff', path: null}]}
          component={ClientSettingsAssignedStaff}
          path="/firm/:firmId/clients/:clientId/staff"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'All clients', path: `/firm/${firmId}/clients`}, {display: 'Assigned staff', path: null}]}
          component={ClientSettingsAssignedStaff}
          path="/firm/:firmId/clients/:clientId/staff?page=:currentPage&per=:perPage"
          staffOwner={true}
        />
      </Switch>
    )
  }
}

export default ClientSettingsRouter;
