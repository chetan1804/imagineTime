/**
 * CRUD API for Subscription.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var subscriptions = require('./subscriptionsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/subscriptions'               , requireLogin(), subscriptions.create); // must login by default

  // - Read
  router.get('/api/subscriptions'                , requireRole('admin'), subscriptions.list);
  router.get('/api/subscriptions/search'         , requireLogin(), subscriptions.search);
  router.get('/api/subscriptions/by-:refKey/:refId*'  , requireLogin(), subscriptions.listByRefs);
  router.get('/api/subscriptions/by-:refKey-list'    , requireLogin(), subscriptions.listByValues);
  router.get('/api/subscriptions/default'        , requireLogin(), subscriptions.getDefault);
  router.get('/api/subscriptions/schema'         , requireRole('admin'), subscriptions.getSchema);
  router.get('/api/subscriptions/:id'            , requireLogin(), subscriptions.getById);

  // - Update
  router.put('/api/subscriptions/:id'            , requireLogin(), subscriptions.update); // must login by default

  // - Delete
  router.delete('/api/subscriptions/:id'         , requireRole('admin'), subscriptions.delete); // must be an 'admin' by default

}
