/**
 * Sever-side controllers for Firm.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Firm
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const _ = require('lodash');

let env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
let config = require('../../config')[env];

const Firm = require('./FirmModel');
const Staff = require('../staff/StaffModel');

const Client = require('../client/ClientModel');
const ClientUser = require('../clientUser/ClientUserModel');
const File = require('../file/FileModel');
const ClientWorkflow = require('../clientWorkflow/ClientWorkflowModel');

// DAOs
const firmDAO = require('./firmDAO');

// controllers
const activitiesCtrl = require('../activity/activitiesController');
const tagsCtrl = require('../tag/tagsController');
const filesCtrl = require('../file/filesController');
const clientsCtrl = require('../client/clientsController');
const clientWorkflowsCtrl = require('../clientWorkflow/clientWorkflowsController');
const clientTasksCtrl = require('../clientTask/clientTasksController');
const staffCtrl = require('../staff/staffController');
const staffClientsCtrl = require('../staffClient/staffClientsController');

// utils
const assureSign = require('../../global/utils/assureSign')
const sqlUtils = require('../../global/utils/sqlUtils');
const Utils = require('../../global/utils/Utils');
const permissions = require('../../global/utils/permissions');

const brandingName = require('../../global/brandingName.js').brandingName;

const { raw } = require('objection');

let async = require('async');
const User = require('../user/UserModel');
let logger = global.logger;

exports.getSettings = (req, res) => {
  permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'admin', (isAllowed) => {
    if(isAllowed) {
      firmDAO.getSettings(req.params.firmId)
      .then(firmSettings => {
        res.send({success: true, firmSettings});
      })
      .catch(err => {
        logger.error(getFileIdentifier(), err);
        logger.error(getFileIdentifier(), ' - Error Object Type:', typeof err);
        res.send({success: false, message: Utils.getErrorMessage(err)});
      });
    }
    else {
      logger.warn(getFileIdentifier(), '- Logged in user is not firm owner or global admin.');
      res.send({success: false, message: 'Invalid request'});
    }
  });
}

exports.updateSettings = (req, res) => {
  logger.debug(getFileIdentifier(), 'updateSettings - req.body:', req.body);
  permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'admin', (isAllowed) => {
    if(isAllowed) {
      let firmSettings = req.body;
      firmSettings._firm = parseInt(req.params.firmId);
      firmDAO.createOrUpdateSettings(firmSettings)
      .then(firmSettings => {
        res.send({success: true, firmSettings});
      })
      .catch(err => {
        logger.error(getFileIdentifier(), err);
        res.send({success: false, message: Utils.getErrorMessage(err)});
      });
    }
    else {
      logger.warn(getFileIdentifier(), '- Logged in user is not firm owner or global admin.');
      res.send({success: false, message: 'Invalid request'});
    }
  });
}

/**
 * Consulting FirmSetting's email_useLoggedInUserInfo attribute, it returns
 * information to be used as From in the emails sent out from ImagineTime.
 * @param {integer} firmId Unique database id of the firm to consult its
 * setings. Required.
 * @param {integer} userId Unique database id of the logged in user.
 * @returns {object} Promise object which when resolved, returns an object
 * containing name and replyTo attributes having values to be used as From Name
 * and Reply-To in the email sent out from ImagineTime.
 */
exports.getEmailFromInfo = (firmId, userId) => {
  if(!firmId) {
    logger.warn(getFileIdentifier(), 'Missing firmId');
    throw Error('FirmId is required.');
  }

  return firmDAO.getSettings(firmId)
  .then(firmSettings => {
    if(!!firmSettings._id && firmSettings.email_useLoggedInUserInfo !== true) {
      //logger.debug(getFileIdentifier(), 'About to return overridden info');
      return {name: firmSettings.email_fromName, replyTo: firmSettings.email_replyTo};
    }
    if(!!userId) {
      //logger.debug(getFileIdentifier(), 'UserId given:', userId);
      // querying Firm to save one database call to get firm info if user does not exist.
      let knexObj = Firm.query()
      .leftJoin('staff', 'firms._id', '=', 'staff._firm')
      .leftJoin('users', (builder) => {
        builder.on('users._id', '=', 'staff._user')
        .andOn('staff._user', '=', userId)
        .andOn('staff.status', db.raw('?', ['active']))
      })
      .where('firms._id', firmId)
      //.where('users._id', userId)
      //.where('staff.status', 'active')
      .columns([{firmId: 'firms._id'}, {firmName: 'firms.name'}, {userFirstName: 'users.firstname'}, {userLastName: 'users.lastname'}, {userEmail: 'users.username'}])
      // as there could be more than one records in the staff table for the firm,
      // orderBy and limit ensure that the user record, if exists, is returned.
      .orderBy('users.username', 'asc')
      .limit(1);
      //logger.debug(getFileIdentifier(), knexObj.toString());
      return knexObj.then(firmAndUsers => {
        if(!!firmAndUsers[0].userEmail) {
          let user = firmAndUsers[0];
          //logger.debug(getFileIdentifier(), 'User is an active staff in the firm. Hence user info will be used:', user);
          return {name: user.userFirstName + ' ' + user.userLastName, replyTo: user.userEmail};
        }
        //logger.debug(getFileIdentifier(), 'User is not active staff in the firm. Hence firm info will be used');
        return {name: firmAndUsers[0].firmName, replyTo: null};
      });
    }
    else {
      //logger.debug(getFileIdentifier(), 'User is not given. Hence firm info will be used');
      return Firm.query().findById(firmId)
      .then(firm => {
        //logger.debug(getFileIdentifier(), 'Firm:', firm);
        return {name: firm.name, replyTo: null};
      });
    }
  });

  /*
  let firmSettings = await firmDAO.getSettings(req.params.firmId);
  if(!!firmSettings._id && !firmSettings.email_useLoggedInUserInfo) {
    return {name: firmSettings.email_fromName, replyTo: firmSettings.email_replyTo};
  }
  let user = await User.query().where('_id', userId);
  return {name: user.firstname + ' ' + user.lastname, replyTo: user.username};
  */
}

