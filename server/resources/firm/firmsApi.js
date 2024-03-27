/**
 * CRUD API for Firm.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var firms = require('./firmsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/firms'                                , requireLogin(), firms.create); // must login by default
  router.post('/api/firms/vendorAPIKeys', firms.getFirmAPIKeys);
  router.post('/api/firms/file-search/:id'         , requireLogin(), firms.fileSearch)

  // - Read
  router.get('/api/firms'                                 , requireRole('admin'), firms.list);
  // router.get('/api/firms/search'         , firms.search); //disabled by default
  router.get('/api/firms/by-_user/:userId'                , requireLogin(), firms.listByUser)
  router.get('/api/firms/by-:refKey/:refId*'              , requireRole('admin'), firms.listByRefs);
  router.get('/api/firms/by-:refKey-list'                 , requireRole('admin'), firms.listByValues);
  router.get('/api/firms/default'                         , requireLogin(), firms.getDefault);
  // router.get('/api/firms/schema'         , requireRole('admin'), firms.getSchema);
  // router.get('/api/firms/:id'            , requireLogin(), firms.getById);
  router.get('/api/firms/:firmId/settings'                , requireLogin(), firms.getSettings);
  
  router.get('/api/firms/bulk-send-reminders'             , requireRole('admin'), firms.bulkSendReminders);
  router.post('/api/firms/send-reminders-cron'            , firms.sendAllRemindersCron);

  router.get('/api/firms/:firmId/send-reminders'          , requireRole('admin') , firms.sendRemindersByFirm);

  router.get('/api/firms/:id/signature-templates'         , requireLogin(), firms.getAllAssureSignTemplates); 
  router.get('/api/firms/search/:id/by-objects'           , requireLogin(), firms.objectSearch);
  router.get('/api/firms/search/:id/by-tags'              , requireLogin(), firms.tagSearch);
  router.get('/api/firms/logo/:firmId/:filename'          , firms.downloadLogo);
  router.get('/api/firms/domain'                          , firms.getFirmFromDomain);
  router.get('/api/firms/:id'                             , requireLogin(), firms.getById); 
  /**
   * ^ removed for demo so we can show firm's logo on login page with query params
   * i.e. user/login?firm=563xyz  
   * */ 

  // - Update
  router.put('/api/firms/:id'                             , requireLogin(), firms.update); // must login by default
  router.put('/api/firms/:firmId/settings'                , requireLogin(), firms.updateSettings);

  // - Delete
  router.delete('/api/firms/:id'                          , requireRole('admin'), firms.delete); // must be an 'admin' by default

}
