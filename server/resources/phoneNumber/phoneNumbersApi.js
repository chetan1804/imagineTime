/**
 * CRUD API for PhoneNumber.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

var phoneNumbers = require('./phoneNumbersController');

module.exports = function(router, requireLogin, requireRole) {

  // - Create
  router.post('/api/phone-numbers'               , requireLogin(), phoneNumbers.create); // must login by default
  router.post('/api/phone-numbers/list-by-client-ids' , requireLogin(), phoneNumbers.getListByClientIds);
  router.post('/api/phone-numbers/list-by-ids' , requireLogin(), phoneNumbers.getListByIds);

  // - Read
  router.get('/api/phone-numbers'                , requireRole('admin'),  phoneNumbers.list);
  // router.get('/api/phone-numbers/search'         , requireLogin(),  phoneNumbers.search);
  // router.get('/api/phone-numbers/by-_client/:clientId' , requireLogin(), phoneNumbers.listByClient); // TODO: add controller with permission check
  // router.get('/api/phone-numbers/by-_firm/:firmId' , requireLogin(), phoneNumbers.listByFirm); // TODO: add controller with permission check
  // router.get('/api/phone-numbers/by-_user/:userId' , requireLogin(), phoneNumbers.listByUser); // TODO: add controller with permission check
  router.get('/api/phone-numbers/by-_staff/:staffId'   , requireLogin(), phoneNumbers.listByStaff);
  router.get('/api/phone-numbers/by-:refKey/:refId*'  , requireLogin(),  phoneNumbers.listByRefs); // TODO: add requireRole('admin')
  router.get('/api/phone-numbers/by-:refKey-list'    , requireLogin(),  phoneNumbers.listByValues); // TODO: add requireRole('admin')
  router.get('/api/phone-numbers/default'        , requireLogin(),  phoneNumbers.getDefault);
  router.get('/api/phone-numbers/schema'         , requireRole('admin'), phoneNumbers.getSchema);
  router.get('/api/phone-numbers/:id'            , requireLogin(),  phoneNumbers.getById);

  // - Update
  router.put('/api/phone-numbers/:id'            , requireLogin(), phoneNumbers.update); // must login by default

  // - Delete
  router.delete('/api/phone-numbers/:id'         , requireRole('admin'), phoneNumbers.delete); // must be an 'admin' by default

}
