/**
 * CRUD API for ClientNote.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clientNotes = require('./clientNotesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/client-notes'               , requireLogin(), clientNotes.create); // must login by default

  // - Read
  router.get('/api/client-notes'                , requireRole('admin'), clientNotes.list);
  // router.get('/api/client-notes/search'         , clientNotes.search); //disabled by default
  router.get('/api/client-notes/by-:refKey/:refId*'  , requireLogin(), clientNotes.listByRefs);
  router.get('/api/client-notes/by-:refKey-list'    , requireLogin(), clientNotes.listByValues);
  router.get('/api/client-notes/default'        , requireLogin(), clientNotes.getDefault);
  // router.get('/api/client-notes/schema'         , requireRole('admin'), clientNotes.getSchema);
  router.get('/api/client-notes/:id'            , requireLogin(), clientNotes.getById);

  // - Update
  router.put('/api/client-notes/:id'            , requireLogin(), clientNotes.update); // must login by default

  // - Delete
  router.delete('/api/client-notes/:id'         , requireRole('admin'), clientNotes.delete); // must be an 'admin' by default

}
