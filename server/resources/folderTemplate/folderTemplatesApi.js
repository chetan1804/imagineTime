/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var folderTemplates = require('./folderTemplatesController');

module.exports = function(router, requireLogin, requireRole) {

  // post
  router.post('/api/folder-template'                          , requireLogin(), folderTemplates.create);
  router.post('/api/folder-template/apply'                    , requireLogin(), folderTemplates.applyFolderTemplate);
  router.post('/api/folder-template/bulk-apply'               , requireLogin(), folderTemplates.bulkApplyFolderTemplate);

  // put
  router.put('/api/folder-template/:id'                       , requireLogin(), folderTemplates.update);

  // read 
  router.get('/api/folder-template/by-:refKey/:refId*'        , requireLogin(), folderTemplates.listByRefs);
  router.get('/api/folder-template/:id'                       , requireLogin(), folderTemplates.getById);

  // delete
  router.delete('/api/folder-template/delete/:id', requireLogin(), folderTemplates.deleteRootFolder);
}
