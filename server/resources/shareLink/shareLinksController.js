/**
 * Sever-side controllers for ShareLink.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ShareLink
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ShareLink = require('./ShareLinkModel');
const Client = require('../client/ClientModel');
const ClientNote = require('../clientNote/ClientNoteModel');
const Firm = require('../firm/FirmModel');
const File = require('../file/FileModel');
const QuickTask = require('../quickTask/QuickTaskModel');
const User = require('../user/UserModel');
let logger = global.logger;
let DateTime = require('luxon').DateTime;

const _ = require('lodash');
const async = require('async');
let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

const emailUtil = require('../../global/utils/email');
const CSVUtils = require('../../global/utils/CSVUtils');
const staffCtrl = require('../staff/staffController');
const filesController = require('../file/filesController');
const permissions = require('../../global/utils/permissions.js');
const stringUtils = require('../../global/utils/stringUtils.js');
const quickTasksController = require('../quickTask/quickTasksController');
const firmsController = require('../firm/firmsController');

const { getSearchObject } = require('../searchUtil');
const shareLinkDAO = require('./shareLinkDAO');

// import controller from resource 
const fileActivityCtrl = require('../fileActivity/fileActivityController');
const { brandingName } = require('../../global/brandingName');

const { raw } = require('objection');
const e = require('connect-timeout');

// define "safe" shareLink fields to return to the api
const safeLinkFields = [
  '_id', '_firm', '_client', 'hex'
  , 'authType', 'expireDate'
  , 'created_at', 'updated_at'
]

const safeUserFields = [
  '_id', 'username', 'firstname', 'lastname'
  , '_primaryAddress', '_primaryPhone', 'onBoarded', 'admin'
  , 'created_at', 'updated_at'
  , 'firstLogin'
]

const PLACEHOLDER_SIGNERNAME = '{SignerName}';

exports.utilCheckAndSendEmails = (user, initialObj = {}, finalObj, emailMessage = '', callback = () => { }) => {

  // console.log("shareLink utilCheckAndSendEmails")
  // console.log(initialObj, finalObj)
  // console.log("debug check")
  /**
   * ShareLinks are weird in that non-users can interact with them. This method is called on update so we
   * can catch for things and send emails to people in different situations.
   * 
   * 1. type === 'file-request' && finalObj._files.length > initialObj.files.length
   *    New files were uploaded.
   *    Send an email to shareLink._createdBy.
   *
   * 2. type === 'signature-request' && !initialObj._quickTask && finalObj._quickTask
   *    A new signature request was just created. Kick off SendSignerEmails from here rather than the front end.
   *
   * More: TBD
   */

  // We don't want generic user info. We'll have to deal with it separately in each of the methods below.

  // if(!user) {
  //   // No user, create a generic user for notification emals.
  //   user = {
  //     firstname: "A"
  //     , lastname: "user"
  //   }
  // }
  if (!initialObj) {
    // console.log("debug 0");
    if ((finalObj.type == 'file-request' || finalObj.type == 'share') && finalObj.sentTo && finalObj.sentTo.length > 0) {
      // A file request was just created. Send emails to everyone in the sentTo array.
      exports.utilSendFileRequestEmails(user, finalObj, emailMessage, result => {
        // console.log(result);
        callback(result);
      })
    } else {
      callback([]) // The caller of this function expects an array of email results to be returned. Since no emails were attempted, return an empty array.
    }
  } else if (initialObj.type == "file-request") {
    if (finalObj._files.length > initialObj._files.length) {
      // console.log("debug 1");
      // console.log("Attempting to send file upload emails");
      // 1.
      // create an array of all NEW file ids.
      const newFileIds = finalObj._files.filter(fileId => !initialObj._files.includes(fileId))
      exports.utilSendFileUploadedEmails(user, finalObj, newFileIds, result => {
        // console.log(result);
        callback(result);
      })
    } else {
      console.log('Do nothing.');
      callback([]) // The caller of this function expects an array of email results to be returned. Since no emails were attempted, return an empty array.
    }
  } else if (initialObj.type == "signature-request") {
    if (!initialObj._quickTask && finalObj._quickTask) {
      // console.log("debug 2");
      // console.log("Attempting to send signer emails");
      // 2.
      // a new signature request was just created.
      exports.utilSendSignerEmails(user, finalObj, result => {
        callback(result)
      })
    }
  } else {
    // no need to generate an email
    console.log("end")
    callback([]) // The caller of this function expects an array of email results to be returned. Since no emails were attempted, return an empty array.
  }
}

exports.list = (req, res) => {
  ShareLink.query()
    .then(shareLinks => {
      res.send({ success: true, shareLinks })
    })
}

exports.listByValues = (req, res) => {
  res.send({ success: false, message: "Not implemented for Postgres yet" });
  return;
  /**
   * returns list of shareLinks queried from the array of _id's passed in the query param
   *
   * NOTES:
   * 1) looks like the best syntax for this is, "?id=1234&id=4567&id=91011"
   *    still a GET, and more or less conforms to REST uri's
   *    additionally, node will automatically parse this into a single array via "req.query.id"
   * 2) node default max request headers + uri size is 80kb.
   *    experimentation needed to determie what the max length of a list we can do this way is
   * TODO: server side pagination
   */

  if (!req.query[req.params.refKey]) {
    // make sure the correct query params are included
    res.send({ success: false, message: `Missing query param(s) specified by the ref: ${req.params.refKey}` });
  } else {
    // // as in listByRef below, attempt to query for matching ObjectId keys first. ie, if "user" is passed, look for key "_user" before key "user"
    // ShareLink.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, shareLinks) => {
    //     if(err || !shareLinks) {
    //       res.send({success: false, message: `Error querying for shareLinks by ${["_" + req.params.refKey]} list`, err});
    //     } else if(shareLinks.length == 0) {
    //       ShareLink.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, shareLinks) => {
    //         if(err || !shareLinks) {
    //           res.send({success: false, message: `Error querying for shareLinks by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, shareLinks});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, shareLinks});
    //     }
    // })
    ShareLink.find({ [req.params.refKey]: { $in: [].concat(req.query[req.params.refKey]) } }, (err, shareLinks) => {
      if (err || !shareLinks) {
        res.send({ success: false, message: `Error querying for shareLinks by ${[req.params.refKey]} list`, err });
      } else {
        res.send({ success: true, shareLinks });
      }
    })
  }
}

