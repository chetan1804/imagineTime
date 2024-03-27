/**
 * CRUD API for ClientActivity.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientActivities = require('./clientActivitiesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-activities'               , requireLogin(), clientActivities.create); // must login by default

  // - Read
  router.get('/api/client-activities'                , requireRole('admin'), clientActivities.list);
  // router.get('/api/client-activities/search'         , requireLogin(), clientActivities.search); //disabled by default
  router.get('/api/client-activities/by-:refKey/:refId*'  , requireLogin(), clientActivities.listByRefs);
  router.get('/api/client-activities/by-:refKey-list'    , requireLogin(), clientActivities.listByValues);
  router.get('/api/client-activities/default'        , requireLogin(), clientActivities.getDefault);
  // router.get('/api/client-activities/schema'         , requireRole('admin'), clientActivities.getSchema);
  router.get('/api/client-activities/:id'            , requireLogin(), clientActivities.getById);

  // - Update
  router.put('/api/client-activities/:id'            , requireLogin(), clientActivities.update); // must login by default

  // - Delete
  router.delete('/api/client-activities/:id'         , requireRole('admin'), clientActivities.delete); // must be an 'admin' by default

}
