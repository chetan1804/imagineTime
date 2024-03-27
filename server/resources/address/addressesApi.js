/**
 * CRUD API for Address.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var addresses = require('./addressesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/addresses'               , requireLogin(), addresses.create); // must login by default
  router.post('/api/addresses/list-by-client-ids' , requireLogin(), addresses.getListByClientIds);
  router.post('/api/addresses/list-by-Ids'   , requireLogin(), addresses.getListByIds);

  // - Read
  router.get('/api/addresses'                , requireRole('admin'), addresses.list);
  router.get('/api/addresses/search'         ,  requireLogin(), addresses.search);
  router.get('/api/addresses/by-_staff/:staffId'  , requireLogin(), addresses.listByStaff);
  router.get('/api/addresses/by-:refKey/:refId*'  , requireLogin(), addresses.listByRefs);
  router.get('/api/addresses/by-:refKey-list'    , requireLogin(), addresses.listByValues);
  router.get('/api/addresses/default'        , requireLogin(), addresses.getDefault);
  router.get('/api/addresses/schema'         , requireRole('admin'), addresses.getSchema);
  router.get('/api/addresses/:id'            , requireLogin(), addresses.getById);

  // - Update
  router.put('/api/addresses/:id'            , requireLogin(), addresses.update); // must login by default

  // - Delete
  router.delete('/api/addresses/:id'         , requireRole('admin'), addresses.delete); // must be an 'admin' by default

}
