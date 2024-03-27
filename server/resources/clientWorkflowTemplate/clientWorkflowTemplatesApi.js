/**
 * CRUD API for ClientWorkflowTemplate.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientWorkflowTemplates = require('./clientWorkflowTemplatesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-workflow-templates'               , requireLogin(), clientWorkflowTemplates.create); // must login by default

  // - Read
  router.get('/api/client-workflow-templates'                , requireRole('admin'), clientWorkflowTemplates.list);
  router.get('/api/client-workflow-templates/search'         , requireLogin(), clientWorkflowTemplates.search);
  router.get('/api/client-workflow-templates/by-:refKey/:refId*'  , requireLogin(), clientWorkflowTemplates.listByRefs);
  router.get('/api/client-workflow-templates/by-:refKey-list'    , requireLogin(), clientWorkflowTemplates.listByValues);
  router.get('/api/client-workflow-templates/default'        , requireLogin(), clientWorkflowTemplates.getDefault);
  router.get('/api/client-workflow-templates/schema'         , requireRole('admin'), clientWorkflowTemplates.getSchema);
  router.get('/api/client-workflow-templates/:id'            , requireLogin(), clientWorkflowTemplates.getById);

  // - Update
  router.put('/api/client-workflow-templates/:id'            , requireLogin(), clientWorkflowTemplates.update); // must login by default

  // - Delete
  router.delete('/api/client-workflow-templates/:id'         , requireRole('admin'), clientWorkflowTemplates.delete); // must be an 'admin' by default

}
