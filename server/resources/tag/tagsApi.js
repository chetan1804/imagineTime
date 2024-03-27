/**
 * CRUD API for Tag.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var tags = require('./tagsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/tags'               , requireLogin(), tags.create); // must login by default

  // - Read
  router.get('/api/tags'                , requireRole('admin'), tags.list);
  // router.get('/api/tags/search'         , requireLogin(), tags.search); //disabled by default
  router.get('/api/tags/by-:refKey/:refId*'  , requireLogin(), tags.listByRefs);
  router.get('/api/tags/by-:refKey-list'    , requireLogin(), tags.listByValues);
  router.get('/api/tags/default'        , requireLogin(), tags.getDefault);
  // router.get('/api/tags/schema'         , requireRole('admin'), tags.getSchema);
  router.get('/api/tags/:id'            , requireLogin(), tags.getById);

  // - Update
  router.put('/api/tags/:id'            , requireLogin(), tags.update); // must login by default

  // - Delete
  router.delete('/api/tags/:id'         , requireRole('admin'), tags.delete); // must be an 'admin' by default

}
