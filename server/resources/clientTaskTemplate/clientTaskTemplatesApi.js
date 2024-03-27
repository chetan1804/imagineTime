/**
 * CRUD API for ClientTaskTemplate.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientTaskTemplates = require('./clientTaskTemplatesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-task-templates'                    , requireLogin(), clientTaskTemplates.create); // must login by default

  // - Read
  router.get('/api/client-task-templates'                     , requireRole('admin'), clientTaskTemplates.list);
  // router.get('/api/client-task-templates/search'         , clientTaskTemplates.search); //disabled by default
  router.get('/api/client-task-templates/by-:refKey/:refId*'  , requireLogin(), clientTaskTemplates.listByRefs);
  router.get('/api/client-task-templates/by-:refKey-list'     , requireLogin(), clientTaskTemplates.listByValues);
  router.get('/api/client-task-templates/default'             , requireLogin(), clientTaskTemplates.getDefault);
  // router.get('/api/client-task-templates/schema'         , requireRole('admin'), clientTaskTemplates.getSchema);
  router.get('/api/client-task-templates/:id'                 , requireLogin(), clientTaskTemplates.getById);

  // - Update
  router.put('/api/client-task-templates/:id'                 , requireLogin(), clientTaskTemplates.update); // must login by default

  // - Delete
  router.delete('/api/client-task-templates/staff-delete/:id' , requireLogin(), clientTaskTemplates.staffDelete);
  router.delete('/api/client-task-templates/:id'              , requireRole('admin'), clientTaskTemplates.delete); // must be an 'admin' by default

}
