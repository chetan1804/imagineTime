/**
 * Sets up the routing for all Firm Client Workspace views.
 *
 * NOTE: As an example, we've included two other Route Components that protect a given
 * path: LoginRoute and RoleRoute
 *
 * LoginRoute simply checks if the user is logged in and if NOT, it redirects
 * them to the login page.
 *
 * RoleRoute protects the path to make sure the user is A) logged in and B) has
 * role matching the path=/Firm/clients.
 */

// import primary libraries
import React from 'react';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import client views
import WorkspaceList from './views/WorkspaceList.js.jsx';
import PracticeCreateClientWorkflow from '../../clientWorkflow/practice/views/PracticeCreateClientWorkflow.js.jsx';
import PracticeUpdateClientWorkflow from '../../clientWorkflow/practice/views/PracticeUpdateClientWorkflow.js.jsx';

import PracticeSingleFile from '../../file/practice/views/PracticeSingleFile.js.jsx';
import WorkspaceActivity from '../../activity/practice/views/WorkspaceActivity.js.jsx';
import WorkspaceClientDetails from './views/WorkspaceClientDetails.js.jsx';
import WorkspaceFiles from '../../file/practice/views/WorkspaceFiles.js.jsx';

import WorkspaceClientWorkflows from '../../clientWorkflow/practice/views/WorkspaceClientWorkflows.js.jsx';
// import PracticeQuickBuildClientTasks from '../../clientWorkflow/practice/views/PracticeQuickBuildClientTasks.js.jsx';
// import PracticeQuickEditClientWorkflow from '../../clientWorkflow/practice/views/PracticeQuickEditClientWorkflow.js.jsx';
import PracticeWorkspaceNotesAboutClient from '../../note/practice/views/PracticeWorkspaceNotesAboutClient.js.jsx';
import ClientPostPracticeList from '../../clientPost/practice/views/ClientPostPracticeList.js.jsx'; 
import SingleClientPost from '../../clientPost/views/SingleClientPost.js.jsx'; 
import PracticeClientWorkflowTemplates from '../../clientWorkflowTemplate/practice/views/PracticeClientWorkflowTemplates.js.jsx';
import WorkspaceUsers from './views/WorkspaceUsers.js.jsx';
import ArchivedFiles from '../../file/practice/views/ArchivedFiles.js.jsx';

import ArchivedQuickTaskList from '../../quickTask/practice/views/ArchivedQuickTaskList.js.jsx'; 
import PracticeQuickTaskList from '../../quickTask/practice/views/PracticeQuickTaskList.js.jsx';
import PracticeSingleQuickTask from '../../quickTask/practice/views/PracticeSingleQuickTask.js.jsx'; 
import PracticeCreateQuickTask from '../../quickTask/practice/views/PracticeCreateQuickTask.js.jsx'; 
import PracticeQuickTaskQuickView from '../../quickTask/practice/views/PracticeQuickTaskQuickView.js.jsx'; 
import NotificationStaffClientForm from '../../notification/components/NotificationStaffClientForm.js.jsx';
import NotificationWorkspaceLayout from '../../notification/components/NotificationWorkspaceLayout.js.jsx';
import FolderList from '../../folder/views/Workspace.js.jsx';

import WorkspaceRequestFolders from '../../requestFolder/views/WorkspaceRequestFolders.js.jsx';
import WorkspaceRequests from '../../request/views/WorkspaceRequests.js.jsx';
// import WorkspaceRequestTasks from '../../requestTask/views/WorkspaceRequestsTask2.js.jsx';
import WorkspaceRequestTasks from '../../requestTask/views/WorkspaceRequestTasks.js.jsx';

// import RecycleBinFiles from '../../file/practice/views/RecycleBinFiles.js.jsx';

import Payments from '../../payments/views/PaymentList.js.jsx';
import Invoices from '../../clientInvoice/views/InvoiceList.js.jsx';

// actions
import * as fileActions from '../../file/fileActions';
import * as requestActions from '../../request/requestActions';
import * as requestFolderActions from '../../requestFolder/requestFolderActions';

class ClientWorkspaceRouter extends Binder {
  constructor(props) {
    super(props);
  }
  
