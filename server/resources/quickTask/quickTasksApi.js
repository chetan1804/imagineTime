/**
 * CRUD API for QuickTask.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var quickTasks = require('./quickTasksController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  // TODO: Refactor create to use callback utils instead of passing req and res to different methods.
  router.post('/api/quick-tasks'                      , requireLogin(), quickTasks.create); // must login by default
  router.post('/api/quick-tasks/signature-reminder/:id'   , requireLogin(), quickTasks.signatureReminder);
  router.post('/api/quick-tasks/request-file-reminder/:id'   , requireLogin(), quickTasks.requestFileReminder);

  // - Read
  router.get('/api/quick-tasks'                       , requireRole('admin'), quickTasks.list);
  // router.get('/api/quick-tasks/search'               , quickTasks.search); //disabled by default
  router.get('/api/quick-tasks/by-:refKey/:refId*'    , requireLogin(), quickTasks.listByRefs);
  router.get('/api/quick-tasks/by-:refKey-list'       , requireLogin(), quickTasks.listByValues);
  router.get('/api/quick-tasks/default'               , requireLogin(), quickTasks.getDefault);
  // router.get('/api/quick-tasks/schema'               , requireRole('admin'), quickTasks.getSchema);
  router.get('/api/quick-tasks/:id'                   , requireLogin(), quickTasks.getById);
  router.get('/api/quick-tasks/:firmId/:templateId'   , requireLogin(), quickTasks.getAssureSignTemplateById);
  

  // - Update
  router.put('/api/quick-tasks/with-permission/:id'     , quickTasks.updateWithPermission); // can't require login since nobody ever has to login anymore.
  router.put('/api/quick-tasks/:id/finalize-signature'  , quickTasks.finalizeSignature); // removing requireLogin to facilitate non-users signing documents. TODO: Make this more secure
  router.put('/api/quick-tasks/:id'                     , requireLogin(), quickTasks.update); // must login by default
  router.put('/api/quick-tasks/current-signer/:id', quickTasks.currentSigner);

  // - Delete
  router.delete('/api/quick-tasks/:id'                , requireRole('admin'), quickTasks.delete); // must be an 'admin' by default

}
