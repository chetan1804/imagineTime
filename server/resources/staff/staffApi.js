/**
 * CRUD API for Staff.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var staff = require('./staffController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/staff/invite/:firmId'           , requireLogin(), staff.invite);
  router.post('/api/staff'                          , requireLogin(), staff.create); // must login by default
  router.post('/api/staff/bulk-invite'              , requireLogin(), staff.bulkInvite);
  router.post('/api/staff/invite-reset/:firmId'     , requireLogin(), staff.inviteResetUser);

  // - Read
  router.get('/api/staff'                           , requireRole('admin'), staff.list)
  router.get('/api/staff/logged-in-by-firm/:firmId' , requireLogin(), staff.getLoggedInByFirm)
  // router.get('/api/staff/search'         , staff.search); //disabled by default
  router.get('/api/staff/by-:refKey/:refId*'        , requireLogin(), staff.listByRefs);
  router.get('/api/staff/by-:refKey-list'           , requireLogin(), staff.listByValues);
  router.get('/api/staff/default'                   , requireLogin(), staff.getDefault);

  // router.get('/api/staff/schema'      , requireRole('admin'), staff.getSchema);
  router.get('/api/staff/:id'                       , requireLogin(), staff.getById);

  // - Update
  router.put('/api/staff/:id/create-api-user'       , requireLogin(), staff.createApiUser);
  router.put('/api/staff/:id'                       , requireLogin(), staff.update); // must login by default

  // - Delete
  router.delete('/api/staff/:id'                    , requireLogin(), staff.delete); // must be an 'admin' by default

}