exports.utilSearch = (vectorQueryString, callback) => {
  // global ADMIN search
  Firm.query()
  .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}')`)
  .then(firms => {
    callback({success: true, firms})
  })
}

exports.checkFirmDomain = (req, res, next) => {
  /**
   * this is a function that has no direct api route
   * it is called on each request to the server
   * it will check and verify the requesting domain 
   * against the list of firms in the database and the app url
   * if it does not find a match it will return a 404 error
   * if it does, it simply forwards the request on to the next
   * function in express
   */

  // logger.warn("YOTE HOST: " + req.hostname)
  // logger.warn("appurl: " + config.appUrl.split(":")[0]) // ignore port // actually dont
  // console.log(req.headers.host) // includes port
  
  let domain = req.hostname; // doesnt include port

  // usually, we want to ignore the port. but for dev we need to keep it for the checks, sinces its nonstandard
  const fullhost = req.headers.host; // includes port

  if(fullhost.includes('localhost') || fullhost.includes('127.0.0.1')) {
    domain = fullhost;
  }
  

  const appUrl = config.appUrl;
  logger.debug('appurl', appUrl);
  exports.utilCheckFirmDomain(domain, appUrl, result => {
    if(result.success) {
      next();
    } else {
      console.log("domain check returning 404")
      res.status(404).end();
    }
  })
}

exports.utilCheckFirmDomain = (domain, appUrl, callback) => {
  // tricky because we have different domains for the different environments
  // this runs a check for firms based on the fully-qualified domain
  // if found, it will return true and the firm object
  // otherwise false
  // if domain matches the appUrl in the config, return true

  console.log("FIRM UTIL CHECKS");
  logger.warn("YOTE HOST: " + domain)
  logger.warn("appurl: " + appUrl) // ignore port

  if(domain.split(":")[0] == appUrl.split(":")[0]) {
    // this is the default, return true
    logger.info('hitting from primary domain')
    callback({success: true})
  } else {
    logger.info("check for firm domain", domain);
    // if(domain == '127.0.0.1') {
    //   logger.debug('testing locally, add port')
    //   domain += ':3030'
    //   logger.debug(domain);
    // }
    Firm.query()
    .select(['_id','domain', '_file', 'name', 'logoUrl']) // need the ID for logo path 
    .where({domain: domain})
    // todo: since these calls will happen a LOT, we should look into making an index on the db on this field
    .first()
    .asCallback((err, firm) => {
      if(err) {
        console.log("ERR!", err)
        callback({success: false})
      } else if(!firm) {
        console.log("NO MATCHING FIRM DOMAIN")
        // diff message
        callback({success: false})
      } else {
        console.log("FOUND FIRM", firm)
        // return firm object too for possible external use
        callback({success: true, firm})
      }
    })
  }  
}

exports.downloadLogo = (req, res) => {
  // allow downloading only the firm's logo without having to login to api for files 
  Firm.query()
  .findById(req.params.firmId)
  .select(['_file'])
  .asCallback((err, firm) => {
    if(!firm) {
      res.send({success: false, message: "Firm logo not found"})
    } else {
      File.query()
      .findById(firm._file)
      .asCallback((err, file) => {
        if(!file) {
          res.send({success: false, message: "logo not found"})
        } else {
          filesCtrl.utilDownloadFile(req, file, res);
        }
      })
    }
  })
}

