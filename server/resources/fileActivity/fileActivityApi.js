/**
 * CRUD API for file-activity.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var fileactivity = require('./fileActivityController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  
  // - get
  router.get('/api/file-activity'                       , requireRole('admin'), fileactivity.list);
  router.get('/api/file-activity/by-_client/:clientId'  , requireLogin(), fileactivity.getByClientId)
  router.get('/api/file-activity/by-:refKey/:refId*'    , requireLogin(), fileactivity.listByRefs);

  // - search
  router.post('/api/file-activity/search'               , requireLogin(), fileactivity.search);
}