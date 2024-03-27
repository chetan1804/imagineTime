/**
 * CRUD API for ClientTaskResponse.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientTaskResponses = require('./clientTaskResponsesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-task-responses'               , requireLogin(), clientTaskResponses.create); // must login by default

  // - Read
  router.get('/api/client-task-responses'                , requireRole('admin'), clientTaskResponses.list);
  // router.get('/api/client-task-responses/search'         , requireLogin(), clientTaskResponses.search); //disabled by default
  router.get('/api/client-task-responses/by-:refKey/:refId*'  , requireLogin(), clientTaskResponses.listByRefs);
  router.get('/api/client-task-responses/by-:refKey-list'    , requireLogin(), clientTaskResponses.listByValues);
  router.get('/api/client-task-responses/default'        , requireLogin(), clientTaskResponses.getDefault);
  // router.get('/api/client-task-responses/schema'         , requireRole('admin'), clientTaskResponses.getSchema);
  router.get('/api/client-task-responses/:id'            , requireLogin(), clientTaskResponses.getById);

  // - Update
  router.put('/api/client-task-responses/:id'            , requireLogin(), clientTaskResponses.update); // must login by default

  // - Delete
  router.delete('/api/client-task-responses/:id'         , requireRole('admin'), clientTaskResponses.delete); // must be an 'admin' by default

}
