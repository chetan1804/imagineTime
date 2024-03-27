/**
 * CRUD API for Client.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

 var folderPermission = require('./folderPermissionController');

 module.exports = function(router, requireLogin, requireRole) {
  
  //add and update permission by folder
  router.post('/api/folder-permission/create', requireLogin(), folderPermission.createPermissionByFolder);
  router.post('/api/folder-permission/createByGroup', requireLogin(), folderPermission.createPermissionByGroup);

  // read 
  router.get('/api/folder-permission/all', requireLogin(), folderPermission.getAllPermission);
  router.get('/api/folder-permission/by-:refKey/:refId*', requireLogin(), folderPermission.listByRefs);
  router.get('/api/folder-permission/getDefault', folderPermission.getDefault)

  //populate existing firm, folders, folder templates
  router.get('/api/folder-permission/populateGroupPermission', requireLogin(), folderPermission.populateGroupPermission);
  router.get('/api/folder-permission/populateFolderPermission', requireLogin(), folderPermission.populateFolderPermission);
  router.get('/api/folder-permission/populateFolderTemplatePermission', requireLogin(), folderPermission.populateFolderTemplatePermission)

  //delete
  router.delete('/api/folder-permission/deleteAll', requireLogin(), folderPermission.deleteAllPermissions);
}
 