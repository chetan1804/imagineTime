/**
 * CRUD API for ClientNote.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var mergeFields = require('./mergeFieldsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/merge-fields'                     , requireLogin(), mergeFields.create); // must login by default

  // - Read
  router.get('/api/merge-fields'                      , requireRole('admin'), mergeFields.list);
  router.get('/api/merge-fields/by-:refKey/:refId*'   , requireLogin(), mergeFields.listByRefs);
  router.get('/api/merge-fields/by-:refKey-list'      , requireLogin(), mergeFields.listByValues);
  router.get('/api/merge-fields/default'              , requireLogin(), mergeFields.getDefault);
  // router.get('/api/merge-fields/schema'            , requireRole('admin'), mergeFields.getSchema);
  router.get('/api/merge-fields/:id'                  , requireLogin(), mergeFields.getById);

  // - Update
  router.put('/api/merge-fields/:id'                  , requireLogin(), mergeFields.update); // must login by default

  // - Delete
  router.delete('/api/merge-fields/:id'               , requireRole('admin'), mergeFields.delete); // must be an 'admin' by default

}
