/**
 * CRUD API for Client.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var clients = require('./clientsController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/clients/:clientId/send-reminder'            , requireLogin(), clients.sendReminder);
  router.post('/api/clients/bulk-invite'                        , requireLogin(), clients.bulkInvite);
  router.post('/api/clients/bulk-update'                        , requireLogin(), clients.bulkUpdate); // must login by default
  router.post('/api/clients'                                    , requireLogin(), clients.create); // must login by default
  router.post('/api/clients/existingClient'                     , requireLogin(), clients.createExisting);
  router.post('/api/clients/bulk-notification-update'          , requireLogin(), clients.bulkNotificationUpdate); // must login by default

  // - Read
  router.get('/api/clients'                                     , requireRole('admin'), clients.list);
  router.get('/api/clients/:clientId/send-reminders'            , requireRole('admin'), clients.sendRemindersByClient);
  // router.get('/api/clients/search'         , clients.search); //disabled by default
  
  //mangobilling
  router.get('/api/clients/getClients'                          , requireLogin(), clients.list);
  
  router.get('/api/clients/by-engagement-types/:firmId'            , requireLogin(), clients.getEngagementTypes);
  router.get('/api/clients/by-_user/:userId'                    , requireLogin(), clients.listByUser);
  router.get('/api/clients/by-_clientname/:firmId/:clientname'  , requireLogin(), clients.listByClientname);
  router.get('/api/clients/by-_firm/:firmId'                    , requireLogin(), clients.listByFirm);
  router.get('/api/clients/by-:refKey/:refId*'                  , requireLogin(), clients.listByRefs);
  router.get('/api/clients/by-:refKey-list'                     , requireRole('admin'), clients.listByValues);
  router.get('/api/clients/default'                             , requireLogin(), clients.getDefault);
  // router.get('/api/clients/schema'         , requireRole('admin'), clients.getSchema);
  router.get('/api/clients/search/:id/by-objects'               , requireLogin(), clients.objectSearch);
  router.get('/api/clients/search/:id/by-tags'                  , requireLogin(), clients.tagSearch);

  router.get('/api/clients/:id'                                 , requireLogin(), clients.getById);

  // - Update
  router.put('/api/clients/:id'                                 , requireLogin(), clients.update); // must login by default

  // - Update status only but need to change clientUser also
  router.put('/api/clients/status/:id'                                 , requireLogin(), clients.updateStatus); // must login by default

  // - Update notif of viewed and downloaded to false
  router.get('/api/update-notif/clients', clients.updateNotif);

  // - Delete
  router.delete('/api/clients/:id'                              , requireRole('admin'), clients.delete); // must be an 'admin' by default

 
}
