/**
 * CRUD API for ClientPost.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientPosts = require('./clientPostsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-posts'               , requireLogin(), clientPosts.create); // must login by default

  // - Read
  router.get('/api/client-posts'                , requireRole('admin'), clientPosts.list);
  router.post('/api/client-posts/search'         , requireLogin(), clientPosts.search);
  router.get('/api/client-posts/by-:refKey/:refId*'  , requireLogin(), clientPosts.listByRefs);
  router.get('/api/client-posts/by-:refKey-list'    , requireLogin(), clientPosts.listByValues);
  router.get('/api/client-posts/default'        , requireLogin(), clientPosts.getDefault);
  // router.get('/api/client-posts/schema'         , requireRole('admin'), clientPosts.getSchema);
  router.get('/api/client-posts/:id'            , requireLogin(), clientPosts.getById);

  // - Update
  router.put('/api/client-posts/:id'            , requireLogin(), clientPosts.update); // must login by default

  // - Delete
  router.delete('/api/client-posts/:id'         , requireRole('admin'), clientPosts.delete); // must be an 'admin' by default

  router.post('/api/client-posts/bulk-delete' , requireLogin(), clientPosts.bulkDelete);
}
