/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var requestFolder = require('./requestsFolderController');

module.exports = function(router, requireLogin, requireRole) {

  // create
  router.post('/api/request-folder'                          , requireLogin(), requestFolder.create);

  // read 
  router.get('/api/request-folder/by-:refKey/:refId*'        , requireLogin(), requestFolder.listByRefs);
  router.get('/api/request-folder/:id'                       , requireLogin(), requestFolder.getById);
  // router.get('/api/request-folder/portal-request/:clientId'  , requireLogin(), requestFolder.portalRequest);

  // put
  router.put('/api/request-folder/:id'                       , requireLogin(), requestFolder.update); // no manual permission checks here so we require admin.

}
