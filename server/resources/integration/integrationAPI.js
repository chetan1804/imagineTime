/**
 * CRUD API for Firm.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

 var integration = require('./integrationController');

 module.exports = function(router, requireLogin, requireRole) {

  //API Validation
  router.post('/api/mango/validateapiKey', integration.validateApiKeys)
   
  //Client
  router.post('/api/mango/createClient', requireLogin(), integration.createClient);
  router.put('/api/mango/updateClient/:clientID', requireLogin(), integration.updateClient);
  router.delete('/api/mango/deleteClients', requireLogin(), integration.deleteClients)
  router.get('/api/mango/clients/:CompanyID', requireLogin(), integration.getCompanyClients)
  router.get('/api/mango/clients/:CompanyID/:isIntegrated', requireLogin(), integration.getCompanyClients)
  router.get('/api/mango/archivedClients/:CompanyID', requireLogin(), integration.getCompanyArchivedClients)

  //Folder
  router.get('/api/mango/getFolderByFirm/:firmId', requireLogin(), integration.getFoldersByFirm);
  router.get('/api/mango/getFolderByClient/:clientId', requireLogin(), integration.getFoldersByClient)
  router.post('/api/mango/createFolder', requireLogin(), integration.createFolder);
  router.put('/api/mango/updateFolder/:folderID', requireLogin(), integration.updateFolder);
  router.delete('/api/mango/deleteFolders', requireLogin(), integration.deleteFolder);

  //File
  router.get('/api/mango/getFileByFirm/:firmId', requireLogin(), integration.getFilesByFirm);
  router.get('/api/mango/getArchivedFileByFirm/:firmId', requireLogin(), integration.getArchivedFilesByFirm);
  router.get('/api/mango/download/:fileId/:filename', integration.downloadFileMango);
  router.post('/api/mango/createFile', requireLogin(), integration.createFile);
  router.put('/api/mango/updateFile/:fileID', requireLogin(), integration.updateFile);
  router.put('/api/mango/archiveFiles', requireLogin(), integration.archiveFile);
  router.delete('/api/mango/deleteFiles', requireLogin(), integration.deleteFile);
  
  //ClientUser
  router.post('/api/com/clientUser/create', requireLogin(), integration.createOrUpdateClientUser);
  router.put('/api/com/clientUser/update/:userId', requireLogin(), integration.createOrUpdateClientUser);
  router.get('/api/com/clientUser/get/:firmId', requireLogin(), integration.getClientUsers);
  router.get('/api/com/clientUser/get/:firmId/:clientId', requireLogin(), integration.getClientUsers);

  //Staff
  router.post('/api/com/staff/create', requireLogin(), integration.createOrUpdateStaffUser);
  router.put('/api/com/staff/update/:userId', requireLogin(), integration.createOrUpdateStaffUser);
  router.get('/api/com/staff/getByFirm/:firmId', requireLogin(), integration.getStaffUsersByFirm);

  // utils
  router.post('/api/mango/resetFields/:mangoCompanyID', integration.resetFields)

  //developer purposes
  router.put('/api/mango/updateMangoFields/:firmId/:clientId', integration.updateMangoFields);
  
  //other integrations

  router.get('/api/com/getClientFolder', integration.getClientFolderDetails)

  router.post('/api/com/authenticate', integration.authenticateUser)
  router.post('/api/verify', requireLogin(), integration.verifyToken);

  //temporary tokens
  router.post('/api/com/generateKey', requireLogin(), integration.generateTempApiKey)
  router.post('/api/com/deleteKey', integration.deleteTempApiKey)
  router.get('/api/com/getKey/:token', integration.getTempApiKeyDetails)

  //tabs3
  router.get('/api/com/getFirm', requireLogin(), integration.getFirmDetails);
  router.get('/api/com/:firmId/getGeneralStaffFiles', requireLogin(), integration.getGeneralStaffFiles);
  router.get('/api/com/download/:fileId', requireLogin(), integration.downloadFile);
  router.post('/api/com/getSignatureRequest', requireLogin(), integration.getSignatureRequestDetails);
  router.post('/api/com/reauthenticate/usertoken', requireLogin(), integration.reauthenticateUserToken)
  //tabs3

  //---timsolv---
  router.post('/api/com/createFirm', requireLogin(), integration.createFirm);
  router.post('/api/com/inviteUser', requireLogin(), integration.inviteUser);
  router.put('/api/com/updateUser/:userId', requireLogin(), integration.updateUser);
  router.put('/api/com/userstatus/:userId', requireLogin(), integration.setUserStatus);
  //---timesolv---

  //--cosmolex
  router.post('/api/com/getFolderByPath', requireLogin(), integration.getFolderByPath);
  router.get('/api/com/getFileByUniqueId/:uniqueId', requireLogin(), integration.getFileByUniqueId);
  router.get('/api/com/getCurrentUser', requireLogin(), integration.getCurrentUser);
  //--cosmolex

  router.get('/api/getFirmToken/:firmId/:email', integration.getFirmToken);
  router.get('/api/getFilesFolders/client/:clientId', requireLogin(), integration.getFilesAndFolderByClient)
  
  router.get('/api/getClients/:firmId', requireLogin(), integration.getClientsWithFilesFolders)

  router.get('/api/com/clients/:firmId', requireLogin(), integration.getClientsByFirm)
  router.get('/api/getFolderContents/:folderId', requireLogin(), integration.getFolderContents);

  router.post('/api/com/file-search/:firmId', requireLogin(), integration.searchFiles)

  router.put('/api/com/updateClient/:clientId', requireLogin(), integration.comUpdateClient)
  router.put('/api/com/updateFile/:fileId', requireLogin(), integration.comUpdateFile)
  router.put('/api/com/moveFile', requireLogin(), integration.comBulkMoveFile)

  router.delete('/api/com/deleteClients', requireLogin(), integration.checkClientPermission, integration.deleteClients)
  router.delete('/api/com/deleteFiles', requireLogin(), integration.checkFilePermission, integration.deleteFile)

  router.post('/api/com/bulkUpload', requireLogin(), integration.bulkUpload)

  //sync upload file
  router.post('/api/com/:firmId/uploadFile', requireLogin(), integration.syncUpload)
}