/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var taskActivity = require('./taskActivityController');

module.exports = function(router, requireLogin, requireRole) {

  // create
  router.post('/api/task-activity'                          , requireLogin(), taskActivity.create);
  router.post('/api/task-activity/request-changes'          , requireLogin(), taskActivity.requestChanges);

  // read 
  router.get('/api/task-activity/by-:refKey/:refId*'        , requireLogin(), taskActivity.listByRefs);
  router.get('/api/task-activity/:id'                       , requireLogin(), taskActivity.getById);

  // put
  // router.put('/api/task-activity/:id'                       , requireLogin(), taskActivity.update); // no manual permission checks here so we require admin.
  // router.put('/api/task-activity/bulk-update/:clientId'     , requireLogin(), taskActivity.bulkUpdate); // no manual permission checks here so we require admin.
}