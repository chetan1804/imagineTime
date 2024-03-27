/**
 * Configure the API routes
 */

let User = require("../../resources/user/UserModel");
let Firm = require("../../resources/firm/FirmModel");
let ShareLinkToken = require("../../resources/shareLinkToken/ShareLinkTokenModel");
let logger = global.logger;

let jwt = require("jsonwebtoken");
let env = (process.env.NODE_ENV = process.env.NODE_ENV || "development");
let config = require("../../config")[env];

let qrcode = require("qrcode");
const permissions = require("../utils/permissions");

// helper functions

function requireLogin() {
  /**
   * Anything that calls this method will check if a user is logged in or not.
   * If so, let them through. If not, block access.
   */

  return function (req, res, next) {
    // check by token
    if (req.headers.token) {
      // header has token. Use it.
      logger.debug("LOGIN CHECK HIT - by token");
      logger.debug(req.headers.token);

      res.status(403);
      res.send({
        success: false,
        message: "UNAUTHORIZED - TOKEN AUTHENTICATION NOT ALLOWED YET",
      });
      return;

      User.findOne({ apiToken: req.headers.token }).exec(function (err, user) {
        if (err || !user) {
          logger.error(err);
          res.status(403);
          res.send({ success: false, message: "UNAUTHORIZED - INVALID TOKEN" });
        } else {
          logger.debug("found user by header");

          // check token time period
          if (User.tokenExpired(user.tokenCreated)) {
            logger.debug("token is expired");
            res.status(403);
            res.send({
              success: false,
              message: "UNAUTHORIZED - TOKEN HAS EXPIRED",
            });
          } else {
            req.user = user;
            logger.debug("REQ.USER 1");
            logger.debug(req.user.username);
            next();
          }
        }
      });
    } else if (req.headers.vendorapitoken) {
      const apiKey = req.headers.vendorapitoken;
      Firm.query()
        .where((builder) => {
          builder.where({
            apiKey: apiKey,
          });
        })
        .first()
        .then(async (firm) => {
          if (!firm) {
            const firm = await permissions.checkSharelinkToken(apiKey);

            if (!firm) {
              res.status(403);
              res.send({
                success: false,
                message: "UNAUTHORIZED - FIRM NOT FOUND",
              });
            } else {
              req.firm = firm;
              next();
            }
          } else {
            req.firm = firm;
            next();
          }
        });
    } else if (req.query.vendorapitoken || req.query.vendorAPIToken) {
      const apiKey = !!req.query.vendorapitoken
        ? req.query.vendorapitoken
        : !!req.query.vendorAPIToken
        ? req.query.vendorAPIToken
        : "";

      console.log("req.query", req.query);
      Firm.query()
        .where((builder) => {
          builder.where({
            apiKey: apiKey,
          });
        })
        .first()
        .then(async (firm) => {
          if (!firm) {
            const firm = await permissions.checkSharelinkToken(apiKey);

            if (!firm) {
              res.status(403);
              res.send({
                success: false,
                message: "UNAUTHORIZED - FIRM NOT FOUND",
              });
            } else {
              req.firm = firm;
              next();
            }
          } else {
            req.firm = firm;
            next();
          }
        })
        .catch((err) => {
          res.status(403);
          res.send({
            success: false,
            message: "UNAUTHORIZED - FIRM NOT FOUND",
          });
        });
    } else if (req.headers.userapitoken) {
      const token = req.headers.userapitoken;

      try {
        const user = jwt.verify(token, config.secrets.sessionSecret);
        delete user.currentDate;
        delete user.iat;
        req.user = user;
        next();
      } catch (err) {
        logger.warn("UNAUTHORIZED");
        //testing
        logger.info("blocked access: " + req.method + " to " + req.url);
        res.status(403);
        res.send({ success: false, message: "UNAUTHORIZED - NOT LOGGED IN" });
      }
    } else {
      // header does NOT have token. Check passport session
      logger.debug("LOGIN CHECK HIT - by cookie");
      // console.log("test: ", req.headers.cookie)
      // check by passport session
      if (!req.isAuthenticated()) {
        logger.warn("UNAUTHORIZED");
        //testing
        logger.info("blocked access: " + req.method + " to " + req.url);
        res.status(403);
        res.send({
          success: false,
          message: "UNAUTHORIZED - NOT LOGGED IN",
        });
      } else {
        req.firm = {};
        next();
      }
    }
  };
}