exports.listByRefs = (req, res) => {
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   * TODO: server side pagination
   */

  // build query
  let query = {
    [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
  }
  // test for optional additional parameters
  const nextParams = req.params['0'];
  if (nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
    res.send({ success: false, message: "Invalid parameter length" });
  } else {
    if (nextParams.length !== 0) {
      for (let i = 1; i < nextParams.split("/").length; i += 2) {
        query[nextParams.split("/")[i]] = nextParams.split("/")[i + 1] === 'null' ? null : nextParams.split("/")[i + 1]
      }
    }
    ShareLink.query()
      .where(query)
      .then(shareLinks => {
        res.send({ success: true, shareLinks })
      })
  }
}

exports.search = (req, res) => {
  //logger.debug("requesting user id: ", req.user._id);
  logger.debug("request body: ", req.body);
  //logger.debug('req.header("Accept")', req.header('Accept'));
  let isAcceptCSV = req.header('Accept') === 'text/csv';

  const searchObj = getSearchObject(req.body);
  logger.debug("firmId: ", searchObj.firmId);
  if (!searchObj.firmId) {
    res.send({ success: false, message: 'firmId is required.' })
    return;
  }
  //staffCtrl.utilGetLoggedInByFirm(100, searchObj.firmId, result => {
  staffCtrl.utilGetLoggedInByFirm(req.user._id, searchObj.firmId, result => {
    if (!result.success) {
      logger.error("Problem fetching logged in staff object. Unable to complete request.")
      res.send(result)
    } else {
      if (isAcceptCSV) {
        searchObj.includeCount = false;
      }
      shareLinkDAO.search(searchObj, isAcceptCSV).then(result => {
        result.list.forEach((item) => {
          item['createdBy'] = stringUtils.concatenate(item.createdByFirstName, item.createdByLastName, ' ', true);

          if (isAcceptCSV) {
            if (!!item.createdDateTime) {
              item.createdDateTime = DateTime.fromMillis(item.createdDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if (!!item.updatedDateTime) {
              item.updatedDateTime = DateTime.fromMillis(item.updatedDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if (!!item.expireDate) {
              item.expireDate = DateTime.fromMillis(item.expireDate.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if (!!item.responseDate) {
              item.responseDate = DateTime.fromMillis(item.responseDate.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }

            delete item.clientId;
            delete item.quickTaskId;
            delete item.taskType;
            delete item.files;
            delete item.createdById;
          }
          delete item.createdByFirstName;
          delete item.createdByLastName;
        });
        if (isAcceptCSV) {
          CSVUtils.toCSV(result.list)
            .then(csv => {
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader("Content-Disposition", 'attachment; filename=SharedLinks.csv');
              res.send(csv);
            })
            .catch(err => {
              logger.debug("Error: ", err);
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader("Content-Disposition", 'attachment; filename=InternalError.csv');
              res.status(500).send(err);
            })
        }
        else {
          res.send({ success: result.success, results: result.list, totalCount: result.totalCount });
        }
      });

    }
  });
}

exports.getById = (req, res) => {
  logger.info('get shareLink by id');
  ShareLink.query().findById(req.params.id)
    .then(shareLink => {
      if (shareLink) {
        res.send({ success: true, shareLink })
      } else {
        res.send({ success: false, message: "Share Link not found" })
      }
    });
}

exports.getByHex = (req, res) => {
  logger.info('get shareLink by hex', req.params.hex);

  ShareLink.query()
    .where({
      hex: req.params.hex
    })
    .first()
    .asCallback((err, shareLink) => {
      if (err) {
        logger.error("Error!", err);
        res.send({ success: false, message: "Share link not found" })
      } else {

        if (shareLink && shareLink._firm) {
          Firm.query().from('firms as f')
            .leftJoin('subscriptions as s', 's._firm', 'f._id')
            .where({ 'f._id': shareLink._firm })
            .whereNot({ 's.status': 'canceled' })
            .select(['f.*', raw('row_to_json(s) as subscription')])
            .groupBy(['f._id', 's._id'])
            .first()
            .asCallback((err, firm) => {
              if (err || !firm) {
                res.send({ success: false, message: 'Permission failed' })
              } else {
                logger.info('Sharelink found. Run through initial auth checks');
                console.log(shareLink);
                if (shareLink && shareLink.expireDate && DateTime.fromISO(shareLink.expireDate) < DateTime.local()) {
                  logger.error("share link expired");
                  /**
                   * NOTE: since the link has expired, we want to remove all the sensitive information 
                   * except the link expiration date, so we can let the user know that it's expired 
                   * should return only 
                   *   _id 
                   *   authType 
                   *   expireDate
                   *   timestamps
                   */
                  delete shareLink['password'] // remove password before returning to the client 
                  delete shareLink['_files'] // not authenticated, so remove files 
                  delete shareLink['_firm'] // not authenticated, remove firm id 
                  delete shareLink['_client'] // not authenticated, remove client id 
                  delete shareLink['_createdBy']
                  delete shareLink['_file'] // TODO: this is dead anyway 
                  res.send({ success: true, shareLink, authenticated: false, message: "Link expired" });
                } else if (shareLink && shareLink.authType && (shareLink.authType === 'none' || (shareLink.authType === 'secret-question' && shareLink.type === "signature-request"))) {
                  logger.info("no auth needed. return sharelink info.")
                  /**
                   * NOTE: Since the link does not require authentication, we can go ahead and return 
                   * all the sensitive ids an populate the corresponding resources.  Still want to remove
                   * the password though.  
                   */
                  delete shareLink['password'] // remove password before returning to the client 
                  exports.utilPopulateShareLink(shareLink, results => {


                    if (results.shareLink && results.shareLink.expireDate) {
                      const slExpireDate = results.shareLink.expireDate
                      let date = new Date(slExpireDate);
                      date.setDate(date.getDate());
                      console.log("date.toISOString();", date.toISOString());
                      results.shareLink.expireDate = date.toISOString();
                    }

                    if (results.shareLink && results.shareLink.client && results.shareLink.client.status === 'deleted') {
                      let date = new Date();
                      date.setDate(date.getDate());
                      results.shareLink.expireDate = date.toISOString();
                      results.authenticated = false;
                    } else if (results.shareLink && results.shareLink && results.shareLink.files && results.shareLink.files.some(item => item.status === 'deleted')) {
                      let files = results.shareLink.files;
                      files = files.filter(item => item.status !== 'deleted');
                      results.shareLink.files = files;
                      results.shareLink._files = files.map(item => item._id);
                    }
                    res.send(results);
                  })
                  // } else if(req.user) {
                  /**
                   * TODO: Add additional non-password authentication checks here.  Such as:
                   *   - is the user a staff member of the firm
                   *   - is the user a clientuser for this client 
                   */
                } else {
                  logger.info('not autheticated. remove sensitive info.')
                  /**
                   * NOTE: since the link is not yet authenticated, remove sensitive information 
                   * should return only 
                   *   _id 
                   *   authType 
                   *   expireDate
                   *   timestamps
                   */
                  delete shareLink['password'] // remove password before returning to the client 
                  delete shareLink['_files'] // not authenticated, so remove files 
                  delete shareLink['_firm'] // not authenticated, remove firm id
                  delete shareLink['_client'] // not authenticated, remove client id
                  delete shareLink['_createdBy']
                  delete shareLink['_file'] // TODO: this is dead anyway 
                  res.send({ success: true, shareLink, authenticated: false })
                }
              }
            })
        } else {
          res.send({ success: false, message: 'Permission failed' })
        }
      }
    });
}

exports.getByHexV2 = (req, res) => {
  // this is only for signature request web app
  logger.info('get shareLink by hex v2', req.params.hex);

  ShareLink.query().from('sharelinks as sharelink')
    .innerJoin('quicktasks as quicktask', 'quicktask._id', 'sharelink._quickTask')
    .innerJoin('firms as firm', 'firm._id', 'sharelink._firm')
    .leftJoin('subscriptions as subscription', 'subscription._firm', 'firm._id')
    .where({ 'sharelink.hex': req.params.hex })
    .whereNot({ 'subscription.status': 'canceled' })
    .select('sharelink.*')
    .select(['sharelink.*'])
    .groupBy(['sharelink._id'])
    .first()
    .asCallback((err, shareLink) => {
      console.log("sharelink", shareLink)
      if (err) {
        logger.error("Error!", err);
        res.send({ success: false, message: "Share link not found" })
      } else {

        if (shareLink && shareLink.expireDate && DateTime.fromISO(shareLink.expireDate) < DateTime.local()) {
          logger.error("share link expired");
          /**
           * NOTE: since the link has expired, we want to remove all the sensitive information 
           * except the link expiration date, so we can let the user know that it's expired 
           * should return only 
           *   _id 
           *   authType 
           *   expireDate
           *   timestamps
           */
          delete shareLink['password'] // remove password before returning to the client 
          delete shareLink['_files'] // not authenticated, so remove files 
          delete shareLink['_firm'] // not authenticated, remove firm id 
          delete shareLink['_client'] // not authenticated, remove client id 
          delete shareLink['_createdBy']
          delete shareLink['_file'] // TODO: this is dead anyway 
          delete shareLink['firm'] // TODO: this is dead anyway 
          delete shareLink['subscription'] // TODO: this is dead anyway 
          res.send({ success: true, shareLink, authenticated: false, message: "Link expired" });
        } else {

          // delete shareLink['password'] // remove password before returning to the client 
          exports.utilPopulateShareLink(shareLink, results => {
            results.authenticated = true;

            // if ((shareLink.authType === 'secret-question' || shareLink.authType === 'individual-auth') && shareLink.type === "signature-request") {
            //   results.authenticated = false;
            // }

            if (results.shareLink && results.shareLink.expireDate) {
              const slExpireDate = results.shareLink.expireDate
              let date = new Date(slExpireDate);
              date.setDate(date.getDate());
              console.log("date.toISOString();", date.toISOString());
              results.shareLink.expireDate = date.toISOString();
            }

            if (results.shareLink && results.shareLink.client && results.shareLink.client.status === 'deleted') {
              let date = new Date();
              date.setDate(date.getDate());
              results.shareLink.expireDate = date.toISOString();
              results.authenticated = false;
            } else if (results.shareLink && results.shareLink && results.shareLink.files && results.shareLink.files.some(item => item.status === 'deleted')) {
              let files = results.shareLink.files;
              files = files.filter(item => item.status !== 'deleted');
              results.shareLink.files = files;
              results.shareLink._files = files.map(item => item._id);
            }

            if (shareLink.authType === 'secret-question') {
              delete shareLink['password']
            } else if (shareLink.authType === 'individual-auth' && results.shareLink && results.shareLink.quickTask && results.shareLink.quickTask.signingLinks) {
              results.shareLink.quickTask.signingLinks.forEach(item => delete item['auth']['password']);
            }
            res.send(results);
          });
        }
      }
    });
}

exports.authByPassword = (req, res) => {
  logger.info('athenticate shareLink by hex', req.params.hex);
  console.log(req.body);
  ShareLink.query().from('sharelinks as sharelink')
    .leftJoin('quicktasks as quicktask', 'quicktask._id', 'sharelink._quickTask')
    .where({
      'sharelink.hex': req.params.hex
    })
    .select(['sharelink.*', raw('row_to_json(quicktask) as quicktask')])
    .groupBy(['sharelink._id', 'quicktask._id'])
    .first()
    .asCallback((err, shareLink) => {
      if (err) {
        logger.error("Error!", err);
        res.send({ success: false, message: "Share link not found" })
      } else if (shareLink.expireDate && DateTime.fromISO(shareLink.expireDate) < DateTime.local()) {
        // needs to respect the expiration too
        logger.error("Found share link but it's expired")
        res.send({ success: false, message: 'No matching share link found. Link may be expired.' })
      } else {
        logger.info('sharelink found')
        logger.info(shareLink, shareLink.quicktask)

        let password = shareLink.password;
        if (shareLink.authType === "individual-auth" && shareLink.quicktask && shareLink.quicktask.signingLinks) {
          const signingLinks = _.cloneDeep(shareLink.quicktask.signingLinks);
          signingLinks.forEach(item => {
            console.log("eyy", item)
            if (item && item.signatoryEmail && req.body.username && req.body.username.toLowerCase() === item.signatoryEmail.toLowerCase()) {
              password = item.auth.password;
            }
          });
        }

        console.log("password", password, req.body);

        if (_.snakeCase(req.body.password) === _.snakeCase(password)) {
          /**
           * NOTE: we want to sanitize the passwords for comparison with lodash. @erik is choosing to use 
           * _.snakeCase() as it lowercases all characters, trims leading & trailing whitespace, and 
           * underscores spaces between words. From lodash docs: 
           * 
           * _.snakeCase('Foo Bar');
           * // => 'foo_bar'
           * 
           * _.snakeCase('fooBar');
           * // => 'foo_bar'
           * 
           * _.snakeCase('--FOO-BAR--');
           * // => 'foo_bar'
           * 
           * This will prevent discrepencies between Q: "What is your spouse's name?" A: "Mary Lou" and "Mary-lou"  
           * */

          logger.info('success');
          exports.utilPopulateShareLink(shareLink, results => {
            console.log(results);
            delete shareLink['quicktask'];
            if (shareLink.authType === 'secret-question') {
              delete shareLink['password']
            } else if (shareLink.authType === 'individual-auth' && results.shareLink && results.shareLink.quickTask && results.shareLink.quickTask.signingLinks) {
              results.shareLink.quickTask.signingLinks.forEach(item => delete item['auth']['password']);
            }
            res.send(results)
          })
        } else {
          logger.error("Error: password does not match");

          // add attempts 
          shareLink.attempt = shareLink.attempt == null ? 1 : shareLink.attempt + 1;
          delete shareLink['uploadName'];

          ShareLink.query()
            .findById(shareLink._id)
            .update(shareLink) //valiation? errors??
            .returning('*') // doesn't do this automatically on an update
            .asCallback((err, updatedShareLink) => {
              logger.error('test', updatedShareLink)

              res.send({ success: false, message: 'Password does not match' });

              // notify the staff that shared link has been locked.
              if(!!updatedShareLink) {
                if ((updatedShareLink && updatedShareLink.attempt) && updatedShareLink.attempt >= 5 && updatedShareLink.type === 'share') {
                  logger.info('Notification for staff that shared link has been locked.');
  
                  async.map(updatedShareLink._files, (fileId, callback) => {
  
                    File.query().findById(fileId)
                      .asCallback((err, file) => {
                        if (err && !file) {
                          callback(null, null);
                        } else {
                          callback(null, file.filename);
                        }
                      });
                  }, (err, filenameList) => {
  
                    // remove null 
                    filenameList = filenameList.filter(filename => filename).join(', ');
  
                    if (filenameList) {
                      User.query().findById(updatedShareLink._createdBy)
                        .asCallback( async (err, user) => {
  
                          if (user) {
                            // (logic from firmsController check domain)
                            let domain = req.hostname; // doesnt include port
                            // usually, we want to ignore the port. but for dev we need to keep it for the checks, sinces its nonstandard
                            const fullhost = req.headers.host; // includes port
                            if (fullhost.includes('localhost') || fullhost.includes('127.0.0.1')) {
                              domain = fullhost;
                            }
                            const messages = `The share link for <strong>[${filenameList}]</strong> has been locked due to an excessive number of authentication attempts.  Please create a new share link to send the files again or contact the recipient.`;
                            const template = 'notification-email';
                            const targets = [user.username];
                            const subject = 'Number of authentication attempts exceeded';
                            const notifContent = `<h4 style="font-weight:500;font-size:1rem;line-height:135%">${messages}</h4><br/>`
                            
                            const fromInfo = await firmsController.getEmailFromInfo(updatedShareLink._firm, user._id);
                            let link = `http://${domain}/firm/${updatedShareLink._firm}/files`;
                            let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
                            const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                             <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                                 <tbody>
                                     <tr>
                                         <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                           <a class="mcnButton " title="View in " href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${title}</a>
                                         </td>
                                     </tr>
                                 </tbody>
                             </table>
                         </td>`;
                            const content = [
                              { name: 'notifLink', content: notifLink }
                              , { name: 'notifContent', content: notifContent }
                              , { name: 'firmLogo', content: '' }
                            ]
                            emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
                              logger.info(data);
                            });
                          }
                        });
                    }
                  });
                }
              }
            });
        }
      }
    });
}

exports.utilPopulateShareLink = (shareLink, utilCallback) => {
  logger.info("populate the client, firm, createdby, quickTask and files for this share link");
  console.log(shareLink);
  /**
   * NOTES: if the share link is authenticated, go ahead and populate the resources 
   * it needs to display things.  Keeps us from having to do multiple round trip/auth 
   * calls 
   */
  async.parallel({
    client: cb => {
      Client.query().findById(shareLink._client).asCallback((err, client) => {
        if (err) {
          cb(err) // NOTE: do we need extra check here for !client?
        } else {
          cb(null, client)
        }
      })
    }
    , createdBy: cb => {
      User.query().findById(shareLink._createdBy).select(safeUserFields).asCallback((err, user) => {
        if (err) {
          cb(err) // NOTE: do we need extra check here for !user?
        } else {
          cb(null, user)
        }
      })
    }
    , firmStaff: cb => {

      User.query().from('users as user')
        .innerJoin('staff', 'staff._user', 'user._id')
        .where({ 'staff._firm': shareLink._firm, 'staff.status': 'active' })
        .select([
          'user._id', 'user.username', 'user.firstname', 'user.lastname'
          , 'user._primaryAddress', 'user._primaryPhone', 'user.onBoarded', 'user.admin'
          , 'user.created_at', 'user.updated_at'
          , 'user.firstLogin'
        ])
        .asCallback((err, firmStaff) => {
          if (err) {
            cb(err) // NOTE: do we need extra check here for !user?
          } else {
            cb(null, firmStaff)
          }
        })
    }
    , firm: cb => {
      Firm.query().findById(shareLink._firm).asCallback((err, firm) => {
        if (err) {
          cb(err) // NOTE: do we need extra check here for !firm?
        } else {
          cb(null, firm)
        }
      })
    }
    , files: cb => {
      let fileIds = shareLink._files;
      File.query()
        .whereIn('_id', fileIds) // needs testing 
        .orderBy('filename', 'asc')
        .asCallback((err, files) => {
          if (err) {
            cb(err) // NOTE: do we need extra check here for !firm?
          } else {
            /**
             * NOTE: I initially had the clientNotes as it's own parallel call but that 
             * caused issues on the frontend with parsing the notes to multiple files.
             * Decided to just handle that load here on the server. 
             */

            const getClientNote = () => {
              async.each(files, (file, eachFileCb) => {
                console.log('check each file for notes')
                ClientNote.query()
                  .where({ '_file': file._id }) // needs testing 
                  .asCallback((err, clientNotes) => {
                    if (err) {
                      eachFileCb(err) // NOTE: do we need extra check here for !firm?
                    } else {
                      console.log('found some notes');
                      console.log(clientNotes);
                      async.each(clientNotes, (clientNote, eachNoteCb) => {
                        User.query().findById(clientNote._user).select(safeUserFields).asCallback((err, user) => {
                          if (err) {
                            eachNoteCb(err) // NOTE: do we need extra check here for !user?
                          } else {
                            clientNote.user = user;
                            eachNoteCb();
                          }
                        })
                      }, err => {
                        if (err) {
                          eachFileCb(err)
                        } else {
                          console.log('done with the notes');
                          file.clientNotes = clientNotes;
                          console.log(file.clientNotes);
                          eachFileCb()
                        }
                      })
                    }
                  })
              }, err => {
                if (err) {
                  cb(err)
                } else {
                  console.log('finished with files');
                  cb(null, files)
                }
              })
            }

            if (files && files.some(item => item.category === "folder") && shareLink.type === "share") {
              const fileIds = files.map(item => item._id);
              filesController.getAllConnectedFileId(fileIds, [], response => {
                if (response && response.length) {
                  File.query()
                    .whereIn('_id', response) // needs testing
                    .orderBy('filename', 'asc')
                    .asCallback((err, newFiles) => {
                      if (err) {
                        getClientNote();
                      } else {
                        newFiles.forEach(item => {
                          if (fileIds.includes(item._id)) {
                            item.root = true;
                          }
                        })
                        files = newFiles;
                        getClientNote();
                      }
                    });
                } else {
                  getClientNote();
                }
              });
            } else {
              getClientNote();
            }
          }
        })
    }
    , quickTask: cb => {
      QuickTask.query().findById(shareLink._quickTask).asCallback((err, quickTask) => {
        if (err) {
          cb(err)
        } else {
          cb(null, quickTask)
        }
      })
    }
  }, (err, results) => {
    if (err) {
      utilCallback({ success: false, message: "error populating resources", authenticated: false })
    } else {
      shareLink.client = results.client
      shareLink.firm = results.firm
      shareLink.files = results.files
      shareLink.createdBy = results.createdBy;
      shareLink.quickTask = results.quickTask;
      shareLink.firmStaff = results.firmStaff;

      utilCallback({ success: true, shareLink, authenticated: true })
    }
  })
}

exports.downloadFile = (req, res) => {
  // allow downloading files from the sharelinks controller, in order to not expose the files controller without login

  ShareLink.query()
    .where({
      hex: req.params.hex
    })
    .first()
    .asCallback((err, shareLink) => {
      if (err || !shareLink) {
        logger.error("Error!", err);
        console.log("Error1", err);
        res.send({ success: false, message: "Matching share link not found. 0xA." })
      } else {
        File.query().findOne({
          filename: req.params.filename
          , _id: parseInt(req.params.fileId)
        })
          .asCallback((err, file) => {
            if (err || !file) {
              console.log("Error2", err);
              res.send({ success: false, message: "Matching share link not found. 0xB." })
            } else {
              // TODO: auth! figure out how to authenticate this link. might require passing in the password again somehow. 
              // make sure file is included in the share link too

              // temporary
              filesController.utilDownloadFile(req, file, res);

              // if(shareLink._files && shareLink._files.includes(file._id)) {
              //   filesController.utilDownloadFile(req, file, res);
              // } else {
              //   if(req.query && req.query.type == 'signature') {
              //     filesController.utilDownloadFile(req, file, res);
              //   } else {
              //     res.send({success: false, message: "Matching share link not found. 0xC."})
              //   }
              // }
            }
          })
      }
    })
}

exports.uploadFiles = (req, res) => {
  // allow uploading files from the sharelinks controller
  ShareLink.query()
    .where({
      hex: req.params.hex
    })
    .first()
    .asCallback((err, shareLink) => {
      if (err || !shareLink) {
        logger.error("Error!", err);
        res.send({ success: false, message: "Matching share link not found. 0xA." })
      } else {
        logger.info('found share link.')

        filesController.utilCreateFile(req, res, result => {
          if (result && result.success && result.files) {
            res.send({ success: true, files: [] });
            let fileIds = result.files.map(file => file._id);
            req.body.fileRequestReceivers = result.fileRequestReceivers;

            if (shareLink && shareLink._quickTask) {
              quickTasksController.updateReturnedFiles(req, shareLink._quickTask, fileIds);
            } else {
              if (shareLink._files && shareLink._files.length) {
                fileIds = fileIds.concat(shareLink._files);
              }
              shareLink._files = fileIds;
              if (req.user && req.user._id) {
                exports.utilUpdate(req.user, shareLink._id, shareLink, true, result => {
                  console.log(result);
                });
              } else {
                exports.utilUpdate(null, shareLink._id, shareLink, true, result => {
                  console.log(result);
                });
              }
            }
          } else {
            res.send({ success: false, message: result && result.message || "Error upload file" })
          }
        });
      }
    })
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get shareLink schema ');
  res.send({ success: true, schema: ShareLink.jsonSchema });
}

exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get shareLink default object');
  res.send({ success: true, defaultObj: ShareLink.defaultObject });
  // res.send({success: false})
}

exports.update = (req, res) => {
  logger.info('updating shareLink');

  const shareLinkId = parseInt(req.params.id) // has to be an int
  logger.info('shareLinkId', shareLinkId);

  ShareLink.query()
    .findById(shareLinkId)
    .asCallback((err, oldShareLink) => {
      if (err || !oldShareLink) {
        logger.error('ERROR: ')
        logger.info(err || "Could not find ShareLink")
        res.send({ success: false, message: err || "Could not find ShareLink" })
      } else {
        console.log('found oldShareLink');
        let shareLink = req.body;
        exports.utilUpdate(req.user, shareLinkId, shareLink, null, result => {
          res.send(result)
        })
      }
    })
}

exports.updateSharefiles = (req, res) => {
  const { _createdBy, _firm } = req.body;
  if (req.user && req.user._id === _createdBy) {
    const shareLinkId = parseInt(req.params.id) // has to be an int
    const newShareLink = {
      _files: req.body._files
    }
    ShareLink.query()
      .findById(shareLinkId)
      .update(newShareLink)
      .returning("*")
      .asCallback((err, shareLink) => {
        if (err || !shareLink) {
          logger.error('ERROR: ')
          logger.info(err || "Could not find ShareLink")
          res.send({ success: false, message: err || "Could not find ShareLink" })
        } else {
          console.log('found oldShareLink');
          res.send({ success: true, shareLink });
        }
      })
  } else if (req.firm && req.firm._id && (req.firm._id == _firm)) {
    const shareLinkId = parseInt(req.params.id) // has to be an int
    const newShareLink = {
      _files: req.body._files
    }
    ShareLink.query()
      .findById(shareLinkId)
      .update(newShareLink)
      .returning("*")
      .asCallback((err, shareLink) => {
        if (err || !shareLink) {
          logger.error('ERROR: ')
          logger.info(err || "Could not find ShareLink")
          res.send({ success: false, message: err || "Could not find ShareLink" })
        } else {
          console.log('found oldShareLink');
          res.send({ success: true, shareLink });
        }
      })
  } else {
    res.send({ success: false, message: "UNAUTHORIZED - Permission failed" })
  }
}

exports.utilUpdate = (user, shareLinkId, shareLink, sendEmails, callback) => {
  // NOTE: since this shareLink has been populated we'll have to delete the keys that don't belong on the model.
  // console.log('About to update shareLink', shareLink);
  delete shareLink['client']
  delete shareLink['createdBy']
  delete shareLink['files']
  delete shareLink['firm']
  delete shareLink['fromOutlook']
  delete shareLink['quickTask']
  delete shareLink['emailResults']
  shareLink.sentTo = JSON.stringify(shareLink.sentTo)

  ShareLink.query()
    .findById(shareLinkId)
    .asCallback((err, oldShareLink) => {
      if (err || !oldShareLink) {
        logger.error('ERROR: ')
        logger.info(err || "Could not find ShareLink")
        callback({ success: false, message: err || "Could not find ShareLink" })
      } else {
        delete shareLink['uploadName'];

        console.log('shareLink params', shareLink);
        ShareLink.query()
          .findById(shareLinkId)
          .update(shareLink) //valiation? errors??
          .returning('*') // doesn't do this automatically on an update
          .asCallback((err, updatedShareLink) => {
            if (err || !updatedShareLink) {
              logger.error("ERROR: ")
              logger.info("Could not update ShareLink", err)
              callback({ success: false, message: err || "Could not update ShareLink" })
            } else {
              logger.info("shareLink updated")
              if (sendEmails) {
                logger.info("Check and send emails")
                exports.utilCheckAndSendEmails(user, oldShareLink, updatedShareLink, null, emailResults => {
                  // console.log("oldShareLink", oldShareLink);
                  // console.log("updatedShareLink", updatedShareLink)
                  logger.info('emailResults', emailResults)
                  updatedShareLink.emailResults = emailResults
                  callback({ success: true, shareLink: updatedShareLink })
                });
              } else {
                logger.info('No emails to send.')
                callback({ success: true, shareLink: updatedShareLink })
              }
            }
          })
      }
    })

}

exports.delete = (req, res) => {
  logger.warn("deleting shareLink");

  // TODO: needs testing and updating
  const shareLinkId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM shareLinks WHERE id = ' + shareLinkId + ';'

  console.log(query);
  db.query(query, (err, result) => {
    if (err) {
      console.log("ERROR")
      console.log(err);
      res.send({ success: false, message: err });
    } else {
      res.send({ success: true })
    }
  })
}

exports.utilSendFileRequestEmails1 = (sender, shareLink, emailMessage, callback) => {
  // get the firm so we can populate the firm logo in the email.
  Firm.query().findById(shareLink._firm)
    .asCallback(async (err, firm) => {
      if (err || !firm) {
        logger.error('ERROR ', err || 'Firm not found')
      } else {
        // set custom url, if applicable
        let firmUrl = appUrl;

        if (firm && firm.domain) {
          firmUrl = firm.domain;
        }
        let firmLogo;
        if (firm.logoUrl) {
          firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
        }
        logger.debug("creating shareLink file request notification email");
        const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';

        const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
        let targets = shareLink.sentTo.map(user => user.email)
        // console.log('targets', targets);
        let link = shareLink.url;

        // We should always have a user since login is required when creating a file request. But we'll do this just in case.
        if (!sender) {
          sender = {
            firstname: 'A'
            , lastname: 'User'
          }
        }
        const typeText = shareLink.type === 'share' ? 'shared' : 'requested';

        const subject = `${sender.firstname} ${sender.lastname} ${typeText} files`;
        let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
        let notifContent = `<h1 style="text-align: center;">${sender.firstname} ${sender.lastname} ${typeText} files</h1>`
        notifContent += emailMessage ?
          `<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnBoxedTextBlock" style="min-width:100%;">
           <!--[if gte mso 9]>
             <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%">
           <![endif]-->
             <tbody class="mcnBoxedTextBlockOuter">
               <tr>
                 <td valign="top" class="mcnBoxedTextBlockInner">          
                 <!--[if gte mso 9]>
                   <td align="center" valign="top" ">
                 <![endif]-->
                   <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnBoxedTextContentContainer">
                     <tbody>
                       <tr>
                         <td style="padding-top:9px; padding-left:18px; padding-bottom:9px; padding-right:18px;">
                           <table border="0" cellspacing="0" class="mcnTextContentContainer" width="100%" style="min-width: 100% !important;background-color: #FFD56A;border: 2px solid #F9B915;">
                             <tbody>
                               <tr>
                                 <td valign="top" class="mcnTextContent" style="padding: 18px;color: #000000;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;">
                                   ${emailMessage}
                                 </td>
                               </tr>
                             </tbody>
                           </table>
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 <!--[if gte mso 9]>
                   </td>
                 <![endif]-->        
                 <!--[if gte mso 9]>
                     </tr>
                   </table>
                 <![endif]-->
               </td>
             </tr>
           </tbody>
         </table>`
          :
          ''
        const buttonText = shareLink.type === 'share' ? 'View File Share' : 'View File Request';
        const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                           <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                               <tbody>
                                   <tr>
                                       <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                         <a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">  ${buttonText} </a>
                                       </td>
                                   </tr>
                               </tbody>
                           </table>
                         </td>`
        const content = [
          { name: 'notifLink', content: notifLink }
          , { name: 'notifContent', content: notifContent }
        ]
        // If there is a firm logo add it to the content array.
        if (firmLogo) {
          content.push({
            name: 'firmLogo', content: firmLogo
          })
        }
        emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
          callback(data.result)
          logger.info(data);
        });
      }
    });
}

exports.bulkDelete = (req, res) => {
  const shareLinkIds = req.body;
  logger.debug('bulk delete shareLink ids=', shareLinkIds);

  async.map(shareLinkIds,
    (shareLinkId, callback) => {
      deleteShareLink(shareLinkId, req.user._id, result => {
        if (result.success) {
          return callback(null, { id: shareLinkId, message: '' });
        }
        else {
          return callback(null, { id: shareLinkId, message: result.message });
        }
      });
    },
    (err, list) => {
      logger.debug('success sharelink bulk delete', err, list);
      if (err) {
        res.send({ success: false, message: err });
      }
      else {
        let errors = list.filter(item => {
          return (!!item.message);
        });
        res.send({ success: (!errors || errors.length < 1), data: list });
        return;
      }
    }
  );
}

const deleteShareLink = (shareLinkId, loggedInUserId, callback) => {
  logger.debug('delete shareLink id=', shareLinkId);
  ShareLink.query()
    .where({ _id: shareLinkId })
    .then(shareLinks => {
      if (shareLinks) {
        staffCtrl.utilGetLoggedInByFirm(loggedInUserId, shareLinks[0]._firm, staffResult => {
          if (!staffResult.success) {
            logger.error("Permission issues: Logged in user[id: " + loggedInUserId + "] is not from the same firm[id: " + shareLinks[0]._firm + "].")
            return callback({ success: false, message: 'You do not have permission to delete this link.' })
          } else {
            shareLinkDAO.delete(shareLinks[0], deleteResult => {
              sendShareLinkDeletedEmail(deleteResult.data.quickTask, shareLinks[0], emailResult => {
                logger.info(emailResult);
              });
              return callback(deleteResult);
            });
          }
        });
      } else {
        return callback({ success: false, message: 'Invalid link' })
      }
    });

}

function sendShareLinkDeletedEmail(quickTask, shareLink, callback) {
  const subject = 'Shared link deleted';
  const message = `Hi ${PLACEHOLDER_SIGNERNAME},<br/><br/>A shared link has been deleted.`;
  sendEmail(subject, message, quickTask, shareLink, false, data => {
    callback(data);
  });
}

async function sendEmail(subject, messageTemplate, quickTask, shareLink, includeLink, callback) {
  if (!quickTask) {
    return callback({ success: false, message: "No QuickTask." });
  }

  if (!quickTask.signingLinks || !_.isArray(quickTask.signingLinks) || quickTask.signingLinks.length < 1) {
    return callback({ success: false, message: "No signing links." });
  }

  const template = 'notification-email';
  const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
  quickTask.signingLinks.forEach(signingLink => {
    if (signingLink.signatoryEmail) {
      const targets = [signingLink.signatoryEmail];
      logger.debug('Email to be sent to ', signingLink.signerName, signingLink.signatoryEmail);
      let message = _.replace(messageTemplate, PLACEHOLDER_SIGNERNAME, signingLink.signerName);
      const notifContent = `<h4 style="font-weight:500;font-size:1rem;line-height:135%">${message}</h4><br/>`

      let link = '';
      let notifLink = ''

      const content = [
        { name: 'notifLink', content: notifLink }
        , { name: 'notifContent', content: notifContent }
        , { name: 'firmLogo', content: '' }
      ]
      if (targets && targets.length > 0) {
        emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
          return callback(data);
        });
      }
    }
  });
}

exports.delete = (req, res) => {
  logger.warn("deleting shareLink");

  // TODO: needs testing and updating
  const shareLinkId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM shareLinks WHERE id = ' + shareLinkId + ';'

  console.log(query);
  db.query(query, (err, result) => {
    if (err) {
      console.log("ERROR")
      console.log(err);
      res.send({ success: false, message: err });
    } else {
      res.send({ success: true })
    }
  })
}


exports.utilSendFileUploadedEmails = (sender, shareLink, newFileIds, cb) => {
  File.query()
    .whereIn('_id', newFileIds) // needs testing
    .asCallback((err, files) => {
      if (err || !files) {
        cb({ success: false, message: err || 'Could not find files, no emails sent' })
      } else {
        // We have the files, now we need the firm
        Firm.query().findById(shareLink._firm)
          .asCallback( async (err, firm) => {
            if (err || !firm) {
              cb({ success: false, message: err || 'Could not find firm, no emails sent' })
            } else {
              // set custom url, if applicable
              let firmUrl = appUrl;

              if (firm && firm.domain) {
                firmUrl = firm.domain;
              }
              let firmLogo;
              if (firm.logoUrl) {
                firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
              }
              logger.debug("creating shareLink file upload notification email");
              const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
              //const subject = 'New Activity in ImagineTime';
              const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
              let uploadName = '';
              if (!sender) {
                // No sender means that a user that was not logged in uploaded these files. We'll need to grab the uploadName
                // from one of the files. Since the file or files in question were all uploaded at the same time, the uploadName
                // should match on all of them so we can just grab it from the first one.
                uploadName = files[0].uploadName || "A user"
              }
              let fromUser = uploadName ? `(${uploadName})` : sender ? `${sender.firstname} ${sender.lastname}` : 'An unidentified user'
              const subject = `${fromUser} uploaded ${newFileIds.length === 1 ? 'a file' : 'some files'}`;
              let notifContent = `<h1 style="text-align: center;">${fromUser} uploaded ${newFileIds.length === 1 ? 'a file' : 'some files'}</h1>`
              let notifLink = ``
              let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
              // Create a link to each file.
              files.forEach(file => {
                const fileLink = file._client ? `http://${firmUrl}/firm/${firm._id}/workspaces/${file._client}/files/${file._id}` : `http://${firmUrl}/firm/${firm._id}/files/public/${file._id}`
                // notifLink += `
                // <tr>
                //   <td style="padding-left: 18px;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: center;">
                //     <a href="${fileLink}"><p> ${file.filename} </p>
                //     </a>
                //   </td>
                // <tr>`

                notifLink += `<tr style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                 <table class="mcnButtonContentContainer" style="min-width: 300px; max-width: 300px; margin-bottom: 16px; border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                     <tbody>
                       <tr>
                         <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                           <a class="mcnButton " title="View in ${title}" href=${fileLink} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View ${file.filename}</a>
                         </td>
                       </tr>
                     </tbody>
                 </table>
             </tr>`;
              })



              const content = [
                { name: 'notifLink', content: notifLink }
                , { name: 'notifContent', content: notifContent }
              ]
              // If there is a firm logo add it to the content array.
              if (firmLogo) {
                content.push({
                  name: 'firmLogo', content: firmLogo
                })
              }
              if (!shareLink._client) {
                // No client id present, only send an email to shareLink._createdBy
                User.query().findById(shareLink._createdBy)
                  .asCallback((err, user) => {
                    if (err || !user) {
                      cb({ success: false, message: err || "Could not find shareLink creator. No emails sent" })
                    } else if (user.sendNotifEmails) {
                      let targets = [user.username];
                      emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
                        logger.info(data);
                        cb(data.result)
                      });
                    } else {
                      cb({ success: true, message: "This user does not want emails. No email sent." })
                    }
                  })
              } else {
                cb({ success: false, message: 'This shareLink is associated with a client. Update the quickTask instead.' })
                // NOTE: This should never happen. If a clientId is present we should have added the files to the quickTask instead of the shareLink.
                // Client id is present, send to shareLink._createdBy AND all staffClients.
                // staffClientsCtrl.utilGetByClientId(shareLink._client, (err, staffClients) => {
                //   if(err || !staffClients) {
                //     cb({ success: false, message: err || "Could not find staffClients. No emails sent."})
                //   } else {
                //     let userIds = staffClients.map(staffClient => staffClient._user)
                //     userIds.push(shareLink._createdBy)
                //     User.query()
                //     .whereIn('_id', userIds) // needs testing
                //     .asCallback((err, users) => {
                //       if(err || !users) {
                //         cb({ success: false, message: err || 'Could not find users, no emails sent'})
                //       } else {
                //         let targets = users.map(user => user.username)
                //         console.log('targets', targets);
                //         emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
                //           logger.info(data);
                //           cb(data.result)
                //         });
                //       }
                //     });
                //   }
                // });
              }
            }
          });
      }
    });
}

exports.utilSendUnsignedSignerEmail = (shareLink, signer, callback) => {
  const { _firm, url } = shareLink
  Firm.query().findById(_firm)
    .asCallback(async (err, firm) => {
      if (err || !firm) {
        logger.error('ERROR ', err || 'Firm not found')
      } else {
        // set custom url, if applicable
        let firmUrl = appUrl;

        if (firm && firm.domain) {
          firmUrl = firm.domain;
        }
        let firmLogo;
        if (firm.logoUrl) {
          firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
        }
        logger.debug("creating shareLink signature notification email");
        const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';

        const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
        const target = [signer.signatoryEmail];

        let notifLink = ''

        // let instructions = `Please sign the attached document. Thank you.`;
        let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
        notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                             <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                               <tbody>
                                   <tr>
                                       <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                         <a class="mcnButton " title="View in ${title}" href=${url} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${title}</a>
                                       </td>
                                   </tr>
                               </tbody>
                           </table>
                         </td>`

        const subject = `Notice!`;

        let notifContent = `<h1 style="text-align: center;">Please sign the attached document. Thank you.</h1>`

        const content = [
          { name: 'notifLink', content: notifLink }
          , { name: 'notifContent', content: notifContent }
        ]
        // If there is a firm logo add it to the content array.
        if (firmLogo) {
          content.push({
            name: 'firmLogo', content: firmLogo
          })
        }
        emailUtil.sendEmailTemplate(target, subject, template, content, null, null, fromInfo, data => {
          callback(data.result)
          logger.info(data);
        });
      }
    });
}

//  exports.utilPopulateShareLink = (shareLink, utilCallback) => {
//    logger.info("populate the client, firm, createdby, quickTask and files for this share link");
//    console.log(shareLink);
//    /**
//     * NOTES: if the share link is authenticated, go ahead and populate the resources 
//     * it needs to display things.  Keeps us from having to do multiple round trip/auth 
//     * calls 
//     */
//    async.parallel({
//      client: cb => {
//        Client.query().findById(shareLink._client).asCallback((err, client) => {
//          if(err) {
//            cb(err) // NOTE: do we need extra check here for !client?
//          } else {
//            cb(null, client)
//          }
//        })
//      }
//      , createdBy: cb => {
//        User.query().findById(shareLink._createdBy).select(safeUserFields).asCallback((err, user) => {
//          if(err) {
//            cb(err) // NOTE: do we need extra check here for !user?
//          } else {
//            cb(null, user)
//          }
//        })
//      }
//      , firm: cb => {
//        Firm.query().findById(shareLink._firm).asCallback((err, firm) => {
//          if(err) {
//            cb(err) // NOTE: do we need extra check here for !firm?
//          } else {
//            cb(null, firm)
//          }
//        })
//      }
//      , files: cb => {
//        let fileIds = shareLink._files;
//        File.query()
//          .whereIn('_id', fileIds) // needs testing 
//          .orderBy('filename', 'asc')
//          .asCallback((err, files) => {
//            if(err) {
//              cb(err) // NOTE: do we need extra check here for !firm?
//            } else {
//              /**
//               * NOTE: I initially had the clientNotes as it's own parallel call but that 
//               * caused issues on the frontend with parsing the notes to multiple files.
//               * Decided to just handle that load here on the server. 
//               */

//              const getClientNote = () => {
//                async.each(files, (file, eachFileCb) => {
//                  console.log('check each file for notes')
//                  ClientNote.query()
//                    .where({'_file': file._id}) // needs testing 
//                    .asCallback((err, clientNotes) => {
//                      if(err) {
//                        eachFileCb(err) // NOTE: do we need extra check here for !firm?
//                      } else {
//                        console.log('found some notes');
//                        console.log(clientNotes);
//                        async.each(clientNotes, (clientNote, eachNoteCb) => {
//                          User.query().findById(clientNote._user).select(safeUserFields).asCallback((err, user) => {
//                            if(err) {
//                              eachNoteCb(err) // NOTE: do we need extra check here for !user?
//                            } else {
//                              clientNote.user = user;
//                              eachNoteCb();
//                            }
//                          })
//                        }, err => {
//                          if(err) {
//                            eachFileCb(err)
//                          } else {
//                            console.log('done with the notes');
//                            file.clientNotes = clientNotes;
//                            console.log(file.clientNotes);
//                            eachFileCb()
//                          }
//                        })
//                      }
//                  })
//                }, err => {
//                  if(err) {
//                    cb(err)
//                  } else {
//                    console.log('finished with files');
//                    cb(null, files)
//                  }
//                })
//              }

//              if (files && files.some(item => item.category === "folder") && shareLink.type === "share") {
//                const fileIds = files.map(item => item._id);
//                filesController.getAllConnectedFileId(fileIds, [], response => {
//                  if (response && response.length) {
//                    File.query()
//                    .whereIn('_id', response) // needs testing
//                    .orderBy('filename', 'asc')
//                    .asCallback((err, newFiles) => {
//                      if (err) {
//                        getClientNote();
//                      } else {
//                        newFiles.forEach(item => {
//                          if (fileIds.includes(item._id)) {
//                            item.root = true;
//                          }
//                        })
//                        files = newFiles;
//                        getClientNote();
//                      }
//                    });
//                  } else {
//                    getClientNote();
//                  }                
//                });
//              } else {
//                getClientNote();
//              }
//            }
//        })
//      }
//      , quickTask: cb => {
//        QuickTask.query().findById(shareLink._quickTask).asCallback((err, quickTask) => {
//          if(err) {
//            cb(err)
//          } else {
//            cb(null, quickTask)
//          }
//        })
//      }
//    }, (err, results) => {
//      if(err) {
//        utilCallback({success: false, message: "error populating resources", authenticated: false})
//      } else {
//        shareLink.client = results.client 
//        shareLink.firm = results.firm 
//        shareLink.files = results.files 
//        shareLink.createdBy = results.createdBy;
//        shareLink.quickTask = results.quickTask;

//        utilCallback({success: true, shareLink, authenticated: true})
//      }
//    })
//  }

exports.downloadFile = (req, res) => {
  // allow downloading files from the sharelinks controller, in order to not expose the files controller without login

  ShareLink.query()
    .where({
      hex: req.params.hex
    })
    .first()
    .asCallback((err, shareLink) => {
      if (err || !shareLink) {
        logger.error("Error!", err);
        console.log("Error1", err);
        res.send({ success: false, message: "Matching share link not found. 0xA." })
      } else {
        File.query().findOne({
          filename: req.params.filename
          , _id: parseInt(req.params.fileId)
        })
          .asCallback((err, file) => {
            if (err || !file) {
              console.log("Error2", err);
              res.send({ success: false, message: "Matching share link not found. 0xB." })
            } else {
              // TODO: auth! figure out how to authenticate this link. might require passing in the password again somehow. 
              // make sure file is included in the share link too

              // temporary
              filesController.utilDownloadFile(req, file, res);

              // if(shareLink._files && shareLink._files.includes(file._id)) {
              //   filesController.utilDownloadFile(req, file, res);
              // } else {
              //   if(req.query && req.query.type == 'signature') {
              //     filesController.utilDownloadFile(req, file, res);
              //   } else {
              //     res.send({success: false, message: "Matching share link not found. 0xC."})
              //   }
              // }
            }
          })
      }
    })
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get shareLink schema ');
  res.send({ success: true, schema: ShareLink.jsonSchema });
}

exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get shareLink default object');
  res.send({ success: true, defaultObj: ShareLink.defaultObject });
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new shareLink');
  // permissions.utilCheckFirmPermission(req.user, req.body._firm, "access", permission => {
  //   if(!permission) {
  //     res.send({success: false, message: "You do not have the necessary permissions"});
  //   } else {
  //   }
  // });
  const emailMessage = req.body.emailMessage;
  let newShareLink = req.body;
  delete newShareLink.emailMessage

  // console.log('emailMessage',  emailMessage);
  newShareLink.sentTo = JSON.stringify(newShareLink.sentTo)
  newShareLink._createdBy = req.user && req.user._id ? req.user._id : !!req.body._createdBy ? req.body._createdBy : null;

  const hex = Math.floor(Math.random() * 16777215).toString(16)
    + Math.floor(Math.random() * 16777215).toString(16) // we can make this bigger if needed?
    + Math.floor(Math.random() * 16777215).toString(16) // we can make this bigger if needed?
    + Math.floor(Math.random() * 16777215).toString(16); // we can make this bigger if needed?

  // find firm and set custom url, if applicable.
  let firmUrl = appUrl; // default
  // NOTE that this should be required in the (near) future
  Firm.query().findById(newShareLink._firm)
    .asCallback((err, firm) => {
      if (err || !firm) {
        // no change to url, but we might want to fail the creation here in the future
        //const errorStr = `Error code ${err.code} - ${err.message}`;
        res.send({ success: false, message: 'Firm not found' });
        return;
      } else if (firm && firm.domain) {
        firmUrl = firm.domain;
      }

      // now create share link
      newShareLink.hex = hex;
      newShareLink.url = newShareLink.type === 'file-request' ? `https://${firmUrl}/request/file/${hex}` : newShareLink.type === 'signature-request' ? `https://${firmUrl}/request/signature/${hex}` : `https://${firmUrl}/share/${hex}`;

      ShareLink.query().insert(newShareLink)
        .returning('*')
        .then(shareLink => {
          if (!shareLink) {
            logger.error("ERROR: ", err)
            console.log("error", err);
            res.send({ success: false, message: err.message })
          } else {

            // file activity shared
            if (shareLink._files && shareLink._files.length && shareLink.type === "share") {
              async.each(shareLink._files, (fileId, callback) => {
                // file activity
                fileActivityCtrl.utilCreateFromResource(
                  req
                  , fileId, shareLink._firm, shareLink._client, req.user ? req.user._id : null
                  , "visible"
                  , `Shared by %USER%`
                  , "" // shareLink.url
                  , "" // shareLink.url
                );
                callback(fileId)
              })
            }

            exports.utilCheckAndSendEmails(req.user, null, shareLink, emailMessage, emailResults => {
              // console.log("oldShareLink", oldShareLink);
              // console.log("updatedShareLink", updatedShareLink)

              shareLink.emailResults = emailResults
              if (shareLink && shareLink.integer) delete shareLink['integer']

              console.log("emailResults", emailResults)
              console.log("shareLink", shareLink);

              res.send({ success: true, shareLink: shareLink })
            });
          }
        })
        .catch(err => {
          console.log('error', err);
          const errorStr = `Error code ${err.code} - ${err.message}`;
          res.send({ success: false, message: errorStr });
        })
    });
}

exports.update = (req, res) => {
  logger.info('updating shareLink');

  const shareLinkId = parseInt(req.params.id) // has to be an int
  logger.info('shareLinkId', shareLinkId);

  ShareLink.query()
    .findById(shareLinkId)
    .asCallback((err, oldShareLink) => {
      if (err || !oldShareLink) {
        logger.error('ERROR: ')
        logger.info(err || "Could not find ShareLink")
        res.send({ success: false, message: err || "Could not find ShareLink" })
      } else {
        console.log('found oldShareLink');
        let shareLink = req.body;
        exports.utilUpdate(req.user, shareLinkId, shareLink, null, result => {
          res.send(result)
        })
      }
    })
}

exports.updateSharefiles = (req, res) => {
  const { _createdBy, _firm } = req.body;
  if (req.user && req.user._id === _createdBy) {
    const shareLinkId = parseInt(req.params.id) // has to be an int
    const newShareLink = {
      _files: req.body._files
    }
    ShareLink.query()
      .findById(shareLinkId)
      .update(newShareLink)
      .returning("*")
      .asCallback((err, shareLink) => {
        if (err || !shareLink) {
          logger.error('ERROR: ')
          logger.info(err || "Could not find ShareLink")
          res.send({ success: false, message: err || "Could not find ShareLink" })
        } else {
          console.log('found oldShareLink');
          res.send({ success: true, shareLink });
        }
      })
  } else if (req.firm && req.firm._id && (req.firm._id == _firm)) {
    const shareLinkId = parseInt(req.params.id) // has to be an int
    const newShareLink = {
      _files: req.body._files
    }
    ShareLink.query()
      .findById(shareLinkId)
      .update(newShareLink)
      .returning("*")
      .asCallback((err, shareLink) => {
        if (err || !shareLink) {
          logger.error('ERROR: ')
          logger.info(err || "Could not find ShareLink")
          res.send({ success: false, message: err || "Could not find ShareLink" })
        } else {
          console.log('found oldShareLink');
          res.send({ success: true, shareLink });
        }
      })
  } else {
    res.send({ success: false, message: "UNAUTHORIZED - Permission failed" })
  }
}

exports.utilUpdate = (user, shareLinkId, shareLink, sendEmails, callback) => {
  // NOTE: since this shareLink has been populated we'll have to delete the keys that don't belong on the model.
  // console.log('About to update shareLink', shareLink);
  delete shareLink['client']
  delete shareLink['createdBy']
  delete shareLink['files']
  delete shareLink['firm']
  delete shareLink['fromOutlook']
  delete shareLink['quickTask']
  delete shareLink['emailResults']
  shareLink.sentTo = JSON.stringify(shareLink.sentTo)

  ShareLink.query()
    .findById(shareLinkId)
    .asCallback((err, oldShareLink) => {
      if (err || !oldShareLink) {
        logger.error('ERROR: ')
        logger.info(err || "Could not find ShareLink")
        callback({ success: false, message: err || "Could not find ShareLink" })
      } else {
        delete shareLink['uploadName'];
        ShareLink.query()
          .findById(shareLinkId)
          .update(shareLink) //valiation? errors??
          .returning('*') // doesn't do this automatically on an update
          .asCallback((err, updatedShareLink) => {
            if (err || !updatedShareLink) {
              logger.error("ERROR: ")
              logger.info("Could not update ShareLink", err)
              callback({ success: false, message: err || "Could not update ShareLink" })
            } else {
              logger.info("shareLink updated")
              if (sendEmails) {
                logger.info("Check and send emails")
                exports.utilCheckAndSendEmails(user, oldShareLink, updatedShareLink, null, emailResults => {
                  // console.log("oldShareLink", oldShareLink);
                  // console.log("updatedShareLink", updatedShareLink)
                  logger.info('emailResults', emailResults)
                  updatedShareLink.emailResults = emailResults
                  callback({ success: true, shareLink: updatedShareLink })
                });
              } else {
                logger.info('No emails to send.')
                callback({ success: true, shareLink: updatedShareLink })
              }
            }
          })
      }
    })

}

exports.updateWithPermission = (req, res) => {
  const shareLinkId = parseInt(req.params.id) // has to be an int
  logger.info('shareLinkId', shareLinkId);
  // We need an override for this when it is created from outlook.
  let sendEmails = true
  if (req.body.fromOutlook) {
    sendEmails = false
  }
  // staff and staffClients should be able to update everything.
  // Everyone else should only be able to update _files
  ShareLink.query()
    .findById(shareLinkId)
    .asCallback(async (err, oldShareLink) => {
      if (err || !oldShareLink) {
        logger.error('ERROR: ')
        logger.info(err || "Could not find ShareLink")
        res.send({ success: false, message: err || "Could not find ShareLink" })
      } else {
        console.log('found oldShareLink');
        let shareLink = req.body;
        if (req.user && req.user._id || !!req.body._createdBy) {

          if (!(req.user && req.user._id)) {
            req.user = await User.query().findById(req.body._createdBy).then(user => user).catch(err => null);
          }
          // For now we are only doing a firm level check here. Any staff of this firm can update every sharelink for this firm.
          // do firm "access" level permission check.
          permissions.utilCheckFirmPermission(req.user, oldShareLink._firm, "access", permission => {
            if (!permission) {
              // User doesn't have specific permission, only allow them to update the _files array.
              shareLink = { _files: shareLink._files }
            }
            logger.info(permission ? "Updating ShareLink with firm access permission" : "Updating ShareLink with restrictions.")
            // Update.
            exports.utilUpdate(req.user, shareLinkId, shareLink, sendEmails, result => {

              const { shareLink } = result;
              let actionText = "";
              let fileId = null;

              // file activity
              if (result.success && shareLink) {

                if (shareLink._quickTask && shareLink.type === "signature-request") {

                  QuickTask.query().findById(shareLink._quickTask)
                    .then(quickTask => {
                      if (quickTask) {

                        // requested signature 
                        if (!quickTask._returnedFiles.length && quickTask._unsignedFiles.length) {
                          actionText = `Request signature by %USER%`;
                          fileId = quickTask._unsignedFiles[0];
                        }

                        if (actionText && fileId) {
                          fileActivityCtrl.utilCreateFromResource(
                            req
                            , fileId, shareLink._firm, shareLink._client, req.user ? req.user._id : null
                            , "", actionText
                            , "" // `/firm/${shareLink._firm}/workspaces/${shareLink._client}/files/${fileId}`
                            , "" // `/portal/${shareLink._client}/files/${fileId}`
                          );
                        }
                      }
                    });
                }
              }

              res.send(result)
            })
          });

          // NOTE: If we want to further restrict this by staffClient, uncomment the code below.
          // if(oldShareLink._client) {
          //   // do client "access" level permission check.
          //   permissions.utilCheckClientPermission(req.user, oldShareLink._client, "access", permission => {
          //     if(!permission) {
          //       // User doesn't have specific permission, only allow them to update the _files array.
          //       shareLink = { _files: shareLink._files }
          //     }
          //     logger.info(permission ? "Updating ShareLink with client access permission" : "Updating ShareLink with restrictions.")
          //     // Update.
          //     exports.utilUpdate(req.user, shareLinkId, shareLink, result => {
          //       res.send(result)
          //     })
          //   });
          // } else {
          //   // do firm "access" level permission check.
          //   permissions.utilCheckFirmPermission(req.user, oldShareLink._firm, "access", permission => {
          //     if(!permission) {
          //       // User doesn't have specific permission, only allow them to update the _files array.
          //       shareLink = { _files: shareLink._files }
          //     }
          //     logger.info(permission ? "Updating ShareLink with firm access permission" : "Updating ShareLink with restrictions.")
          //     // Update.
          //     exports.utilUpdate(req.user, shareLinkId, shareLink, result => {
          //       res.send(result)
          //     })
          //   });
          // }
        } else {
          // User is not logged in, only allow updates to _files array.
          shareLink = {
            _files: shareLink._files
            , _quickTask: !!req.body._quickTask ? req.body._quickTask : null
          }

          console.log('oldShareLink', oldShareLink);
          logger.info("Updating ShareLink with restrictions.")
          console.log('sharelink params', shareLink)
          exports.utilUpdate(null, shareLinkId, shareLink, sendEmails, result => {
            res.send(result)
          });
        }
      }
    });
}

exports.delete = (req, res) => {
  logger.warn("deleting shareLink");

  // TODO: needs testing and updating
  const shareLinkId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM shareLinks WHERE id = ' + shareLinkId + ';'

  console.log(query);
  db.query(query, (err, result) => {
    if (err) {
      console.log("ERROR")
      console.log(err);
      res.send({ success: false, message: err });
    } else {
      res.send({ success: true })
    }
  })
}

exports.utilSendFileRequestEmails = (sender, shareLink, emailMessage, callback) => {
  // get the firm so we can populate the firm logo in the email.
  Firm.query().findById(shareLink._firm)
    .asCallback(async (err, firm) => {
      if (err || !firm) {
        logger.error('ERROR ', err || 'Firm not found')
      } else {
        // set custom url, if applicable
        let firmUrl = appUrl;

        if (firm && firm.domain) {
          firmUrl = firm.domain;
        }
        let firmLogo;
        if (firm.logoUrl) {
          firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
        }
        logger.debug("creating shareLink file request notification email");
        const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';

        const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
        let targets = shareLink.sentTo.map(user => user.email)
        // console.log('targets', targets);
        let link = shareLink.url;

        // We should always have a user since login is required when creating a file request. But we'll do this just in case.
        if (!sender) {
          sender = {
            firstname: 'A'
            , lastname: 'User'
          }
        }
        const typeText = shareLink.type === 'share' ? 'shared' : 'requested';

        const subject = `${sender.firstname} ${sender.lastname} ${typeText} files`;
        let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
        let notifContent = `<h1 style="text-align: center;">${sender.firstname} ${sender.lastname} ${typeText} files</h1>`
        notifContent += emailMessage ?
          `<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnBoxedTextBlock" style="min-width:100%;">
           <!--[if gte mso 9]>
             <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%">
           <![endif]-->
             <tbody class="mcnBoxedTextBlockOuter">
               <tr>
                 <td valign="top" class="mcnBoxedTextBlockInner">          
                 <!--[if gte mso 9]>
                   <td align="center" valign="top" ">
                 <![endif]-->
                   <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnBoxedTextContentContainer">
                     <tbody>
                       <tr>
                         <td style="padding-top:9px; padding-left:18px; padding-bottom:9px; padding-right:18px;">
                           <table border="0" cellspacing="0" class="mcnTextContentContainer" width="100%" style="min-width: 100% !important;background-color: #FFD56A;border: 2px solid #F9B915;">
                             <tbody>
                               <tr>
                                 <td valign="top" class="mcnTextContent" style="padding: 18px;color: #000000;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;">
                                   ${emailMessage}
                                 </td>
                               </tr>
                             </tbody>
                           </table>
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 <!--[if gte mso 9]>
                   </td>
                 <![endif]-->        
                 <!--[if gte mso 9]>
                     </tr>
                   </table>
                 <![endif]-->
               </td>
             </tr>
           </tbody>
         </table>`
          :
          ''
        const buttonText = shareLink.type === 'share' ? 'View File Share' : 'View File Request';
        const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                           <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                               <tbody>
                                   <tr>
                                       <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                         <a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">  ${buttonText} </a>
                                       </td>
                                   </tr>
                               </tbody>
                           </table>
                         </td>`
        const content = [
          { name: 'notifLink', content: notifLink }
          , { name: 'notifContent', content: notifContent }
        ]
        // If there is a firm logo add it to the content array.
        if (firmLogo) {
          content.push({
            name: 'firmLogo', content: firmLogo
          })
        }
        emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
          callback(data.result)
          logger.info(data);
        });
      }
    });
}

exports.utilSendSignerEmails = (sender, shareLink, callback) => {
  logger.info('Attempting to email signers.')
  // got shareLink. Now get the quickTask.
  const quickTaskId = parseInt(shareLink._quickTask)
  QuickTask.query().findById(quickTaskId)
    .asCallback((err, quickTask) => {
      if (err || !quickTask) {
        logger.error('ERROR:')
        logger.info(err || 'QuickTask not found')
        callback({ success: false, message: "QuickTask not found" })
      } else {
        // got quickTask. Now put together the email.
        // get the firm so we can populate the firm logo in the email.
        Firm.query().findById(quickTask._firm)
          .asCallback(async (err, firm) => {
            if (err || !firm) {
              logger.error('ERROR ', err || 'Firm not found')
            } else {
              // set custom url, if applicable
              let firmUrl = appUrl;

              if (firm && firm.domain) {
                firmUrl = firm.domain;
              }
              let firmLogo;
              if (firm.logoUrl) {
                firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
              }
              logger.debug("creating shareLink signature notification email");
              const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
              //const subject = 'New Activity in ImagineTime';
              const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
              let targets = []
              let sharedEmail = false;
              // Make sure we aren't sending an email to addresses with a (comment) in them.
              quickTask.signingLinks.forEach(link => {
                if (!link.signatoryEmail.includes('(')) {
                  targets.push(link.signatoryEmail)
                } else {
                  sharedEmail = true
                }
              })
              console.log('targets', targets);
              // let sender = req.user;
              let notifLink = ''

              let instructions = "";

              if (quickTask.prompt) {
                instructions = `
               <div style="text-align:left">
                 <p>${quickTask.prompt}</p>
               </div>
             `;
              }

              if (sharedEmail) {
                // Signers share an email address. Put direct signing links in the email.
                // if (shareLink && shareLink.authType === "secret-question" && shareLink.prompt) {
                notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                              ${instructions}
                              <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                                <tbody>
                                    <tr>
                                        <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                          <a class="mcnButton " title="View in ${brandingName.title}" href=${shareLink.url} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${brandingName.title}</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                          </td>`
                // } else {
                //   quickTask.signingLinks.forEach((link, i) => {
                //     let url = link.url;
                //     // if (shareLink && shareLink.authType === "secret-question" && shareLink.prompt) {
                //     // url = `${shareLink.url}?signer=${i}`;
                //     // }
                //     notifLink += `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                //                     ${i > 1 ? instructions : ''}
                //                     <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                //                         <tbody>
                //                             <tr>
                //                                 <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                //                                   <a class="mcnButton " title="Review and sign" href=${url} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">${link.signerName}</a>
                //                                 </td>
                //                             </tr>
                //                         </tbody>
                //                     </table>
                //                   </td>`
                //   })
                // }

              } else {
                // Signers do not share an email address. Link them to the shareLink url.

                /**
                 * NOTE: We may want to link everyone directly to signing instead of routing them through the shareLink.
                 * This would require reworking this method to send an email per signer. Leaving it as it is for now.
                 */
                let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
                notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                            ${instructions}
                            <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                              <tbody>
                                  <tr>
                                      <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                        <a class="mcnButton " title="View in ${title}" href=${shareLink.url} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${title}</a>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                        </td>`
              }

              // We should always have a user since login is required when creating a signature request. But we'll do this just in case.
              if (!sender) {
                sender = {
                  firstname: 'A'
                  , lastname: 'User'
                }
              }
              const subject = `${sender.firstname} ${sender.lastname} requested your signature`;

              let notifContent = `<h1 style="text-align: center;">${sender.firstname} ${sender.lastname} requested your signature</h1>`

              const content = [
                { name: 'notifLink', content: notifLink }
                , { name: 'notifContent', content: notifContent }
              ]
              // If there is a firm logo add it to the content array.
              if (firmLogo) {
                content.push({
                  name: 'firmLogo', content: firmLogo
                })
              }
              emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
                callback(data.result)
                logger.info(data);
              });
            }
          });
      }
    });
}

exports.utilSendFileUploadedEmails = (sender, shareLink, newFileIds, cb) => {
  File.query()
    .whereIn('_id', newFileIds) // needs testing
    .asCallback((err, files) => {
      if (err || !files) {
        cb({ success: false, message: err || 'Could not find files, no emails sent' })
      } else {
        // We have the files, now we need the firm
        Firm.query().findById(shareLink._firm)
          .asCallback(async (err, firm) => {
            if (err || !firm) {
              cb({ success: false, message: err || 'Could not find firm, no emails sent' })
            } else {
              // set custom url, if applicable
              let firmUrl = appUrl;

              if (firm && firm.domain) {
                firmUrl = firm.domain;
              }
              let firmLogo;
              if (firm.logoUrl) {
                firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
              }
              logger.debug("creating shareLink file upload notification email");
              const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
              //const subject = 'New Activity in ImagineTime';
              const fromInfo = await firmsController.getEmailFromInfo(shareLink._firm, shareLink._createdBy);
              let uploadName = '';
              if (!sender) {
                // No sender means that a user that was not logged in uploaded these files. We'll need to grab the uploadName
                // from one of the files. Since the file or files in question were all uploaded at the same time, the uploadName
                // should match on all of them so we can just grab it from the first one.
                uploadName = files[0].uploadName || "A user"
              }
              let fromUser = uploadName ? `(${uploadName})` : sender ? `${sender.firstname} ${sender.lastname}` : 'An unidentified user'
              const subject = `${fromUser} uploaded ${newFileIds.length === 1 ? 'a file' : 'some files'}`;
              let notifContent = `<h1 style="text-align: center;">${fromUser} uploaded ${newFileIds.length === 1 ? 'a file' : 'some files'}</h1>`
              let notifLink = ``
              let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
              // Create a link to each file.
              files.forEach(file => {
                const fileLink = file._client ? `http://${firmUrl}/firm/${firm._id}/workspaces/${file._client}/files/${file._id}` : `http://${firmUrl}/firm/${firm._id}/files/public/${file._id}`
                // notifLink += `
                // <tr>
                //   <td style="padding-left: 18px;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: center;">
                //     <a href="${fileLink}"><p> ${file.filename} </p>
                //     </a>
                //   </td>
                // <tr>`

                notifLink += `<tr style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
                 <table class="mcnButtonContentContainer" style="min-width: 300px; max-width: 300px; margin-bottom: 16px; border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                     <tbody>
                       <tr>
                         <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                           <a class="mcnButton " title="View in ${title}" href=${fileLink} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View ${file.filename}</a>
                         </td>
                       </tr>
                     </tbody>
                 </table>
             </tr>`;
              })



              const content = [
                { name: 'notifLink', content: notifLink }
                , { name: 'notifContent', content: notifContent }
              ]
              // If there is a firm logo add it to the content array.
              if (firmLogo) {
                content.push({
                  name: 'firmLogo', content: firmLogo
                })
              }
              if (!shareLink._client) {
                // No client id present, only send an email to shareLink._createdBy
                User.query().findById(shareLink._createdBy)
                  .asCallback((err, user) => {
                    if (err || !user) {
                      cb({ success: false, message: err || "Could not find shareLink creator. No emails sent" })
                    } else if (user.sendNotifEmails) {
                      let targets = [user.username];
                      emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
                        logger.info(data);
                        cb(data.result)
                      });
                    } else {
                      cb({ success: true, message: "This user does not want emails. No email sent." })
                    }
                  })
              } else {
                cb({ success: false, message: 'This shareLink is associated with a client. Update the quickTask instead.' })
                // NOTE: This should never happen. If a clientId is present we should have added the files to the quickTask instead of the shareLink.
                // Client id is present, send to shareLink._createdBy AND all staffClients.
                // staffClientsCtrl.utilGetByClientId(shareLink._client, (err, staffClients) => {
                //   if(err || !staffClients) {
                //     cb({ success: false, message: err || "Could not find staffClients. No emails sent."})
                //   } else {
                //     let userIds = staffClients.map(staffClient => staffClient._user)
                //     userIds.push(shareLink._createdBy)
                //     User.query()
                //     .whereIn('_id', userIds) // needs testing
                //     .asCallback((err, users) => {
                //       if(err || !users) {
                //         cb({ success: false, message: err || 'Could not find users, no emails sent'})
                //       } else {
                //         let targets = users.map(user => user.username)
                //         console.log('targets', targets);
                //         emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
                //           logger.info(data);
                //           cb(data.result)
                //         });
                //       }
                //     });
                //   }
                // });
              }
            }
          });
      }
    });
}

//  exports.utilSendUnsignedSignerEmail = (shareLink, signer, callback) => {
//    const { _firm, url } = shareLink
//    Firm.query().findById(_firm)
//    .asCallback((err, firm) => {
//      if(err || !firm) {
//        logger.error('ERROR ', err || 'Firm not found')
//      } else {
//        // set custom url, if applicable
//        let firmUrl = appUrl;

//        if(firm && firm.domain) {
//          firmUrl = firm.domain;
//        }
//        let firmLogo;
//        if(firm.logoUrl) {
//          firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
//        }
//        logger.debug("creating shareLink signature notification email");
//        const template = 'notification-email';

//        const fromInfo = {
//          email: brandingName.email.noreply
//          , name: brandingName.title
//        }
//        const target = [signer.signatoryEmail];

//        let notifLink = ''

//        // let instructions = `Please sign the attached document. Thank you.`;
//        let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
//        notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
//                              <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
//                                <tbody>
//                                    <tr>
//                                        <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
//                                          <a class="mcnButton " title="View in ${title}" href=${url} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${title}</a>
//                                        </td>
//                                    </tr>
//                                </tbody>
//                            </table>
//                          </td>`

//        const subject = `Notice!`;

//        let notifContent = `<h1 style="text-align: center;">Please sign the attached document. Thank you.</h1>`

//        const content = [
//          { name: 'notifLink' , content: notifLink }
//          , { name: 'notifContent', content: notifContent}
//        ]
//        // If there is a firm logo add it to the content array.
//        if(firmLogo) {
//          content.push({
//            name: 'firmLogo', content: firmLogo
//          })
//        }
//        emailUtil.sendEmailTemplate(target, subject, template, content, null, null, fromInfo, data => {
//          callback(data.result)
//          logger.info(data);
//        });
//      }
//    });
//  }

exports.getByFirm = (req, res) => {

  const firmId = req.params.firmId;

  ShareLink.query()
    .where({
      _firm: firmId
    })
    .whereNot({
      type: 'signature-request'
    })
    .then(shareLinks => {
      res.send({ success: true, shareLinks })
    })
    .catch(err => {
      res.send({ success: false, message: err });
    })
}