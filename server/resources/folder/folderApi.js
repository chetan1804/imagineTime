/**
 * CRUD API for file-activity.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var folder = require('./folderController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/folder'               , requireLogin(), folder.create); // must login by default
  
  // - Read
  router.get('/api/folder'                       , requireRole('admin'), folder.list);
  router.get('/api/folder/:id'               , requireLogin(), folder.getById);
  router.get('/api/folder/by-:refKey/:refId*'    , requireLogin(), folder.listByRefs);
}