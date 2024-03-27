/**
 * Set up routing for all Firm views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from "react";
import { Route, Switch } from "react-router-dom";

// import global components
import Binder from "../../../global/components/Binder.js.jsx";
import YTRoute from "../../../global/components/routing/YTRoute.js.jsx";

// import firm views
import PracticeFirmBilling from "./views/PracticeFirmBilling.js.jsx";
import PracticeFirmOverview from "./views/PracticeFirmOverview.js.jsx";
import PracticeStaff from "../../staff/practice/views/PracticeStaff.js.jsx";
import PracticeTags from "../../tag/practice/views/PracticeTags.js.jsx";
import PracticeUpdateTag from "../../tag/practice/views/PracticeUpdateTag.js.jsx";
import PracticeUpdateStaff from "../../staff/practice/views/PracticeUpdateStaff.js.jsx";
import PracticeInviteStaff from "../../staff/practice/views/PracticeInviteStaff.js.jsx";
import PracticeClientWorkflowTemplates from "../../clientWorkflowTemplate/practice/views/PracticeClientWorkflowTemplates.js.jsx";
import PracticeAdvanceSettings from "./views/PracticeAdvanceSettings.js.jsx";
import DocumentTemplates from "../../documentTemplate/view/DocumentTemplates.js.jsx";
import PracticeStaffBulkImport from "../../staff/practice/components/PracticeStaffBulkImport.js.jsx";
import PracticeFolderTemplates from "../../folderTemplate/practice/views/PracticeFolderTemplates.js.jsx";
import PracticeMangobillingSettings from "./views/PracticeMangobillingSettings.js.jsx";
import PracticeGroupPermissionSettings from "./views/PracticeGroupPermissionSettings.js.jsx";
import InvoiceService from "../../services/views/ServiceList.js.jsx";
import Enrollment from "../../payments/enrollment/views/Enrollment.js.jsx";
import ElectronicPayment from "../../payments/electronicPayments/views/ElectronicPayment.js.jsx";
import DocumentMergeFields from "../../mergeField/view/DocumentMergeFields.js.jsx";
import SingleTemplate from "../../documentTemplate/components/SingleTemplate.js.jsx";
import WorkspaceRequests from "../../request/views/WorkspaceRequests.js.jsx";
import WorkspaceRequestTasks from '../../requestTask/views/WorkspaceRequestTasks.js.jsx';

class FirmPracticeRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    const firmId = this.props.location.pathname.split("/")[2];
    return (
      <Switch>
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Overview", path: null },
          ]}
          component={PracticeFirmOverview}
          exact
          path="/firm/:firmId/settings"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Members", path: null },
          ]}
          component={PracticeInviteStaff}
          exact
          path="/firm/:firmId/settings/staff/invite"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Members", path: `/firm/${firmId}/settings/staff` },
            { display: "Update Staff", path: null },
          ]}
          component={PracticeUpdateStaff}
          exact
          path="/firm/:firmId/settings/staff/:staffId/update"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Members ", path: null },
          ]}
          component={PracticeStaffBulkImport}
          exact
          path="/firm/:firmId/settings/staff/import"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Members", path: null },
          ]}
          component={PracticeStaff}
          path="/firm/:firmId/settings/staff"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Tags", path: `/firm/${firmId}/settings/tags` },
            { display: "Update Tag", path: null },
          ]}
          component={PracticeUpdateTag}
          path="/firm/:firmId/settings/tags/:tagId/update"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Tags", path: null },
          ]}
          component={PracticeTags}
          path="/firm/:firmId/settings/tags"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "ClientWorkflow Templates", path: null },
          ]}
          component={PracticeClientWorkflowTemplates}
          exact
          path="/firm/:firmId/settings/client-workflow-templates"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Account", path: null },
          ]}
          component={PracticeFirmBilling}
          exact
          path="/firm/:firmId/settings/account"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Advanced Settings", path: null },
          ]}
          component={PracticeAdvanceSettings}
          path="/firm/:firmId/settings/advanced"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Document Merge Fields", path: null },
          ]}
          component={DocumentMergeFields}
          path="/firm/:firmId/settings/documents/merge-fields"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Templat Preview", path: null },
          ]}
          component={SingleTemplate}
          path="/firm/:firmId/settings/documents/:templateId"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Document Templates", path: null },
          ]}
          component={DocumentTemplates}
          path="/firm/:firmId/settings/documents"
          staffOwner={true}
        />
        
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Folder Templates", path: null },
          ]}
          component={PracticeFolderTemplates}
          path="/firm/:firmId/settings/folder-templates/:folderTemplateId/update"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            {
              display: "Folder Templates",
              path: `/firm/${firmId}/settings/folder-templates`,
            },
            ,
            { display: "Recycle Bin", path: null },
          ]}
          component={PracticeFolderTemplates}
          path="/firm/:firmId/settings/folder-templates/:folderTemplateId/recycle-bin"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Folder Templates", path: null },
          ]}
          component={PracticeFolderTemplates}
          path="/firm/:firmId/settings/folder-templates/new"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Folder Templates", path: null },
          ]}
          component={PracticeFolderTemplates}
          path="/firm/:firmId/settings/folder-templates"
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Request Lists", path: `/firm/${firmId}/settings/request-list` },
            { display: "Request List Tasks", path: null },
          ]}
          component={WorkspaceRequestTasks}
          exact
          path="/firm/:firmId/settings/request-list/:requestId/:requestTaskStatus"
          staff={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Request Lists", path: null },
          ]}
          component={WorkspaceRequests}
          path="/firm/:firmId/settings/request-list"
          staffOwner={true}
        />
        {/* <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Services", path: null },
          ]}
          component={InvoiceService}
          path="/firm/:firmId/settings/services"
          staffOwner={true}
        /> */}
        {/* <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Electronic Payments", path: null },
          ]}
          component={Enrollment}
          path="/firm/:firmId/settings/enrollment"
          staffOwner={true}
        /> */}
        {/* <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Electronic Payments", path: null },
          ]}
          component={ElectronicPayment}
          path="/firm/:firmId/settings/electronic-payments"
          staffOwner={true}
        /> */}
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Integrations", path: null },
          ]}
          component={PracticeMangobillingSettings}
          path="/firm/:firmId/settings/integrations"
          staffOwner={true}
        />
        <YTRoute
          breadcrumbs={[
            { display: "Settings", path: `/firm/${firmId}/settings` },
            { display: "Group Permissions", path: null },
          ]}
          component={PracticeGroupPermissionSettings}
          path="/firm/:firmId/settings/group-permissions"
          staffOwner={true}
        />
      </Switch>
    );
  }
}

export default FirmPracticeRouter;
