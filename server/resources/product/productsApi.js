/**
 * CRUD API for Product.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var products = require('./productsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/products'                     ,requireRole('admin'), products.create); // must login by default

  // - Read
  router.get('/api/products'                      ,requireRole('admin'), products.list);
  router.get('/api/products/by-:refKey/:refId*'   ,requireRole('admin'), products.listByRefs);
  router.get('/api/products/by-:refKey-list'      ,requireRole('admin'), products.listByValues);
  router.get('/api/products/search'               ,requireRole('admin'), products.search);
  router.get('/api/products/default'              ,requireRole('admin'), products.getDefault);
  // router.get('/api/products/schema'         , requireRole('admin'), products.getSchema); // NOTE: add if needed
  router.get('/api/products/:id'                  ,requireRole('admin'), products.getById);

  // - Update
  router.put('/api/products/:id'                  ,requireRole('admin'),  products.update); // must login by default

  // - Delete
  router.delete('/api/products/:id'               , requireRole('admin'), products.delete); // must be an 'admin' by default

}