  render() {
    const firmId = this.props.location.pathname.split('/')[2];
    const clientId = this.props.location.pathname.split('/')[4] ?  this.props.location.pathname.split('/')[4] : null;
    const { fileStore, breadcrumbs } = this.props;

    return (
      <Switch>
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: null }]}
          component={WorkspaceList}
          path="/firm/:firmId/workspaces"
          exact
          staff={true}
        />
        <YTRoute
          component={WorkspaceList}
          path="/firm/:firmId/workspaces?page=:currentPage&per=:perPage"
          exact
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Activity', path: null}]}
          component={WorkspaceActivity}
          exact
          path="/firm/:firmId/workspaces/:clientId/activity"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Single Client', path: `/firm/${firmId}/workspaces/${clientId}`}, {display: 'Update Client Workflow', path: null}]}
          component={PracticeUpdateClientWorkflow}
          exact
          path="/firm/:firmId/workspaces/:clientId/client-workflows/:clientWorkflowId/update"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Archived Quick Tasks', path: null}]}
          component={ArchivedQuickTaskList}
          path="/firm/:firmId/workspaces/:clientId/quick-tasks/archived"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Quick Tasks', path: null}]}
          component={PracticeQuickTaskList}
          path="/firm/:firmId/workspaces/:clientId/quick-tasks"
          staff={true}
        />
        <YTRoute
          component={PracticeClientWorkflowTemplates}
          path="/firm/:firmId/workspaces/:clientId/client-workflow-templates"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Notes', path: null}]}
          component={PracticeWorkspaceNotesAboutClient}
          exact
          path="/firm/:firmId/workspaces/:clientId/notes"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Messages', path: null}]}
          component={ClientPostPracticeList}
          exact
          path="/firm/:firmId/workspaces/:clientId/messages"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Messages', path: null}]}
          component={SingleClientPost}
          exact
          path="/firm/:firmId/workspaces/:clientId/messages/:clientPostId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Invoices', path: null}]}
          component={Invoices}
          exact
          path="/firm/:firmId/workspaces/:clientId/invoices"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Payments', path: null}]}
          component={Payments}
          exact
          path="/firm/:firmId/workspaces/:clientId/payments"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Details', path: null}]}
          component={WorkspaceClientDetails}
          exact
          path="/firm/:firmId/workspaces/:clientId/details"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Users', path: null}]}
          component={WorkspaceUsers}
          path="/firm/:firmId/workspaces/:clientId/users"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Notifications', path: null}]}
          component={NotificationWorkspaceLayout}
          path="/firm/:firmId/workspaces/:clientId/notifications"
          staff={true}
        />


        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  WORKSPACE REQUEST CONNECTED ROUTE START  ****************************************************/}
        {/*  *********************************************************************************************************************************************/}
        {/* <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceRequestTasks}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-list/:requestId/unpublished"
          staff={true}
        /> */}
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceRequestTasks}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-list/:requestId/:requestTaskStatus/task-activity/:requestTaskId/:viewingAs"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceRequestTasks}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-list/:requestId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceRequestTasks}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-list/:requestId/:requestTaskStatus"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceRequests}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-list"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceRequestFolders}
          exact
          path="/firm/:firmId/workspaces/:clientId/request-folder"
          staff={true}
        />


        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  WORKSPACE FILE CONNECTED ROUTE START  ****************************************************/}
        {/*  *********************************************************************************************************************************************/}
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/:folderId/folder/file-activity/:fileActivityId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/archived/:folderId/folder/:fileId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/archived/:folderId/folder"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/:folderId/folder/archived/:fileId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/:folderId/folder/archived"
          staff={true}
        />
         <YTRoute
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/:folderId/folder/:fileId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/:folderId/folder"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/file-activity/:fileActivityId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/archived"
          staff={true}
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/workspaces/:clientId/files/archived/:fileId"
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          path="/firm/:firmId/workspaces/:clientId/files/:fileId"
          staff={true}
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          path="/firm/:firmId/workspaces/:clientId/files"
          staff={true}
        />
        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  WORKSPACE FILE CONNECTED ROUTE START  ****************************************************/}
        {/*  *********************************************************************************************************************************************/}
      </Switch>
    )
  }
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  

  // url path
  const { match } = props;
  const path = props.location.pathname.split("/");
  
  // request folder
  const requestFolder = store.requestFolder && store.requestFolder.byId ? store.requestFolder.byId : null;
  const _requestFolder = path[5] === "request-folder";

  // request list
  const request = store.request && store.request.byId ? store.request.byId : null;
  const _request = path[5] === "request-list";

  const firmId = match.params.firmId;
  const _workspace = path[3] === "workspaces" && (path[5] === "files" || path[5] === "request-list");
  const clientId = _workspace ? path[4] : match.params.clientId;

  let breadcrumbs = [{display: 'Workspaces', path: `/firm/${firmId}/workspaces`}, {display: 'Files', path: `/firm/${firmId}/workspaces/${clientId}/files`}];

  if (_requestFolder && requestFolder) {
    const requestFolderId = match.params.requestFolderId ? match.params.requestFolderId : path[6];

    // view with selected client
    if (clientId) {
      breadcrumbs = [
        {display: 'Workspaces', path: `/firm/${firmId}/workspaces`}
        // , {display: 'Shared Folders', path: `/firm/${firmId}/workspaces/${clientId}/request-folder`}
      ];
    }

    if (requestFolder[requestFolderId]) {
      breadcrumbs.splice(2, 0, {
        display: requestFolder[requestFolderId].name
        , path: `/firm/${firmId}/workspaces/${clientId}/request-folder/${requestFolderId}/request-list`
      });
    }
  }

  if (_request && request) {
    const requestId = match.params.requestId ? match.params.requestId : path[6];

    if (clientId) {
      breadcrumbs = [
        {display: 'Workspaces', path: `/firm/${firmId}/workspaces`}
        , {display: 'Request Lists', path: `/firm/${firmId}/workspaces/${clientId}/request-list`}
      ];
    }

    if (request[requestId]) {
      breadcrumbs.splice(3, 0, {
        display: request[requestId].name
        , path: `/firm/${firmId}/workspaces/${clientId}/request-list/${requestId}/unpublished`
      });
    }
  }

  return {
    fileStore: store.file
    , breadcrumbs
  }
}

export default withRouter(
  connect(
  mapStoreToProps
)(ClientWorkspaceRouter)
);
