/**
 * CRUD API for Client.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var fileSynchronization = require('./fileSynchronizationController');

module.exports = function(router, requireLogin, requireRole) {

  // - create 
  router.post('/api/file-synchronization/file'                    , requireLogin(),  fileSynchronization.fileSynchronize);
  router.post('/api/file-synchronization/client'                  , requireLogin(),  fileSynchronization.clientSynchronize);
  router.post('/api/file-synchronization/firm'                    , requireLogin(),  fileSynchronization.firmSynchronize);
  router.post('/api/file-synchronization/public'                  , requireLogin(),  fileSynchronization.publicSynchronize);
  router.post('/api/file-synchronization/personal'                , requireLogin(),  fileSynchronization.personalSynchronize);

  // - get
  router.get('/api/file-synchronization/firm/:firmId'             , requireLogin(),  fileSynchronization.getFirmSynchronize);
  router.get('/api/file-synchronization/client/:clientId'         , requireLogin(),  fileSynchronization.getClientSynchronize);
  router.get('/api/file-synchronization/firm/:firmId/personal/:personalId'     , requireLogin(),  fileSynchronization.getPersonalSynchronize);
  router.get('/api/file-synchronization/public/:firmId'           , requireLogin(),  fileSynchronization.getPublicSynchronize);
}
