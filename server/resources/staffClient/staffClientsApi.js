/**
 * CRUD API for StaffClient.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var staffClients = require('./staffClientsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/staff-clients'               , requireLogin(), staffClients.create); // must login by default
  router.post('/api/staff-multiple-client'       , requireLogin(), staffClients.multipleCreate);
  router.post('/api/staff-clients/list-by-client-ids' , requireLogin(), staffClients.getListByClientIds);
  router.post('/api/staff-clients/assign-multiple-staff'    , requireLogin(), staffClients.assignMultipleStaff);
  router.post('/api/staff-clients/:firmId/bulkDelete', requireLogin(), staffClients.bulkDelete);
  router.post('/api/staff-clients/bulk-notification-update',  requireLogin(), staffClients.bulkNotificationUpdate);

  // - Read
  router.get('/api/staff-clients'                , requireRole('admin'), staffClients.list);
  // router.get('/api/staff-clients/search'         , staffClients.search); //disabled by default
  router.get('/api/staff-clients/by-:refKey/:refId*'  , requireLogin(), staffClients.listByRefs);
  router.get('/api/staff-clients/by-:refKey-list'    , requireLogin(), staffClients.listByValues);
  router.get('/api/staff-clients/default'        , requireLogin(), staffClients.getDefault);
  // router.get('/api/staff-clients/schema'         , requireLogin(), staffClients.getSchema);
  router.get('/api/staff-clients/:id'            , requireLogin(), staffClients.getById);

  // - Update
  router.put('/api/staff-clients/:id'            , requireLogin(), staffClients.update); // must login by default

  // - Delete
  router.delete('/api/staff-clients/:id'         , requireLogin(), staffClients.delete); // must be staff owner or 'admin'
}
