/**
 * CRUD API for ClientTask.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientTasks = require('./clientTasksController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-tasks'                     , requireLogin(), clientTasks.create); // must login by default

  // - Read
  router.get('/api/client-tasks'                      , requireRole('admin'), clientTasks.list);
  // router.get('/api/client-tasks/search'               , clientTasks.search); //disabled by default
  router.get('/api/client-tasks/by-:refKey/:refId*'   , requireLogin(), clientTasks.listByRefs);
  router.get('/api/client-tasks/by-:refKey-list'      , requireLogin(), clientTasks.listByValues);
  router.get('/api/client-tasks/default'              , requireLogin(), clientTasks.getDefault);
  // router.get('/api/client-tasks/schema'               , requireLogin(), requireRole('admin'), clientTasks.getSchema);
  router.get('/api/client-tasks/:id'                  , requireLogin(), clientTasks.getById);

  // - Update
  router.put('/api/client-tasks/:id/prepare-for-signature'  , requireLogin(), clientTasks.prepareForSignature);
  router.put('/api/client-tasks/:id/finalize-signature'     , requireLogin(), clientTasks.finalizeSignature); // should download the document and save it to the client task, create a clientTaskResponse, update the client task status to awaiting approval, send the client task back to the frontend.
  router.put('/api/client-tasks/:id/status/:status'         , requireLogin(), clientTasks.updateStatus);
  router.put('/api/client-tasks/:id'                        , requireLogin(), clientTasks.update); // must login by default

  // - Delete
  router.delete('/api/client-tasks/staff-delete/:id'  , requireLogin(), clientTasks.staffDelete);
  router.delete('/api/client-tasks/:id'               , requireRole('admin'), clientTasks.delete); // must be an 'admin' by default

}
