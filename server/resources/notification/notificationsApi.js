/**
 * CRUD API for Notification.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var notifications = require('./notificationsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/notifications'               , requireLogin(), notifications.create); // must login by default

  // - Read
  router.get('/api/notifications'                , requireRole('admin'),  notifications.list);
  // router.get('/api/notifications/search'         , requireLogin(),  notifications.search); //disabled by default
  router.get('/api/notifications/by-_mine/:id'        , requireLogin(), notifications.listMyNotifs);
  //router.get('/api/notifications/by-:refKey/:refId*'  , requireRole('admin'),  notifications.listByRefs);

  router.get('/api/notifications/by-:refKey/:refId*'  , requireLogin(),  notifications.listByRefs);

  router.get('/api/notifications/by-:refKey-list'    , requireRole('admin'),  notifications.listByValues);
  router.get('/api/notifications/default'        , requireRole('admin'),  notifications.getDefault);
  // router.get('/api/notifications/schema'         , requireRole('admin'),  notifications.getSchema);
  router.get('/api/notifications/:id'            , requireLogin(),  notifications.getById);

  // - Update
  router.put('/api/notifications/:id'            , requireLogin(), notifications.update); // must login by default

  // - Delete
  router.delete('/api/notifications/:id'         , requireRole('admin'), notifications.delete); // must be an 'admin' by default

}
