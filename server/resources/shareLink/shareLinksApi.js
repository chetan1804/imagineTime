/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var shareLinks = require('./shareLinksController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/share-links/auth-by-password/:hex'  , shareLinks.authByPassword);
  router.post('/api/share-links/upload-files/:hex'      , shareLinks.uploadFiles);
  router.post('/api/share-links'                        , requireLogin(), shareLinks.create); // must login by default
  router.post('/api/share-links/bulk-delete'   , requireLogin(), shareLinks.bulkDelete);

  // - Read
  router.post('/api/share-links/search'         , requireLogin(), shareLinks.search);
  router.get('/api/share-links'                 , requireRole('admin'), shareLinks.list);
  router.get('/api/share-links/get-by-hex/:hex' , shareLinks.getByHex);
  router.get('/api/share-links/get-by-hex-v2/:hex' , shareLinks.getByHexV2);

  router.get('/api/share-links/download/:hex/:fileId/:filename' , shareLinks.downloadFile);

  // router.get('/api/share-links/search'         , shareLinks.search); //disabled by default
  // router.get('/api/share-links/by-:refKey/:refId*'  , shareLinks.listByRefs);
  // router.get('/api/share-links/by-:refKey-list'    , shareLinks.listByValues);
  // router.get('/api/share-links/default'        , shareLinks.getDefault);
  // router.get('/api/share-links/schema'         , requireRole('admin'), shareLinks.getSchema);
  router.get('/api/share-links/:id'            , requireLogin(), shareLinks.getById);

  router.get('/api/share-links/get-by-firm/:firmId', requireLogin(), shareLinks.getByFirm);

  // - Update
  router.put('/api/share-links/with-permission/:id'     , shareLinks.updateWithPermission); // can't require login since nobody ever has to login anymore.
  router.put('/api/share-links/:id'                     , requireRole('admin'), shareLinks.update); // no manual permission checks here so we require admin.
  router.put('/api/share-links/files/:id'               , requireLogin(), shareLinks.updateSharefiles);

  // - Delete
  router.delete('/api/share-links/:id'         , requireRole('admin'), shareLinks.delete); // must be an 'admin' by default

}
