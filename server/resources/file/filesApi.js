/**
 * CRUD API for File.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

let files = require('./filesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/files'                  , requireLogin(), files.create); // must login by default
  router.post('/api/files/v2'               , requireLogin(), files.createV2); // must login by default
  router.post('/api/files/v2/search'         , requireLogin(), files.searchV2)

  router.post('/api/files/request-task/:hex', files.uploadFiles);
  router.post('/api/files/bulkFolder'       , files.createBulkFolder);
  router.post('/api/files/list-by-client-ids' , requireLogin(), files.getListByClientIds);

  // router.post('/api/files/bulk-update-status', requireLogin(), files.bulkUpdateStatus);
  router.post('/api/files/bulk-delete', requireLogin(), files.bulkDeleteFiles);
  router.post('/api/files/folder'           , requireLogin(), files.createFolder); //
  router.post('/api/files/bulkUpdate'       , requireLogin(), files.bulkUpdate);
  router.post('/api/files/file-base64'      , files.bulkDownload);
  router.post('/api/files/bulk-restore'     , requireLogin(), files.bulkRestore);

  router.post('/api/files/total-child-file',  requireLogin(), files.getTotalChildFile);
  router.post('/api/files/total-child-folder',  requireLogin(), files.getTotalChildFolder);
  router.post('/api/files/file-permission',  requireLogin(), files.getFilePermission);

  // - Read
  router.get('/api/files'                   , requireRole('admin'), files.list);

  router.get('/api/files/download/:firmId/:clientId/:fileId/:filename', files.downloadFile);
  router.get('/api/files/downloadZip/:fileIds', files.downloadFilesAndFoldersAsZip)
  router.get('/api/files/downloadFileOrFolder/:fileId', files.downloadFileOrFolder)
  router.get('/api/files/single-file-base64/:id' , files.getBase64String);

  // router.get('/api/files/search'         , requireLogin(), files.search); //disabled by default
  router.get('/api/files/by-_staff/:staffId*', requireLogin(), files.listByStaff); // get firm files by staff permission 
  router.get('/api/files/by-:refKey/:refId*', requireLogin(), files.listByRefs);
  router.get('/api/files/by-:refKey-list'   , requireLogin(), files.listByValues);
  router.get('/api/files/default'           , requireLogin(), files.getDefault);

  // router.get('/api/files/schema'         , requireRole('admin'),  files.getSchema);
  router.get('/api/files/:id'               , requireLogin(), files.getById);
  router.get('/api/files/request-task/:requestTaskId'    , files.getByRequestTask);
  router.get('/api/files/file-version/:id'  , requireLogin(), files.getFileVersion);
 
  //mangobilling only
  router.get('/api/files/getFolder/:clientId', requireLogin(), files.getClientFolders);

  router.get('/api/files/getFolder/:clientId/:foldername', requireLogin(), files.getFoldersByFoldername);
  router.get('/api/files/get-parent-folder/:id'     , requireLogin(), files.getParentFolders);

  // - Update
  router.put('/api/files/:id'               , requireLogin(), files.update); // must login by default
  // router.put('/api/files/bulk-update-status'  , requireLogin(), files.bulkUpdateStatus);

  // - Delete
  // testing - move back to a delete call
  // router.get('/api/files/:id/delete'            , requireRole('admin'), files.delete); // must be an 'admin' by default

  router.delete('/api/files/:id'            , requireLogin(), files.delete); // must be an 'admin' by default
}
