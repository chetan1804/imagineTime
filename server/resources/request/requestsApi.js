/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var request = require('./requestsController');

module.exports = function(router, requireLogin, requireRole) {

  // create
  router.post('/api/request'                          , requireLogin(), request.create);
  router.post('/api/request/bulk-apply'               , requireLogin(), request.bulkCreate);

  // read 
  router.get('/api/request/by-:refKey/:refId*'        , requireLogin(), request.listByRefs);
  router.get('/api/request/:id'                       , requireLogin(), request.getById);
  router.get('/api/portal-request/:clientId'          , requireLogin(), request.portalRequest);

  // put
  router.put('/api/request/:id'                       , requireLogin(), request.update); // no manual permission checks here so we require admin.

}
