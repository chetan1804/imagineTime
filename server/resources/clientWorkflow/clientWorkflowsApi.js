/**
 * CRUD API for ClientWorkflow.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientWorkflows = require('./clientWorkflowsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-workflows'               , requireLogin(), clientWorkflows.create); // must login by default
  router.post('/api/client-workflows/from-template' , requireLogin(), clientWorkflows.createFromTemplate);
  
  // - Read
  router.get('/api/client-workflows'                , requireRole('admin'), clientWorkflows.list);
  // TODO: restrict this ^^

  router.get('/api/client-workflows/search'         , requireLogin(),  clientWorkflows.search);
  router.get('/api/client-workflows/by-_clientWorkflow/:clientWorkflowId'  , requireLogin(),  clientWorkflows.listByClientWorkflow);
  router.get('/api/client-workflows/by-:refKey/:refId*'  , requireLogin(),  clientWorkflows.listByRefs);
  router.get('/api/client-workflows/by-:refKey-list'    , requireLogin(),  clientWorkflows.listByValues);
  router.get('/api/client-workflows/default'        , requireLogin(),  clientWorkflows.getDefault);
  router.get('/api/client-workflows/schema'         , requireRole('admin'), clientWorkflows.getSchema);
  router.get('/api/client-workflows/:id'            , requireLogin(),  clientWorkflows.getById);

  // - Update
  router.put('/api/client-workflows/:id'            , requireLogin(), clientWorkflows.update); // must login by default

  // - Delete
  router.delete('/api/client-workflows/:id'         , requireRole('admin'), clientWorkflows.delete); // must be an 'admin' by default

}
