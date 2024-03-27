/**
 * CRUD API for ClientNote.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var documentTemplates = require('./documentTemplatesController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/document-templates'                     , requireLogin(), documentTemplates.create); // must login by default
  router.post('/api/document-templates/upload'              , requireLogin(), documentTemplates.upload);
  router.post('/api/document-templates/pdf-upload'              , requireLogin(), documentTemplates.pdfUpload);
  router.post('/api/document-templates/apply'               , requireLogin(), documentTemplates.applyDocumentTemplate);
  
  // - Read
  router.get('/api/document-templates'                      , requireRole('admin'), documentTemplates.list);
  router.get('/api/document-templates/by-:refKey/:refId*'   , requireLogin(), documentTemplates.listByRefs);
  router.get('/api/document-templates/by-:refKey-list'      , requireLogin(), documentTemplates.listByValues);
  router.get('/api/document-templates/default'              , requireLogin(), documentTemplates.getDefault);
  router.get('/api/document-templates/download/:firmId/:templateId/:filename', documentTemplates.downloadTemplate);

  // router.get('/api/document-templates/schema'            , requireRole('admin'), documentTemplates.getSchema);
  router.get('/api/document-templates/:id'                  , requireLogin(), documentTemplates.getById);

  // - Update
  router.put('/api/document-templates/:id'                  , requireLogin(), documentTemplates.update); // must login by default

  // - Delete
  router.delete('/api/document-templates/:id'               , requireRole('admin'), documentTemplates.delete); // must be an 'admin' by default

}
