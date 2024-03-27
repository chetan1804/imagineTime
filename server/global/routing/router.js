/**
 * Configure the application routes
 */

let qrcode = require('qrcode')
let env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
let config = require('../../config')[env];
let permissions = require('../utils/permissions');
let Firm = require('../../resources/firm/FirmModel');

const { jsBundleScripts } = require('../constants');

const brandingName = require('../brandingName.js').brandingName;

module.exports = function(router, app) {

  // require api routes list
  require('./api-router')(router);

  // catch all other api requests and send 404
  router.all('/api/*', function(req, res) {
    res.send(404);
  });

  // render outlook plugin page. pass same variables in case they are needed
  router.get('/outlook', (req, res) => {
    let iframeHost = true;
    if (req.headers.referer) {
      iframeHost = req.headers.referer.includes("outlook") ? true : false;
    }
    res.render('static/layouts/outlook', {
      currentUser: req.user
      , development: app.get('env') == 'development' ? true : false
      , appUrl: config.appUrl
      , iframeHost: iframeHost
      , title: `${brandingName.title} Secure Send`
      , className: brandingName.class
      , titleIcon: brandingName.titleIcon
    });
  });

  // render desktop. pass same variables in case they are needed
  router.get('/desktop', (req, res) => {
    res.render('static/layouts/desktop', {
      currentUser: req.user
      , development: app.get('env') == 'development' ? true : false
      , appUrl: config.appUrl
      , title: `${brandingName.title} Secure Print`
      , className: brandingName.class
      , titleIcon: brandingName.titleIcon
    });
  });

  // render uploadbox. pass same variables in case they are needed
  router.get('/uploadbox', (req, res) => {
    res.render('static/layouts/uploadbox', {
      currentUser: req.user
      , development: app.get('env') == 'development' ? true : false
      , appUrl: config.appUrl
    });
  });
  
  // render layout
  router.get('*', async (req, res) => {

    let arrUrl = req.url ? req.url.split("/") : null; 
    let firmIndex = arrUrl ? arrUrl.indexOf("firm") : -1;
    let firmId = firmIndex > -1 ? arrUrl[firmIndex+1] : null;

    console.log('req.query', req.query)

    const { className } = req.query;

    let firm = "";

    if(!!firmId) {
      firm = await Firm.query().findById(firmId).select(['name']).then(data => data);
    }

    if(req.user &&
      req.user.secret_2fa &&
      req.user.qrcode_2fa) {
        req.user.qrcode_data = await qrcode.toDataURL(req.user.qrcode_2fa)
          .then((data) => {
            if(!data) {
              return '';
            } else {
              return data;
            }
          })
          .catch(err => {
            return '';
          });
      }
    if(req.user) {
      permissions.utilCheckFirmPermission(req.user, firmId, "access", permission => {
        res.render('layout', {
          currentUser: req.user
          , development: app.get('env') == 'development' ? true : false
          , appUrl: config.appUrl
          , staff: permission
          , title: brandingName.title
          , className: brandingName.class
          , titleIcon: brandingName.titleIcon
          , bodyClass: !!className ? className : ''
          , isLexshare: !!(config.appUrl.indexOf('lexshare.io') > -1)
          , scripts: jsBundleScripts[env]
          , user: req.user
          , firm
        });
      });
    } else {
      res.render('layout', {
        currentUser: req.user
        , development: app.get('env') == 'development' ? true : false
        , appUrl: config.appUrl
        , title: brandingName.title
        , className: brandingName.class
        , titleIcon: brandingName.titleIcon
        , bodyClass: !!className ? className : ''
        , isLexshare: !!(config.appUrl.indexOf('lexshare.io') > -1)
        , scripts: jsBundleScripts[env]
        , user: req.user
        , firm
      });
    }
  });
}
