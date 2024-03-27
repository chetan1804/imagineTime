/**
 * CRUD API for Note.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var notes = require('./notesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/notes'               , requireLogin(), notes.create); // must login by default

  // - Read
  router.get('/api/notes'                    , requireRole('admin'), notes.list);
  router.post('/api/notes/search'            , requireLogin(), notes.search);
  router.get('/api/notes/by-:refKey/:refId*' , requireLogin(), notes.listByRefs);
  router.get('/api/notes/by-:refKey-list'    , requireLogin(), notes.listByValues);
  router.get('/api/notes/default'            , requireLogin(), notes.getDefault);
  // router.get('/api/notes/schema'            , requireRole('admin'), notes.getSchema);
  router.get('/api/notes/:id'                , requireLogin(), notes.getById);

  // - Update
  router.put('/api/notes/:id'                , requireLogin(), notes.update); // must login by default

  // - Delete
  router.delete('/api/notes/:id'             , requireRole('admin'), notes.delete); // must be an 'admin' by default
  router.post('/api/notes/bulk-delete'       , requireLogin(), notes.bulkDelete);

}
