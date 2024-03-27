// for future 

/**
 * CRUD API for viewDownload.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var viewDownload = require('./viewDownloadsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/view-download/download-notification'        , viewDownload.downloadNotification);
}
