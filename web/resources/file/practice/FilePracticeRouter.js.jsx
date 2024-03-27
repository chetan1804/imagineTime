/**
 * Set up routing for all File views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch, withRouter  } from 'react-router-dom';
import { connect } from 'react-redux';

// import utilities
import { permissions } from '../../../global/utils';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';

// import file views
import PracticeSingleFile from './views/PracticeSingleFile.js.jsx';
import ArchivedFiles from './views/ArchivedFiles.js.jsx'; 
import WorkspacesGeneral from './views/WorkspacesGeneral.js.jsx';
import WorkspaceFiles from './views/WorkspaceFiles.js.jsx';

// import actions
import clientActions from '../../client/clientActions';

class FilePracticeRouter extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { match, dispatch, location } = this.props;
  }
  
  render() {
    const { clientStore, breadcrumbs } = this.props;
    const firmId = this.props.location.pathname.split('/')[2];
    const client = clientStore.selected.getItem() || {};
    return (
      <Switch>


        {/*  *********************************************************************************************************************************************/}
        {/*  **********************************************  PUBLIC ROUTE START  *************************************************************************/}
        {/*  *********************************************************************************************************************************************/}
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile} 
          exact
          staff={true}
          path="/firm/:firmId/files/public/archived/:folderId/archived-folder/:fileId" 
        />        
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/public/archived/:folderId/archived-folder" 
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/public/:folderId/folder/file-activity/:fileId" 
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/public/:folderId/folder/archived"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/public/file-activity/:fileId" 
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/public/:folderId/folder/:fileId" // PREVIEW FILE ALSO BUT ASSOCIATE IN FOLDER
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/public/:folderId/folder"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/public/archived/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/public/archived"
        />
        
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/public/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/public"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/public?page=:currentPage&per=:perPage"
        />
        {/*  *********************************************************************************************************************************************/}
        {/*  **********************************************  PUBLIC ROUTE END  *************************************************************************/}
        {/*  *********************************************************************************************************************************************/}



















        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  ALL FILES WORKSPACE ROUTE START  *********************************************************/}
        {/*  *********************************************************************************************************************************************/}
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/archived/:folderId/archived-folder/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/archived/:folderId/archived-folder"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/:folderId/folder/file-activity/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/:folderId/folder/archived"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/:folderId/folder/:fileId" 
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/:folderId/folder"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/archived/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/archived"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/file-activity/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace/:fileId" 
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace"
        />
        <YTRoute 
          // breadcrumbs={[{display: 'Folders', path: `/firm/${firmId}/files` },{display: 'Staff Files', path: `/firm/${firmId}/files/personal` }]}
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}  
          exact
          staff={true}
          path="/firm/:firmId/files/:clientId/workspace?page=:currentPage&per=:perPage"
        />
        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  ALL FILES WORKSPACE ROUTE END  ***********************************************************/}
        {/*  *********************************************************************************************************************************************/}














        {/*  *********************************************************************************************************************************************/}
        {/*  **********************************************  PERSONAL ROUTE END  *************************************************************************/}
        {/*  *********************************************************************************************************************************************/}
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder/archived/:folderId/archived-folder/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/archived/:folderId/archived-folder/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/archived/:folderId/archived-folder"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder/archived/:fileId/archived-folder"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder/archived/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder/archived"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder/file-activity/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder/:fileId" 
        />        
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:folderId/folder"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/archived/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={ArchivedFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/archived"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles} 
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/file-activity/:fileId"
        />
        <YTRoute
          breadcrumbs={breadcrumbs}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal/:fileId"
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspaceFiles}
          exact
          staff={true}
          path="/firm/:firmId/files/:userId/personal"
        />
        <YTRoute 
          // breadcrumbs={[{display: 'Folders', path: `/firm/${firmId}/files` },{display: 'Staff Files', path: `/firm/${firmId}/files/personal` }]}
          breadcrumbs={breadcrumbs}
          component={WorkspacesGeneral}  
          exact
          staff={true}
          path="/firm/:firmId/files/:personal"
        />
        <YTRoute 
          // breadcrumbs={[{display: 'Folders', path: `/firm/${firmId}/files` },{display: 'Staff Files', path: `/firm/${firmId}/files/personal` }]}
          breadcrumbs={breadcrumbs}
          component={WorkspacesGeneral}  
          exact
          staff={true}
          path="/firm/:firmId/files/personal?page=:currentPage&per=:perPage"
        />
        {/*  *********************************************************************************************************************************************/}
        {/*  **********************************************  PERSONAL ROUTE END  *************************************************************************/}
        {/*  *********************************************************************************************************************************************/}














        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  OLD ROUTE START  *************************************************************************/}
        {/*  *********************************************************************************************************************************************/}        
        <YTRoute 
          breadcrumbs={[{display: 'Folders', path: null }]}
          component={WorkspacesGeneral}  
          exact
          staff={true}
          path="/firm/:firmId/files"
        />
        <YTRoute 
          breadcrumbs={[{display: 'Files', path: `/firm/${firmId}/files` }, {display: 'File details', path: null }]}
          component={PracticeSingleFile}
          exact
          staff={true}
          path="/firm/:firmId/files/:fileId" 
        />
        <YTRoute 
          breadcrumbs={breadcrumbs}
          component={WorkspacesGeneral}  
          exact
          staff={true}
          path="/firm/:firmId/files?page=:currentPage&per=:perPage"
        />
        {/*  *********************************************************************************************************************************************/}
        {/*  *************************************************  OLD ROUTE START  *************************************************************************/}
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

  const { match } = props;
  const firmId = match.params.firmId;
  const files = store.file && store.file.byId ? store.file.byId : null;
  const client = store.client && store.client.selected ? store.client.selected.getItem() : null;
  const userMap = store.user.byId;
  const loggedInUser = store.user.loggedIn.user;
  const isStaffOwner = permissions.isStaffOwner(store.staff, loggedInUser, firmId);

  console.log("debug11", store.client);
  
  // params clientId, fileId, fileActivityId cannot get from FilePracticeRouter without set in breadcrumbs first 
  let userId = match.params.userId;
  let clientId = match.params.clientId;
  let fileId = match.params.fileId;
  let fileActivityId = match.params.fileId;
  let finalFileId = match.params.fileId;

  // another way to find out where your page is
  const path = props.location.pathname.split('/');
  const _public = path[3] === "files" && path[4] === "public";
  const _personal = path[3] === "files" && path[5] === "personal";
  const _workspace_general = path[3] === "files" && path[5] === "workspace";  // workspace in general view
  let breadcrumbs = [{display: 'Folders', path: `/firm/${firmId}/files`}];
  // let _archived;

  console.log("_workspace_general", _workspace_general)

  // all files, public view
  if (firmId && (_public || _personal) && !clientId) {
    console.log("debug11");

    // get fileId if user open a folder
    fileId = path[6] === "folder" ? path[5] : fileId; // get fileId
    fileActivityId = path[5] === "file-activity" ? path[6] : fileActivityId;
    fileActivityId = path[6] === "file-activity" ? path[7] : fileActivityId;
    fileActivityId = path[7] === "file-activity" ? path[8] : fileActivityId;
    fileActivityId = path[8] === "file-activity" ? path[9] : fileActivityId;
    fileId = path[5] === "archived" && path[7] === "archived-folder" ? path[6] : fileId;
    fileId = path[6] === "archived" && path[8] === "archived-folder" ? path[7] : fileId;
    fileId = _personal && path[7] === "folder" ? path[6] : fileId;
    userId = _personal ? path[4] : userId;
    // userId = _personal ? path[4] : userId;

    const displayName = userMap[userId] ? `${userMap[userId].firstname} ${userMap[userId].lastname}` : "General Files";
    // const targetViewingAs = 
    // const displayName = _personal ? "Personal Files" : "General Files";
    const viewingAs = _personal ? `${userId}/personal` : "public";

    if (isStaffOwner && _personal) {
      breadcrumbs.push({display: "Staff Files", path: `/firm/${firmId}/files/personal`});
    }
    breadcrumbs.push({display: displayName, path: `/firm/${firmId}/files/${viewingAs}`});

  // all files, selected workspace from general
  } else if (_workspace_general && client) {

    // get fileId if user open a folder
    fileId = path[7] === "folder" ? path[6] : fileId; // get fileId
    fileActivityId = path[6] === "file-activity" ? path[7] : fileActivityId;
    fileActivityId = path[7] === "file-activity" ? path[8] : fileActivityId; // file activity view inside of folder
    fileId = path[6] === "archived" && path[8] === "archived-folder" ? path[7] : fileId;

    // default value
    breadcrumbs = [
      {display: 'Folders', path: `/firm/${firmId}/files`}
      , {display: (client.name || ""), path: `/firm/${firmId}/files/${client._id}/workspace`}
    ];
  } else if (path[4] === "personal") {
    console.log("debug33");
    if (isStaffOwner) {
      breadcrumbs.push({display: "Staff Files", path: `/firm/${firmId}/files/personal`});
    }
  }
 
  return {
    fileStore: store.file
    , clientStore: store.client
    , breadcrumbs
  }  
}

export default withRouter(
  connect(
  mapStoreToProps
)(FilePracticeRouter)
);
