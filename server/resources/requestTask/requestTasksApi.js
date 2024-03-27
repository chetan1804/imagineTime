/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var requestTask = require('./requestTasksController');

module.exports = function(router, requireLogin, requireRole) {

  // create
  router.post('/api/request-task'                          , requireLogin(), requestTask.create);
  router.post('/api/request-task/upload-files/:hex'        , requestTask.uploadFiles);

  // read 
  router.post('/api/request-task/search'                   , requireLogin(), requestTask.search);
  router.get('/api/request-task/by-:refKey/:refId*'        , requireLogin(), requestTask.listByRefs);
  router.get('/api/request-task/:id'                       , requireLogin(), requestTask.getById);
  router.get('/api/portal-request-task/:clientId'          , requireLogin(), requestTask.portalRequestTask);
  router.get('/api/request-task/get-by-hex/:hex'           , requestTask.getByHex);

  // put
  router.put('/api/request-task/:id'                       , requireLogin(), requestTask.update); // no manual permission checks here so we require admin.
  router.put('/api/request-task/bulk-update/:clientId'     , requireLogin(), requestTask.bulkUpdate); // no manual permission checks here so we require admin.
  router.put('/api/request-task-bulk-update-status'        , requireLogin(), requestTask.bulkUpdateStatus);
  router.put('/api/request-task/client-user/:id'           , requestTask.updatebyClientUser); // only assigned contact require

  // - Delete
  router.post('/api/request-task/bulk-delete' , requireLogin(), requestTask.bulkDelete);
}