function requireRole(role) {
  /**
   * Anything that calls this method will check if a user is logged AND has a
   * user role in the user.roles array that matches the passed in 'role' @param.
   * If so, let them through. If not, block access.
   *
   * @param role == string
   */
  return function (req, res, next) {
    var rl = requireLogin();
    rl(req, res, function () {
      logger.debug("trying to require role");
      logger.debug(req.user.username);

      if (role == "admin" && req.user.admin) {
        logger.debug("authorized.");
        next();
      } else {
        res.status(403);
        res.send({
          success: false,
          message: "UNAUTHORIZED - " + role + " PRIVILEDGES REQUIRED",
        });
      }
      // if(req.user.roles.indexOf(role) === -1) {
      //   res.status(403);
      //   res.send({success: false, message: "UNAUTHORIZED - " + role + " PRIVILEDGES REQUIRED"});
      // } else {
      //   logger.debug("authorized.");
      //   next();
      // }
    });
  };
}

// export Yote resource API paths
let routeFilenames = [];
module.exports = function (router) {
  /**
   *
   *
   */
  routeFilenames.forEach(function (filename) {
    logger.debug("filename: " + filename);
    require("../../resources/" + filename)(router, requireLogin, requireRole);
  });
};

// New Yote resource API route names generated by the Yote CLI
routeFilenames.push('user/usersApi');
routeFilenames.push('product/productsApi');
routeFilenames.push('firm/firmsApi');
routeFilenames.push('staff/staffApi');
routeFilenames.push('staffClient/staffClientsApi');
routeFilenames.push('notification/notificationsApi');
routeFilenames.push('activity/activitiesApi');
routeFilenames.push('clientTask/clientTasksApi');
routeFilenames.push('clientTaskResponse/clientTaskResponsesApi');
routeFilenames.push('file/filesApi');
routeFilenames.push('client/clientsApi');
routeFilenames.push('clientUser/clientUsersApi');
routeFilenames.push('note/notesApi');
routeFilenames.push('clientWorkflow/clientWorkflowsApi');
routeFilenames.push('clientWorkflowTemplate/clientWorkflowTemplatesApi');
routeFilenames.push('address/addressesApi');
routeFilenames.push('phoneNumber/phoneNumbersApi');
routeFilenames.push('tag/tagsApi');
routeFilenames.push('subscription/subscriptionsApi');
routeFilenames.push('clientActivity/clientActivitiesApi');
routeFilenames.push('clientNote/clientNotesApi');
routeFilenames.push('clientPost/clientPostsApi');
routeFilenames.push('clientPostReply/clientPostRepliesApi');
routeFilenames.push('shareLink/shareLinksApi');
routeFilenames.push('signature/signatureApi');
routeFilenames.push('clientTaskTemplate/clientTaskTemplatesApi');
routeFilenames.push('quickTask/quickTasksApi');
routeFilenames.push('fileActivity/fileActivityApi');
routeFilenames.push('folder/folderApi');
routeFilenames.push('request/requestsApi');
routeFilenames.push('requestTask/requestTasksApi');
routeFilenames.push('taskActivity/taskActivityApi');
routeFilenames.push('desktopPlugin/desktopPluginApi');
routeFilenames.push('viewdownload/viewDownloadsApi');
routeFilenames.push('folderTemplate/folderTemplatesApi');
routeFilenames.push('integration/integrationAPI');
routeFilenames.push('requestFolder/requestsFolderApi');
routeFilenames.push('clientInvoice/InvoiceApi');
routeFilenames.push('stax/StaxApi');
routeFilenames.push('fileSynchronization/fileSynchronizationApi');
routeFilenames.push('mergeField/mergeFieldsApi');
routeFilenames.push('documentTemplate/documentTemplatesApi');
routeFilenames.push('testQuery/testQueryApi')
routeFilenames.push('folderPermission/folderPermissionApi')
