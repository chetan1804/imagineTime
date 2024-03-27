/**
 * CRUD API for ClientUser.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientUsers = require('./clientUsersController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-users'                            , requireLogin(), clientUsers.create); // must login by default
  router.post('/api/client-users/invite/:clientId'           , requireLogin(), clientUsers.invite);
  router.post('/api/client-users/bulk-invite-csv/:clientId'  , requireLogin(), clientUsers.bulkInviteCsv);
  router.post('/api/client-users/invite-reset/:clientId'     , requireLogin(), clientUsers.inviteResetUser);
  router.post('/api/client-users/bulk-update-status', requireLogin(), clientUsers.bulkUpdateStatus);
  router.post('/api/client-users/bulk-diassociate-client', requireLogin(), clientUsers.bulkDisassociateFromClient);
  router.post('/api/client-users/resend-invite'              , requireLogin(), clientUsers.resendInvite);

  // - Read
  router.get('/api/client-users'                , requireRole('admin'), clientUsers.list);
  router.get('/api/client-users/logged-in-by-client/:clientId', requireLogin(), clientUsers.getLoggedInByClient)
  // router.get('/api/client-users/search'         , clientUsers.search); //disabled by default
  router.get('/api/client-users/by-email/:email'            , requireLogin(), clientUsers.findByEmail);
  router.get('/api/client-users/by-:refKey/:refId*'  , requireLogin(), clientUsers.listByRefs);
  router.get('/api/client-users/by-:refKey-list'    , requireLogin(), clientUsers.listByValues);
  router.get('/api/client-users/default'        , requireLogin(), clientUsers.getDefault);
  // router.get('/api/client-users/schema'         , requireRole('admin'), clientUsers.getSchema);

  router.get('/api/client-users/:id'            , requireLogin(), clientUsers.getById);

  // - Update
  router.put('/api/client-users/:id'            , requireLogin(), clientUsers.update); // must login by default

  // - Update ClientUser status rare scenario need to update client also
  router.put('/api/client-users/update/:id'     , requireLogin(), clientUsers.updateClientUserStatus); // must login by default

  // - Delete
  router.delete('/api/client-users/:id'         , requireRole('admin'), clientUsers.delete); // must be an 'admin' by default

}