exports.getFirmFromDomain = (req, res) => {
  // check the domain and return the firm object if the domain is custom
  let domain = req.hostname; // doesnt include port

  // usually, we want to ignore the port. but for dev we need to keep it for the checks, sinces its nonstandard
  const fullhost = req.headers.host; // includes port
  if(fullhost.includes('localhost') || fullhost.includes('127.0.0.1')) {
    logger.debug('host is local')
    domain = fullhost;
  }
  
  const appUrl = config.appUrl;

  exports.utilCheckFirmDomain(domain, appUrl, result => {
    logger.debug('utilCheckFirmDomainCB')
    console.log(result);
    if(result.success && result.firm) {
      res.send({success: true, firm: result.firm})
    } else {
      // nothing to send
      res.send({success: false});
    }
  })
}

exports.list = (req, res) => {
  Firm.query()
  .then(firms => {
    res.send({success: true, firms})
  })
}

exports.listByUser = (req, res) => {
  logger.info('Find all staff associated with this userId: ', req.params.userId);

  /**
   * note 8/29 - technically this is incorrect, as "by user" should include clientusers
   * as well, and this could be a very useful api for other stuff, esp. custom domains
   * it LOOKS like its only used in conjunction with the staff permissions, which have 
   * their own fetch, so adding clientUsers here hopefully won't break anything, but
   * needs to be watched and tested to make sure.
   */
  Staff.query()
  .where({_user: req.params.userId})
  .asCallback((err, staff) => {
    if(err || !staff) {
      res.send({success: false, message: "1. Error retrieving Staff by User"})
    } else {
      logger.info('staff found');
      console.log(staff);
      let staffFirmIds = staff.map(s => s._firm);
  
      ClientUser.query()
      .where({_user: req.params.userId})
      .asCallback((err, clientUsers) => {
        if(err || !clientUsers) {
          res.send({success: false, message: "2. Error retrieving ClientUsers by User"})
        } else {
          let clientFirmIds = clientUsers.map(cu => cu._firm);
          let firmIds = staffFirmIds.concat(clientFirmIds)

          Firm.query().from('firms as f')
          .leftJoin('subscriptions as s', 's._firm', 'f._id')
          .leftJoin('folderpermission as fp', 'fp._firm', 'f._id')
          .where({
            'fp._client': null,
            'fp._folder': null
          })
          .whereIn('f._id', firmIds)
          .whereNot({ 's.status': 'canceled' })
          .select('f.*', raw('row_to_json(fp) as permission'))
          .groupBy(['f._id', 's._id', 'fp._id'])
          .asCallback((err, firms) => {
            if(err || !firms) {
              console.log('err,', err, firms)
              res.send({success: false, message: "3. Error retrieving Firms by User"})
            } else {
              res.send({success: true, firms});
            }
          })
        }
      })
    }
  })


  // Staff.query()
  // .where({_user: req.params.userId})
  // .then(staff => {
  //   logger.info('staff found');
  //   console.log(staff);
  //   let firmIds = staff.map(s => s._firm);
  //   if(!staff || !staff.length > 0) {
  //     res.send({success: true, firms: []});
  //   } else {
  //     Firm.query()
  //     .whereIn('_id', firmIds) // needs testing
  //     .then(firms => {
  //       res.send({success: true, firms});
  //     })
  //   }
  // })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of firms queried from the array of _id's passed in the query param
   *
   * NOTES:
   * 1) looks like the best syntax for this is, "?id=1234&id=4567&id=91011"
   *    still a GET, and more or less conforms to REST uri's
   *    additionally, node will automatically parse this into a single array via "req.query.id"
   * 2) node default max request headers + uri size is 80kb.
   *    experimentation needed to determie what the max length of a list we can do this way is
   * TODO: server side pagination
   */

  if(!req.query[req.params.refKey]) {
    // make sure the correct query params are included
    res.send({success: false, message: `Missing query param(s) specified by the ref: ${req.params.refKey}`});
  } else {
    // // as in listByRef below, attempt to query for matching ObjectId keys first. ie, if "user" is passed, look for key "_user" before key "user"
    // Firm.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, firms) => {
    //     if(err || !firms) {
    //       res.send({success: false, message: `Error querying for firms by ${["_" + req.params.refKey]} list`, err});
    //     } else if(firms.length == 0) {
    //       Firm.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, firms) => {
    //         if(err || !firms) {
    //           res.send({success: false, message: `Error querying for firms by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, firms});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, firms});
    //     }
    // })
    Firm.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, firms) => {
        if(err || !firms) {
          res.send({success: false, message: `Error querying for firms by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, firms});
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
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }
    Firm.query()
    .where(query)
    .then(firms => {
      res.send({success: true, firms})
    })
  }
}

exports.tagSearch = (req, res) => {
  console.log("firm tags text search")
   // need to separate "by-text" and "by-tagged-from-text" searches, since they return two different lists
  // this is for objects that match the text string directly

  // before we do anything, find client and check permissions
  Firm.query()
  .findById(req.params.id)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Unable to confirm Firm permissions"})
    } else {
      
      // the permissions check needs to split the method. if the person has admin access
      // , they can access all clients. if they only have access, then they can only access specific
      // , clients

      // check permissions
      permissions.utilCheckFirmPermission(req.user, req.params.id, "admin", adminPermission => {
        console.log("firm admin search permission check", adminPermission)
        permissions.utilCheckFirmPermission(req.user, req.params.id, "access", accessPermission => {
          console.log("firm access search permission check", accessPermission)
          if(!accessPermission) {
            res.send({success: false, message: "You do not have permission to access this api route."});
          } else {

            let firmUserClientIds = null; // for an admin this should be null
            staffClientsCtrl.utilGetByFirmAndUser(req.user._id, firm._id, result => {
              if(result.success && !adminPermission) {
                firmUserClientIds = result.staffClients.map(sc => sc._client)
              }

              console.log("QUERY", req.query.value);
              // so, to work with spaces, you have to separate the words out in a weird way
              // looks like "word1 & word2" for word1 and word2
              let vectorQueryString = req.query.value;
              console.log("VECTOR QUERY STRING", vectorQueryString)

              tagsCtrl.utilSearch(vectorQueryString, null, tagsResult => {
                let tagIds = tagsResult.success ? tagsResult.tags.map(t => t._id) : []
                console.log("TAG IDS!", tagIds)
                async.parallel({
                  files: cb => {
                    if(tagIds.length == 0) {
                      // skip
                      cb(null, [])
                    } else if (firmUserClientIds) {
                      // firm non-admin search
                      let rawTagsQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
                      File.query()
                      .where({_firm: req.params.id})
                      /**
                       * SUBQUERIES IN KNEX / OBJECTION
                       * The goal is to include files where _firm matches AND (_client matches OR _client is null).
                       * There is a subtle but important difference between the two following queries:
                       * 
                       * File.query()
                       * .where({_firm: req.params.id})
                       * .whereIn('_client', firmUserClientIds)
                       * .orWhereNull('_client')
                       * 
                       * SQL: SELECT files FROM files WHERE (_firm = firmId AND _client IN firmUserClientIds) OR _client IS null.
                       * 
                       * VS
                       * 
                       * File.query()
                       * .where({_firm: req.params.id})
                       * .where(builder => {
                       *   builder
                       *   .whereIn('_client', firmUserClientIds)
                       *   .orWhereNull('_client')
                       * })
                       * 
                       * SQL: SELECT files from files WHERE _firm = firmId AND (_client IN firmUserClientIds OR _client IS null)
                       * 
                       * MORE INFO: https://vincit.github.io/objection.js/recipes/subqueries.html
                       * https://vincit.github.io/objection.js/recipes/precedence-and-parentheses.html
                       * 
                       */
                      .where(builder => {
                        builder
                        .whereIn('_client', firmUserClientIds)
                        .orWhereNull('_client')
                      })
                      .where(builder => {
                        builder.whereRaw(...rawTagsQuery);
                        if (tagIds && tagIds.length) {
                          tagIds.map(item => {
                            builder.orWhereRaw('? = any (??)', [item, '_tags'])
                          });
                        }
                      })
                      // NOTE: something to think about. this only returns things that have ALL matching tags. is this what we want or should it be *any* matching tags?
                      .then(files => {
                        cb(null, files)
                      })
                    } else {
                      // firm admin search
                      let rawTagsQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
                      File.query()
                      .where({_firm: req.params.id})
                      .whereRaw(...rawTagsQuery)
                      .where(builder => {
                        if (tagIds && tagIds.length) {
                          tagIds.map(item => {
                            builder.orWhereRaw('? = any (??)', [item, '_tags'])
                          });
                        }
                      })
                      // NOTE: something to think about. this only returns things that have ALL matching tags. is this what we want or should it be *any* matching tags?
                      .then(files => {
                        cb(null, files)
                        // res.send({success: true, files})
                      })
                    }
                  }
                  , clientWorkflows: cb => {
                    if(tagIds.length == 0) {
                      // skip
                      cb(null, [])
                    } else if (firmUserClientIds) {
                      let rawTagsQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
                      ClientWorkflow.query()
                      .where({_firm: req.params.id})
                      .whereIn('_client', firmUserClientIds)
                      .whereRaw(...rawTagsQuery)
                      .where(builder => {
                        if (tagIds && tagIds.length) {
                          tagIds.map(item => {
                            builder.orWhereRaw('? = any (??)', [item, '_tags'])
                          });
                        }
                      })
                      // NOTE: something to think about. this only returns things that have ALL matching tags. is this what we want or should it be *any* matching tags?
                      .then(clientWorkflows => {
                        cb(null, clientWorkflows)
                        // res.send({success: true, files})
                      })
                    } else {
                      let rawTagsQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
                      ClientWorkflow.query()
                      .where({_firm: req.params.id})
                      // .whereRaw(...rawTagsQuery)
                      .whereRaw(...rawTagsQuery)
                      .where(builder => {
                        if (tagIds && tagIds.length) {
                          tagIds.map(item => {
                            builder.orWhereRaw('? = any (??)', [item, '_tags'])
                          });
                        }
                      })
                      // NOTE: something to think about. this only returns things that have ALL matching tags. is this what we want or should it be *any* matching tags?
                      .then(clientWorkflows => {
                        cb(null, clientWorkflows)
                        // res.send({success: true, files})
                      })
                    }
                  }
                }, (err, results) => {
                  console.log("END ASYNC", results)
                  if(err) {
                    console.log("ERROR IN ASYNC PARALLEL!", err);
                  }
                  res.send({success: true, tags: tagsResult.tags, ...results });
                })
              })



            })
          }
        })
      })
    }
  })
}

exports.fileSearch = (req, res) => {
  console.log("firm object text advance search", req.params.id)
  // need to separate "by-text" and "by-tagged-from-text" searches, since they return two different lists
  // this is for objects that match the text string directly
  // before we do anything, find client and check permissions
  Firm.query()
  .findById(req.params.id)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Unable to confirm Firm permissions"})
    } else {
      
      // the permissions check needs to split the method. if the person has admin access
      // , they can access all clients. if they only have access, then they can only access specific
      // , clients

      // check permissions
      permissions.utilCheckFirmPermission(req.user, req.params.id, "admin", adminPermission => {
        console.log("firm admin search permission check", adminPermission)
        permissions.utilCheckFirmPermission(req.user, req.params.id, "access", accessPermission => {
          console.log("firm access search permission check", accessPermission)
          if(!accessPermission) {
            res.send({success: false, message: "You do not have permission to access this api route."});
          } else {

            let firmUserClientIds = null; // for an admin this should be null
            staffClientsCtrl.utilGetByFirmAndUser(req.user._id, firm._id, result => {
              if(result.success && !adminPermission) {
                firmUserClientIds = result.staffClients.map(sc => sc._client)
              }

              // with that out of the way, lets do the actual searching
              let vectorQueryString = req.query.value; // .replace(/ /g, " & ")
              console.log("VECTOR QUERY STRING", vectorQueryString)
              console.log("firmUserClientIds",firmUserClientIds)

              async.parallel({
                files: cb => {
                  filesCtrl.utilAdvanceSearch(vectorQueryString, req.params.id, firmUserClientIds, req.body, filesResult => {
                    cb(null, filesResult.files)
                  })
                }
              }, (err, results) => {
                // console.log("END ASYNC", results)
                if(err) {
                  console.log("ERROR IN ASYNC PARALLEL!", err);
                }
                res.send({success: true, ...results  });
              })
            })
          }
        })
      })
    }
  })
}

exports.objectSearch = (req, res) => {
  console.log("firm object text search")
  // need to separate "by-text" and "by-tagged-from-text" searches, since they return two different lists
  // this is for objects that match the text string directly

  // before we do anything, find client and check permissions
  Firm.query()
  .findById(req.params.id)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Unable to confirm Firm permissions"})
    } else {
      
      // the permissions check needs to split the method. if the person has admin access
      // , they can access all clients. if they only have access, then they can only access specific
      // , clients

      // check permissions
      permissions.utilCheckFirmPermission(req.user, req.params.id, "admin", adminPermission => {
        console.log("firm admin search permission check", adminPermission)
        permissions.utilCheckFirmPermission(req.user, req.params.id, "access", accessPermission => {
          console.log("firm access search permission check", accessPermission)
          if(!accessPermission) {
            res.send({success: false, message: "You do not have permission to access this api route."});
          } else {

            let firmUserClientIds = null; // for an admin this should be null
            staffClientsCtrl.utilGetByFirmAndUser(req.user._id, firm._id, result => {
              if(result.success && !adminPermission) {
                firmUserClientIds = result.staffClients.map(sc => sc._client)
              }

              // with that out of the way, lets do the actual searching
              console.log("QUERY", req.query.value);
              let vectorQueryString = req.query.value; // .replace(/ /g, "");
              // vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '');
              console.log("VECTOR QUERY STRING", vectorQueryString)
              console.log("firmUserClientIds",firmUserClientIds)

              async.parallel({
                // files: cb => {
                //   filesCtrl.utilSearch(vectorQueryString, req.params.id, firmUserClientIds, null, filesResult => {
                //     cb(null, filesResult.files)
                //   })
                // }
                // ,
                clientWorkflows: cb => {
                  clientWorkflowsCtrl.utilSearch(vectorQueryString, req.params.id, firmUserClientIds, null, clientWorkflowsResult => {
                    cb(null, clientWorkflowsResult.clientWorkflows)
                  })
                }
                , clientTasks: cb => {
                  clientTasksCtrl.utilSearch(vectorQueryString, req.params.id, firmUserClientIds, null, clientTasksResult => {
                    cb(null, clientTasksResult.clientTasks)
                  })
                }
                , clients: cb => {
                  clientsCtrl.utilSearch(vectorQueryString, req.params.id, firmUserClientIds, clientsResult => {
                    cb(null, clientsResult.clients)
                  })
                }
              }, (err, results) => {
                // console.log("END ASYNC", results)
                if(err) {
                  console.log("ERROR IN ASYNC PARALLEL!", err);
                }
                res.send({success: true, ...results  });
              })
            })
          }
        })
      })
    }
  })
}

exports.sendAllRemindersCron = (req, res) => {
  if(req.body.toString() == 'ab297bfaaf718af59d' && req.get('User-Agent') == 'Google-Cloud-Scheduler') {
    // little bit of authentication here. hex is set up by us.
    // go ahead

    // we will schedule the CRON job through gcloud, see https://cloud.google.com/scheduler/docs/creating
    logger.info("CRON - Send reminders to ALL clients of ALL firms.")

    Firm.query()
    .asCallback((err, firms) => {
      if(err || !firms) {
        res.send({success: false, message: err || "Unable to find firms."})
      } else {
        async.eachLimit(firms, 50, (firm, cb) => {
          exports.utilSendRemindersByFirm(firm._id, result => {
            if(!result.success) {
              logger.error("ERROR")
              logger.info(result.message)
              cb(result.message)
            } else {
              logger.info("Reminders sent for firm: ", firm._id)
              cb()
            }
          })
        }, err => {
          if(err) {
            logger.error("ERROR SENDING REMINDERS");
            logger.info(err)
            res.send({success: false, message: err});
          } else {
            logger.info("SUCCESS, REMINDERS SENT")
            res.send({success: true, message: "Finished sending reminders"});
          }
        });
      }
    })
  
  } else {
    console.log("ignoring")
    // NOT AUTHENTICATED, ignore and send 404 error
    res.send(404)
  }
}

exports.bulkSendReminders = (req, res) => {
  logger.info("Send reminders to ALL clients of ALL firms.")
  Firm.query()
  .asCallback((err, firms) => {
    if(err || !firms) {
      res.send({success: false, message: err || "Unable to find firms."})
    } else {
      async.eachLimit(firms, 50, (firm, cb) => {
        exports.utilSendRemindersByFirm(firm._id, result => {
          if(!result.success) {
            logger.error("ERROR")
            logger.info(result.message)
            cb(result.message)
          } else {
            logger.info("Reminders sent for firm: ", firm._id)
            cb()
          }
        })
      }, err => {
        if(err) {
          logger.error("ERROR SENDING REMINDERS");
          logger.info(err)
          res.send({success: false, message: err});
        } else {
          logger.info("SUCCESS, REMINDERS SENT")
          res.send({success: true, message: "Finished sending reminders"});
        }
      });
    }
  })
}

exports.sendRemindersByFirm = (req, res) => {
  const firmId = parseInt(req.params.firmId)
  exports.utilSendRemindersByFirm(firmId, result => {
    res.send(result);
  })
}

exports.utilSendRemindersByFirm = (firmId, callback) => {
  logger.info("Send reminders to all clients associated with this firmId: ", firmId);
  Client.query()
  .where({_firm: parseInt(firmId)})
  .asCallback((err, clients) => {
    if(err || !clients) {
      logger.error("Unable to find clients by firmId: ", firmId)
      callback({success: false, message: err || "Problem finding clients by firmId"})
    }
    logger.info('clients found', clients.length);
    clientsCtrl.utilSendBulkReminders(clients, result => {
      callback(result);
    })
  })
}

exports.getById = (req, res) => {
  logger.info('get firm by id', req.params.id);
  
  Firm.query().from('firms as f')
    .leftJoin('subscriptions as s', 's._firm', 'f._id')
    .leftJoin('folderpermission as fp', 'fp._firm', 'f._id')
    .where({ 'f._id': req.params.id })
    .where({
      'fp._client': null,
      'fp._folder': null
    })
    // .whereNot({ 's.status': 'canceled' })
    .select(['f.*', raw('row_to_json(s) as subscription'), raw('row_to_json(fp) as permission')])
    .groupBy(['f._id', 's._id', 'fp._id'])
    .first()
    .asCallback((err, firm) => {

      if (!firm || err) {
        res.send({success: false, message: "Firm not found" || err })
      } else {
        // problematic because clients need access to this frim object as well, but it includes things like the esig ids
        if(req.firm && (req.firm._id == firm._id)) {
          if (!firm.updated_sq) {
            // res.send({success: true, firm})

            const tempFirm = firm;
            const tempSecretQuestions = tempFirm.secretQuestions ? typeof(tempFirm.secretQuestions) === "string" ? JSON.parse(tempFirm.secretQuestions) : tempFirm.secretQuestions : {};
            let newSecretQuestions = {};
            for(const [key, value] of Object.entries(tempSecretQuestions)) {
                const sq = {
                    display: value.display,
                    prompt: value.prompt,
                    val: value.val
                }
                newSecretQuestions = {...newSecretQuestions, [value.val]: sq};
            }

            const defaulSecretQuestions = {
                dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
                , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
                , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
                , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
                , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
                , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
            }
            const secretQuestions = { ...defaulSecretQuestions, ...newSecretQuestions };
            tempFirm.secretQuestions = JSON.stringify(secretQuestions);
            tempFirm.updated_sq = true;
            Firm.query().findById(req.params.id).update(tempFirm).returning("*")
              .asCallback((err, newFirm) => {
                if (err && !newFirm) {
                  res.send({success: true, firm});
                } else {
                  res.send({success: true, firm: newFirm });
                }
              });
          } else {
            res.send({success: true, firm});
          }
        } else {
          try {
            permissions.utilCheckFirmPermission(req.user, req.params.id, 'client', permission => {
              if(!permission) {
                res.send({success: false, message: "You do not have permission to access this Firm"})
              } else {
                logger.info('user does have permission.')

                if (!firm.updated_sq) {
                  // res.send({success: true, firm})

                  const tempFirm = firm;
                  const tempSecretQuestions = tempFirm.secretQuestions ? typeof(tempFirm.secretQuestions) === "string" ? JSON.parse(tempFirm.secretQuestions) : tempFirm.secretQuestions : {};
                  let newSecretQuestions = {};
                  for(const [key, value] of Object.entries(tempSecretQuestions)) {
                      const sq = {
                          display: value.display,
                          prompt: value.prompt,
                          val: value.val
                      }
                      newSecretQuestions = {...newSecretQuestions, [value.val]: sq};
                  }
          
                  const defaulSecretQuestions = {
                      dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
                      , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
                      , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
                      , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
                      , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
                      , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
                  }
                  const secretQuestions = { ...defaulSecretQuestions, ...newSecretQuestions };
                  tempFirm.secretQuestions = JSON.stringify(secretQuestions);
                  tempFirm.updated_sq = true;
                  Firm.query().findById(req.params.id).update(tempFirm).returning("*")
                    .asCallback((err, newFirm) => {
                      if (err && !newFirm) {
                        res.send({success: true, firm});
                      } else {
                        res.send({success: true, firm: newFirm });
                      }
                    });
                } else {
                  res.send({success: true, firm});
                }
              }
            });
          } catch(err) {
            res.send({success: false, message: "You do not have permission to access this Firm"});
          }
        }
      }
    });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get firm schema ');
  res.send({success: true, schema: Firm.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get firm default object');
  res.send({success: true, defaultObj: Firm.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new firm');
  const firmData = req.body
  firmData.created_by = brandingName.title;
  firmData.company_name = brandingName.title;

  const defaulSecretQuestions = {
    dssn: { display: 'What are the last 4 numbers of your Social Security Number?', val: 'dssn', prompt: 'What are the last 4 numbers of your Social Security Number?'}
    , dssn2: { display: 'What is your social security number, without the dashes?', val: 'dssn2', prompt: 'What is your social security number, without the dashes?'}
    , dssn3: { display: `What are the last four numbers of the client's Social Security Number?`, val: 'dssn3', prompt: `What are the last four numbers of the client's Social Security Number?`}
    , dphone: { display: 'What are the last 4 of your phone number?', val: 'dphone', prompt: 'What are the last 4 of your phone number?'}
    , dzip: { display: 'What is your zip code?', val: 'dzip', prompt: 'What is your zip code?'}
    , ftin: { display: 'What are the last four digits of your Federal Tax Identification Number?', val: 'ftin', prompt: 'What are the last four digits of your Federal Tax Identification Number?' }
  }

  req.body.fileVersionType = "enable";
  req.body.secretQuestions = defaulSecretQuestions

  Firm.query().insert(req.body)
  .returning('*')
  .then(firm => {
    if(firm) {
      res.send({success: true, firm})
    } else {
      res.send({ success: false, message: "Could not save Firm"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating firm');

  const firmId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  const firmPermission = _.cloneDeep(req.body.permission);
  delete req.body.permission;

  if(req.body.apiKey) {
    const apiKey = req.body.apiKey;
    Firm.query()
      .where({
        apiKey: apiKey
      })
      .then((firms) => {
        if(firms.length >= 2) {
          res.send({success: true, firm: req.body, message: 'Imagineshare Api key is already taken'})
        } else if(firms.length == 1) {
          const firm = firms[0];
          if(firm._id == req.body._id) {
            Firm.query()
            .findById(firmId)
            .update(req.body) //valiation? errors?? 
            .returning('*') // doesn't do this automatically on an update
            .then(firm => {

              Client.query()
                .where({
                  _firm: firm._id
                })
                .update({
                  mangoCompanyID: firm.mangoCompanyID
                })
                .returning('*')
                .then((clients) => {});
              
              File.query()
                .where({
                  _firm: firm._id
                })
                .update({
                  mangoCompanyID: firm.mangoCompanyID
                })
                .returning('*')
                .then((files) => {});
              firm.permission = firmPermission
              res.send({success: true, firm})
            })
          } else {
            res.send({success: true, firm: req.body, message: 'Imagineshare Api key is already taken'})
          }
        } else {
          Firm.query()
          .findById(firmId)
          .update(req.body) //valiation? errors?? 
          .returning('*') // doesn't do this automatically on an update
          .then(firm => {

            Client.query()
              .where({
                _firm: firm._id
              })
              .update({
                mangoCompanyID: firm.mangoCompanyID
              })
              .returning('*')
              .then((clients) => {});
            
            File.query()
              .where({
                _firm: firm._id
              })
              .update({
                mangoCompanyID: firm.mangoCompanyID
              })
              .returning('*')
              .then((files) => {});
            firm.permission = firmPermission
            res.send({success: true, firm})
          })
        }
      })
  } else {
    Firm.query()
    .findById(firmId)
    .update(req.body) //valiation? errors?? 
    .returning('*') // doesn't do this automatically on an update
    .then(firm => {
      firm.permission = firmPermission
      res.send({success: true, firm})
    })
  }
}

exports.delete = (req, res) => {
  logger.warn("deleting firm");
  
  // TODO: needs testing and updating
  const firmId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM firms WHERE id = ' + firmId + ';'

  console.log(query);
  db.query(query, (err, result) => {
    if(err) {
      console.log("ERROR")
      console.log(err);
      res.send({success: false, message: err});
    } else {
      res.send({success: true})
    }
  })
}

exports.getAllAssureSignTemplates = (req, res) => {
  const firmId = parseInt(req.params.id) // has to be an int
  Firm.query()
  .findById(firmId)
  .asCallback((err, firm) => {
    if(err || !firm) {
      res.send({success: false, message: "Firm not found"})
    } else {

      if(req.firm && req.firm._id && (req.firm._id == firm._id)) {
        staffCtrl.getFirstStaffByFirm(firm._id, (result) => {
          if(!result.success) {
            logger.error("Problem fetching staff object. Unable to complete request.")
            res.send(result)
          } else {
            const requestingStaff = result.staff
            assureSign.getAuthToken(firm, requestingStaff, result => {
              if(!result.success) {
                res.send(result)
              } else {
                const authToken = result.token;
                // Now fetch all templates available to this firm.
                assureSign.getAllTemplates(firm, requestingStaff, authToken, result => {
                  console.log('result', result);
                  res.send(result);
                });
              }
            });
          }
        })
      } else {
        // Fetch the logged in staff so we can get the rest of the assuresign credentials.
        staffCtrl.utilGetLoggedInByFirm(req.user._id, firm._id, result => {
          if(!result.success) {
            logger.error("Problem fetching staff object. Unable to complete request.")
            res.send(result)
          } else {
            const requestingStaff = result.staff
            assureSign.getAuthToken(firm, requestingStaff, result => {
              if(!result.success) {
                res.send(result)
              } else {
                const authToken = result.token;
                // Now fetch all templates available to this firm.
                assureSign.getAllTemplates(firm, requestingStaff, authToken, result => {
                  console.log('result', result);
                  res.send(result);
                });
              }
            });
          }
        });
      }
    }
  });
}

exports.getFirmAPIKeys = (req, res) => {
  
  console.log('req.body', req.body);
  const mangoAPIKey = req.body.vendorAPIKeyIS;
  const imagineshareAPIKey = req.body.APIKeyMangoIS;
  const mangoCompanyID = req.body.CompanyIDImagineShare;

  Firm.query()
    .where({
      mangoCompanyID: mangoCompanyID
    })
    .first()
    .then((firm) => {
      //console.log('firm firm', firm._id);
      if(firm && firm._id) {
        console.log('Im here baka');
        Firm.query()
          .findById(firm._id)
          .update({'name': firm.name, 'mangoApiKey': '' + mangoAPIKey, 'apiKey': '' + imagineshareAPIKey})
          .returning('*')
          .then((firm) => {
            console.log('inner firm', firm);
            if(firm) {
              res.send({
                MangoBillingApiKey: mangoAPIKey,
                ImagineshareApiKey: firm.apiKey,
                CompanyIDImagineShare: firm._id
              })
            } else {
              res.send({success: false, message: "Firm not found"})
            }
          })
      } else {
        res.send({success: false, message: "Firm not found"})
      }
    })
}

function getFileIdentifier() {
  return 'firmController -';
}
