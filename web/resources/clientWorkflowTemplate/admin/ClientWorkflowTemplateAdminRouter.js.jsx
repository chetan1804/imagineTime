/**
 * Sets up the routing for all ClientWorkflow Template views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/admin/client-workflow-templates.
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import clientWorkflowTemplate views
import AdminCreateClientWorkflowTemplate from './views/AdminCreateClientWorkflowTemplate.js.jsx';
import AdminClientWorkflowTemplateList from './views/AdminClientWorkflowTemplateList.js.jsx';
import AdminSingleClientWorkflowTemplate from './views/AdminSingleClientWorkflowTemplate.js.jsx';
import AdminUpdateClientWorkflowTemplate from './views/AdminUpdateClientWorkflowTemplate.js.jsx';

class ClientWorkflowTemplateAdminRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    let singleClientWorkflowTemplatePath = this.props.location.pathname.replace('/update', '');
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflow-templates', path: null }]}
          component={AdminClientWorkflowTemplateList}
          exact
          path="/admin/client-workflow-templates"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflow-templates', path: '/admin/client-workflow-templates'}, {display: 'New ', path: null}]}
          component={AdminCreateClientWorkflowTemplate}
          exact
          path="/admin/client-workflow-templates/new"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflow-templates', path: '/admin/client-workflow-templates'}, {display: 'ClientWorkflow Template details', path: null}]}
          component={AdminSingleClientWorkflowTemplate}
          exact
          path="/admin/client-workflow-templates/:clientWorkflowTemplateId"
          role="admin"
        />
        <YTRoute
          breadcrumbs={[{display: 'Dashboard', path: '/admin'}, {display: 'All clientWorkflow-templates', path: '/admin/client-workflow-templates'}, {display: 'ClientWorkflow Template Details', path: singleClientWorkflowTemplatePath}, {display: 'Update', path: null}]}
          component={AdminUpdateClientWorkflowTemplate}
          exact
          path="/admin/client-workflow-templates/:clientWorkflowTemplateId/update"
          role="admin"
        />
      </Switch>
    )
  }
}

export default ClientWorkflowTemplateAdminRouter;
