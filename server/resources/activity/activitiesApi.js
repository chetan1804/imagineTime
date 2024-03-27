/**
 * CRUD API for Activity.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var activities = require('./activitiesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/activities'                      , requireLogin(), activities.create); // must login by default
  router.post('/api/activities/client-file-upload'   , requireLogin(), activities.createOnClientFileUpload); // must login by default
  router.post('/api/activities/staff-file-upload'    , requireLogin(), activities.createOnStaffFileUpload); // must login by default
  router.post('/api/activities/viewed-request-signature/:quickTaskId', activities.createViewRequestSignature);
  
  // - Read
  router.get('/api/activities'                       , requireRole('admin'), activities.list);
  // router.get('/api/activities/search'         , activities.search); //disabled by default
  router.get('/api/activities/by-:refKey/:refId*'    , requireLogin(), activities.listByRefs);
  router.get('/api/activities/by-:refKey-list'       , requireLogin(), activities.listByValues);
  router.get('/api/activities/default'               , requireLogin(), activities.getDefault);
  // router.get('/api/activities/schema'         , requireRole('admin'), activities.getSchema);
  router.get('/api/activities/:id'                   , requireLogin(), activities.getById);

  // - Update
  router.put('/api/activities/:id'                   , requireLogin(), activities.update); // must login by default

  // - Delete
  router.delete('/api/activities/:id'                , requireRole('admin'), activities.delete); // must be an 'admin' by default

}
