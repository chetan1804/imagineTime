/**
 * CRUD API for Client.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var desktopPlugin = require('./desktopPluginController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/desktop-plugin/share-links'           , requireLogin(),  desktopPlugin.createSignature);
  router.post('/api/desktop-plugin/share-links-socket/'   , requireLogin(),  desktopPlugin.createSignatureSocket);
  router.post('/api/desktop-plugin/signature-request'     , requireLogin(),  desktopPlugin.createSignatureRequest);
  router.post('/api/desktop-plugin/request-files'         , requireLogin(),  desktopPlugin.createRequestFiles);
  router.post('/api/desktop-plugin/share-files'           , requireLogin(),  desktopPlugin.createShareFiles);

  // - get
  router.get('/api/desktop-plugin/firms'                  , requireLogin(),  desktopPlugin.desktopFirms); // get firms associated to active staffs by userId
  router.get('/api/desktop-plugin/clients/:firmId'        , requireLogin(),  desktopPlugin.desktopClients); // get clients associated by staff by firmId
}