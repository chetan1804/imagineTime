/**
 * CRUD API for Firm.
 *
 * NOTE:
 * to restrict routes to only logged in users, add "requireLogin()"
 * to restrict routes to only admin users, add "requireRole('admin')"
 */

 var testquery = require('./testQueryController');

 module.exports = function(router, requireLogin, requireRole) {

  router.get('/api/customquery', testquery.customQuery);
  router.get('/api/customquery2', testquery.customQuery2);
  router.get('/api/getEnvVariables', testquery.getEnvVariables);
}