/**
 * CRUD API for ShareLink.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var signatureController = require('./signatureController');

module.exports = function(router, requireLogin, requireRole) {

  // - Read
  //router.get('/api/signature/:id'                 , requireLogin(), signatureController.getById);
  //router.post('/api/signature/adminSearch'        , requireRole('admin'), signatureController.search);
  router.post('/api/signature/search'             , requireLogin(), signatureController.search);

  // - Delete
  //router.delete('/api/signature/:id'              , requireLogin(), signatureController.delete);
  router.post('/api/signature/bulk-delete'        , requireLogin(), signatureController.bulkDelete);
  router.post('/api/signature/bulk-update-expiry' , requireLogin(), signatureController.bulkUpdateExpiry);

  // - Reminder
  router.get('/api/signature/:id/send-reminder'   , requireLogin(), signatureController.sendReminder);
}
