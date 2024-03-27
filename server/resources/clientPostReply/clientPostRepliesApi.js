/**
 * CRUD API for ClientPostReply.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientPostReplies = require('./clientPostRepliesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-post-replies'               , requireLogin(), clientPostReplies.create); // must login by default

  // - Read
  router.get('/api/client-post-replies'                , requireRole('admin'), clientPostReplies.list);
  // router.get('/api/client-post-replies/search'         , requireLogin(), clientPostReplies.search); //disabled by default
  router.get('/api/client-post-replies/by-:refKey/:refId*'  , requireLogin(), clientPostReplies.listByRefs);
  router.get('/api/client-post-replies/by-:refKey-list'    , requireLogin(), clientPostReplies.listByValues);
  router.get('/api/client-post-replies/default'        , requireLogin(), clientPostReplies.getDefault);
  // router.get('/api/client-post-replies/schema'         , requireRole('admin'), clientPostReplies.getSchema);
  router.get('/api/client-post-replies/:id'            , requireLogin(), clientPostReplies.getById);

  // - Update
  router.put('/api/client-post-replies/:id'            , requireLogin(), clientPostReplies.update); // must login by default

  // - Delete
  router.delete('/api/client-post-replies/:id'         , requireRole('admin'), clientPostReplies.delete); // must be an 'admin' by default

}
