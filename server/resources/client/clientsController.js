/**
 * Sever-side controllers for Client.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Client
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */
// get the appUrl for the current environment
let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

// libraries
const async = require('async')
const axios = require('axios');

// models
const Client = require('./ClientModel');
const ClientUser = require('../clientUser/ClientUserModel');
const File = require('../file/FileModel');
const Firm = require('../firm/FirmModel');
const ClientWorkflow = require('../clientWorkflow/ClientWorkflowModel');
const ShareLink = require('../shareLink/ShareLinkModel');
const User = require('../user/UserModel');
const StaffClient = require('../staffClient/StaffClientModel');

const { raw } = require('objection');

// controllers
const activitiesCtrl = require('../activity/activitiesController');
const tagsCtrl = require('../tag/tagsController');
const filesCtrl = require('../file/filesController');
const clientWorkflowsCtrl = require('../clientWorkflow/clientWorkflowsController');
const clientTasksCtrl = require('../clientTask/clientTasksController');
const clientUserCtrl = require('../clientUser/clientUsersController');
const quickTasksCtrl = require('../quickTask/quickTasksController');
const usersCtrl = require('../user/usersController');
const staffClientCtrl = require('../staffClient/staffClientsController');
const firmsController = require('../firm/firmsController');
const mangobilling = require('../../global/constants').mangobilling;

// utils
const sqlUtils = require('../../global/utils/sqlUtils');
const permissions = require('../../global/utils/permissions');
const brandingName = require('../../global/brandingName.js').brandingName;
let emailUtil = require('../../global/utils/email');
let logger = global.logger;

exports.utilSearch = (vectorQueryString, firmId = null, firmClientIds = null, callback) => {
  console.log("CLIENTS UTIL SEARCH", vectorQueryString, firmId, firmClientIds)
  if (vectorQueryString && vectorQueryString.indexOf('-AMPERSAND-') > -1) {
    vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '&');
  }
  vectorQueryString = vectorQueryString && vectorQueryString.trim().toLowerCase();

  if(firmId && firmClientIds) {
    // firm non-admin search
    Client.query()
    .whereNot('status', 'deleted')
    .where({_firm: firmId})
    .whereRaw('LOWER(name) LIKE ?', `%${vectorQueryString}%`)
    .whereIn('_id', firmClientIds)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(name) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clients => {
      callback({success: true, clients})
    })
  } else if(firmId) {
    // firm admin search
    Client.query()
    .whereNot('status', 'deleted')
    .where({_firm: firmId})
    .whereRaw('LOWER(name) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(name) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clients => {
      callback({success: true, clients})
    })
  } else {
    // global ADMIN search
    Client.query()
    .whereNot('status', 'deleted')
    .whereRaw('LOWER(name) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(name) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clients => {
      callback({success: true, clients})
    })
  }
}

exports.list = (req, res) => {
  Client.query()
  .whereNot('status', 'deleted')
  .then(clients => {
    res.send({success: true, clients})
  })
}

exports.listByUser = (req, res) => {
  logger.info('Find all clients associated with this userId: ', req.params.userId);
  ClientUser.query()
  .where({_user: req.params.userId, status: "active"})
  .then(clientUsers => {
    logger.info('clientUsers found');
    console.log(clientUsers.length);
    let clientIds = clientUsers.map(cu => cu._client);
    if(!clientUsers || !clientUsers.length > 0) {
      res.send({success: true, clients: []});
    } else {
      Client.query()
      .whereNot('status', 'deleted')
      .whereIn('_id', clientIds) // needs testing
      .then(clients => {
        res.send({success: true, clients});
      })
    }
  })
}

exports.listByClientname = (req, res) => {
  logger.info('Find all clients associated with this firmId: ', req.params.firmId);
  
  const name = req.params.clientname;

  console.log('req.firm - ', req.firm);
  console.log('req.user', req.user);

  if(req.firm && (req.firm._id == req.params.firmId)) {
    Client.query()
    .whereNot('status', 'deleted')
    .where({
      _firm: req.params.firmId
    })
    .then(clients => {
      clients = clients.filter((client) => {
        return client.name.toLowerCase().includes(name.toLowerCase());
      })
      logger.info('clients found', clients.length);
      res.send({success: true, clients});
    })
  } else if(req.user && req.user._id) {
    permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'access', permission => {
      if(!permission) {
        res.send({success: false, message: "You do not have permission to access this Firm"})
      } else {
        Client.query()
        .whereNot('status', 'deleted')
        .where({
          _firm: req.params.firmId
        })
        .then(clients => {
          clients = clients.filter((client) => {
            return client.name.toLowerCase().includes(name.toLowerCase());
          })
          logger.info('clients found', clients.length);
          res.send({success: true, clients});
        })
      }
    })
  } else {
    res.send({success: false, clients: [], message: "UNAUTHORIZED - NOT LOGGED IN"});
  }
}

exports.listByFirm = (req, res) => {
  logger.info('Find all clients associated with this firmId: ', req.params.firmId);

  Firm.query().findById(req.params.firmId)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Unable to find matching Firm"})
    } else {
      // permissions check
      permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'access', permission => {
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this Firm"})
        } else {
          Client.query()
          .whereNot('status', 'deleted')
          .where({_firm: req.params.firmId})
          .then(clients => {
            logger.info('clients found', clients.length);
            res.send({success: true, clients});
          })
        }
      });
    }
  })


}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clients queried from the array of _id's passed in the query param
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
    // Client.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clients) => {
    //     if(err || !clients) {
    //       res.send({success: false, message: `Error querying for clients by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clients.length == 0) {
    //       Client.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clients) => {
    //         if(err || !clients) {
    //           res.send({success: false, message: `Error querying for clients by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clients});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clients});
    //     }
    // })
    Client.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clients) => {
        if(err || !clients) {
          res.send({success: false, message: `Error querying for clients by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clients});
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

    let newQuery = {}
    Object.keys(query).map(keyName => {
      newQuery['clients.' + keyName] = query[keyName];
    });

    Firm.query().from('firms as f')
    .leftJoin('subscriptions as s', 's._firm', 'f._id')
    .where({ 'f._id': query._firm })
    .whereNot({ 's.status': 'canceled' })
    .select('f.*')
    .groupBy(['f._id', 's._id'])
    .first()
    .asCallback((err, firm) => {
      if (err || !firm) {
        res.send({ success: false, message: "Client not found" });
      } else {
        permissions.utilCheckisStaffOwner(req.user, query._firm, result => {
          if (result) {
            Client.query().from('clients')         
            .leftJoin('staffclients', 'staffclients._client', 'clients._id')
            .leftJoin('addresses', 'addresses._id', 'clients._primaryAddress')
            .leftJoin('phonenumbers', 'phonenumbers._id', 'clients._primaryPhone')
            .groupBy(['clients._id', 'addresses._id', 'phonenumbers._id'])
            .where(newQuery)
            .select([
              'clients.*',
              raw('json_agg(staffclients) as staffclients'),
              raw('row_to_json(addresses) as objaddress'), 
              raw('row_to_json(phonenumbers) as phonenumber')
            ])
            .then(clients => {
              res.send({success: true, clients});
            });
          } else {
            staffClientCtrl.utilGetByFirmAndUser(req.user._id, query._firm, result => {
              if (result.success && result.staffClients) {
                const clientIds = result.staffClients.map(sc => sc._client);
                Client.query().from('clients')
                .leftJoin('staffclients', 'staffclients._client', 'clients._id')
                .leftJoin('addresses', 'addresses._id', 'clients._primaryAddress')
                .leftJoin('phonenumbers', 'phonenumbers._id', 'clients._primaryPhone')
                .groupBy(['clients._id', 'addresses._id', 'phonenumbers._id'])
                .whereIn('clients._id', clientIds)
                .where(newQuery)
                .select([
                  'clients.*',
                  raw('json_agg(staffclients) as staffclients'),
                  raw('row_to_json(addresses) as objaddress'), 
                  raw('row_to_json(phonenumbers) as phonenumber')
                ])
                .then(clients => {
                  res.send({success: true, clients});
                });
              } else {
                res.send({ success: false, message: "permissions denied" });
              }
            });
          }
        });
      }
    });
  }
}

exports.tagSearch = (req, res) => {
  console.log("client tags text search")
  // need to separate "by-text" and "by-tagged-from-text" searches, since they return two different lists
  // this is for objects that have a tag that was matched by the text search

  // before we do anything, find client and check permissions
  Client.query()
  .whereNot('status', 'deleted')
  .findById(req.params.id)
  .then(client => {
    if(!client) {
      res.send({success: false, message: "Unable to confirm Client permissions"})
    } else {
      // check permissions
      permissions.utilCheckClientPermission(req.user, req.params.id, "client", permission => {
        console.log("client search permission check", permission)
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this api route."});
        } else {
          console.log("QUERY", req.query.value);
          // so, to work with spaces, you have to separate the words out in a weird way
          // looks like "word1 & word2" for word1 and word2
          let vectorQueryString = req.query.value; // .replace(/ /g, " & ")
          console.log("VECTOR QUERY STRING", vectorQueryString)

          /**
           * high level:
           * 1. find any matching tags
           * 2. start an async
           * 3. find any client files with matching tags
           * 4. find any clientWorkflows with matching tags
           * 5,6... find more things
           */

          /**
          * TODO: we need to factor in things like status, published, etc. that should
          * probably happen in each of those respective controllers and be hard coded.
          * i.e., client should never be able to search unpublished clientWorkflows or files 
          * that aren't visible to them
          */

          tagsCtrl.utilSearch(vectorQueryString, null, tagsResult => {

            let tagIds = tagsResult.success ? tagsResult.tags.map(t => t._id) : []
            console.log("TAG IDS!", tagIds)

            async.parallel({
              files: cb => {
                if(tagIds.length == 0) {
                  // skip
                  cb(null, [])
                } else {
                  // relatively easy query, not worth making into a separate util function
                  let rawTagsQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
                  File.query()
                  .where({_client: req.params.id})
                  .whereRaw(...rawTagsQuery)
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
                } else {
                  // relatively easy query, not worth making into a separate util function
                  let rawTagsQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
                  ClientWorkflow.query()
                  .where({_client: req.params.id})
                  .whereRaw(...rawTagsQuery)
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
        }
      })
    }
  })
}

exports.objectSearch = (req, res) => {
  console.log("client object text search")
  // need to separate "by-text" and "by-tagged-from-text" searches, since they return two different lists
  // this is for objects that match the text string directly

  // before we do anything, find client and check permissions
  Client.query()
  .whereNot('status', 'deleted')
  .findById(req.params.id)
  .then(client => {
    if(!client) {
      res.send({success: false, message: "Unable to confirm Client permissions"})
    } else {
      // check permissions
      permissions.utilCheckClientPermission(req.user, req.params.id, "client", permission => {
        console.log("client search permission check", permission)
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this api route."});
        } else {
          console.log("QUERY", req.query.value);
          // so, to work with spaces, you have to separate the words out in a weird way
          // looks like "word1 & word2" for word1 and word2
          let vectorQueryString = req.query.value; // .replace(/ /g, "")
          console.log("VECTOR QUERY STRING", vectorQueryString)

          /**
           * high level:
           * 1. start an async
           * 2. find any client files that match text search
           * 3. find any clientWorkflows that match text search
           * 4,5... find more things
           * 
           * right now, plan is to return each of those separately and let the front end handle display.
           * for example, I could see "matching files" displaying different in the list based on if the
           * filename matches or if the tag matches. we'll return the matching tags too just in case.
           */

          /**
          * TODO: we need to factor in things like status, published, etc. that should
          * probably happen in each of those respective controllers and be hard coded.
          * i.e., client should never be able to search unpublished clientWorkflows or files 
          * that aren't visible to them
          */

          async.parallel({
            files: cb => {
              filesCtrl.utilSearch(vectorQueryString, null, null, req.params.id, filesResult => {
                cb(null, filesResult.files)
              })
            }
            , clientWorkflows: cb => {
              clientWorkflowsCtrl.utilSearch(vectorQueryString, null, null, req.params.id, clientWorkflowsResult => {
                cb(null, clientWorkflowsResult.clientWorkflows)
              })
            }
            , clientTasks: cb => {
              clientTasksCtrl.utilSearch(vectorQueryString, null, null, req.params.id, clientTasksResult => {
                cb(null, clientTasksResult.clientTasks)
              })
            }
          }, (err, results) => {
            console.log("END ASYNC", results)
            if(err) {
              console.log("ERROR IN ASYNC PARALLEL!", err);
            }
            res.send({success: true, ...results  });
          })
        }
      })
    }
  })
}

function checkClientByExternalId(externalId) {
  return Client.query()
    .where({
      externalId
    })
    .first()
}
exports.getById = (req, res) => {
  logger.info('get client by id');

  const clientId = req.params.id;
  if(!isNaN(clientId)) {
    Client.query().from('clients as clients')         
    .leftJoin('staffclients', 'staffclients._client', 'clients._id')
    .leftJoin('addresses', 'addresses._client', 'clients._id')
    .leftJoin('phonenumbers', 'phonenumbers._client', 'clients._id')
    .groupBy(['clients._id', 'addresses._id', 'phonenumbers._id'])
    .select([
      'clients.*',
      raw('json_agg(staffclients) as staffclients'),
      raw('row_to_json(addresses) as address'), 
      raw('row_to_json(phonenumbers) as phonenumbers')
    ])
    .findById(req.params.id)
    .then(client => {
      if(!client) {
        checkClientByExternalId(clientId)
          .then(client => {
            if(!client) {
              res.send({success: false, message: "Client does not exists"})
            } else {
              if(!req.user && req && req.firm) {
                if(req.firm._id == client._firm) {
                  res.send({success: true, client})
                } else {
                  res.send({success: false, message: "You do not have permission to access this Client"})
                }
              } else {
                permissions.utilCheckClientPermission(req.user, clientId, "client", permission => {
                  console.log("client search permission check", permission)
                  if(!permission) {
                    res.send({success: false, message: "You do not have permission to access this Client"})
                  } else {
                    res.send({success: true, client})
                  }
                })
              }
            }
          })
      } else {
        // check permissions
        if(!req.user && req && req.firm) {
          if(req.firm._id == client._firm) {
            res.send({success: true, client})
          } else {
            res.send({success: false, message: "You do not have permission to access this Client"})   
          }
        } else {
          permissions.utilCheckClientPermission(req.user, clientId, "client", permission => {
            console.log("client search permission check", permission)
            if(!permission) {
              res.send({success: false, message: "You do not have permission to access this Client"})
            } else {
              res.send({success: true, client})
            }
          })
        }
      }
    })
    .catch(err => {
      //check if it is data type error
      if(err && err.code == '22P02') {
        checkClientByExternalId(clientId)
          .then(client => {
            if(!client) {
              res.send({success: false, message: "Client does not exists"})
            } else {
              if(!req.user && req.firm && req.firm._id) {
                if(req.firm._id == client._firm) {
                  res.send({success: true, client})
                } else {
                  res.send({success: false, message: "You do not have permission to access this Client"})
                }
              } else {
                permissions.utilCheckClientPermission(req.user, clientId, "client", permission => {
                  console.log("client search permission check", permission)
                  if(!permission) {
                    res.send({success: false, message: "You do not have permission to access this Client"})
                  } else {
                    res.send({success: true, client})
                  }
                })
              }
            }
          })   
      } else {
        res.send({success: false, message: 'Unable to fetch the client'});
      }
    })
  } else {
    console.log('client is not an integer');
    checkClientByExternalId(clientId)
      .then(client => {
        if(!client) {
          res.send({success: false, message: "Client does not exists"})
        } else {
          if(!req.user && req.firm  && req.firm._id) {
            if(req.firm._id == client._firm) {
              res.send({success: true, client})
            } else {
              res.send({success: false, message: "You do not have permission to access this Client"})
            }
          } else {
            permissions.utilCheckClientPermission(req.user, clientId, "client", permission => {
              console.log("client search permission check", permission)
              if(!permission) {
                res.send({success: false, message: "You do not have permission to access this Client"})
              } else {
                res.send({success: true, client})
              }
            })
          }
        }
      })
  }
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get client schema ');
  res.send({success: true, schema: Client.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get client default object');
  res.send({success: true, defaultObj: Client.defaultObject});
  // res.send({success: false})
}

createClientService = (fields) => {
  return Client.query()
    .insert(fields)
    .returning('*')
}

findDuplicateClient = (name, clients = []) => {

}

exports.create = (req, res) => {
  logger.info('creating new client');
  console.log(req.body)
  // let client = new Client({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     client[k] = req.body[k];
  //   }
  // }

  req.body.externalId = !!req.body.externalId ? req.body.externalId : "";

  let name = req.body.name;
  let _firm = req.body._firm;
  if (_firm && name) {
    name = name.trim().toLowerCase();
    Client.query()
      .where({ _firm: parseInt(_firm) })
      .whereNot('status', 'deleted')
      .where(raw('lower("name")'), name.toLowerCase())
      .where({ externalId: req.body.externalId })
      .first()
      .asCallback((err, client) => {
        if (err) {
          res.send({ success: false, message: "Could not save Client" });
        } else if (client) {
          // visible or archived
          //res.send({ success: false, client });

          console.log('found the duplicate client', client);

          req.body.externalId = !req.body.externalId ? '' : req.body.externalId;

          if((req.body.externalId == client.externalId)) {
            res.send({ success: false, message: "Must have a unique external identifier", client});
          } else {
            //add the client
            createClientService(req.body)
              .then(newClient => {
                res.send({success: true, client: newClient})
              })
              .catch(err => {
                res.send({success: false, message: 'Failed to create client'});
              })
          }
        } else {
          createClientService(req.body)
            .then(newClient => {
              res.send({success: true, client: newClient})
            })
            .catch(err => {
              res.send({success: false, message: 'Failed to create client'});
            })
          /*
          Client.query().insert(req.body)
          .returning('*')
          .then(client => {
            if(client) {
              Firm.query()
                .findById(_firm)
                .then((firm) => {
                  console.log('my firm', firm);
                  if(firm.mangoCompanyID && firm.mangoApiKey) {
                    // logger.info('----mango condition----')
                    // const MANGO_CREATE_CLIENT = mangobilling.MANGO_CREATE_CLIENT;
                    // const requestBody = {
                    //   "CompanyID": firm.mangoCompanyID,
                    //   "IShareCompanyID": firm._id,
                    //   "IShareClientID": client._id,
                    //   "ClientName": client.name
                    // }
                    // axios({
                    //   method: 'POST',
                    //   url: MANGO_CREATE_CLIENT,
                    //   data: requestBody,
                    //   headers: {
                    //     'vendorAPIToken': firm.mangoApiKey,
                    //     'Content-Type': 'application/json'
                    //   }
                    // })
                    // .then((mangoRes) => {
                    //   mangoRes = mangoRes.data;
                    //   console.log('mangoRes', mangoRes.data);
                    //   if(mangoRes && mangoRes.data && mangoRes.data.ClientID) {
                    //     const mangoClient = mangoRes.data;
                    //     console.log('mangoClient', mangoClient);
                    //     Client.query()
                    //       .findById(client._id)
                    //       .update({
                    //         mangoClientID: mangoClient.ClientID,
                    //         mangoCompanyID: mangoClient.CompanyID
                    //       })
                    //       .returning('*')
                    //       .then((client) => {
                    //         res.send({success: true, client })
                    //       })
                    //   } else {
                    //     res.send({success: true, client, })
                    //   }
                    // })
                    // .catch((err) => {
                    //   res.send({success: true, client })
                    // })
                    res.send({success: true, client })
                  } else {
                    res.send({success: true, client })
                  }
              });
                
            } else {
              res.send({ success: false, message: "Could not save Client"})
            }
          });*/
        }
      });
  }
}

exports.createExisting = (req, res) => {
  logger.info('creating existing Name client');
  console.log(req.body)
  
  const { _firm, name } = req.body;

  if (_firm && name) {
    Client.query().insert(req.body)
    .returning('*')
    .then(client => {
      if(client) {
        res.send({success: true, client})
      } else {
        res.send({ success: false, message: "Could not save Client"})
      }
    });
  }
}

exports.updateNotif = (req, res) => {
  Client.query()
  .update({ "sN_viewed": false, "sN_downloaded": false })
  .returning('_id', 'name', 'sN_viewed', 'sN_downloaded')
  .then(clients => {
    res.send({ success: true, clients });
  })
}

exports.update = (req, res) => {
  logger.info('updating client');

  const clientId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Client.query()
  .findById(clientId)
  .asCallback((err, client) => {
    if(err || !client) {
      res.send({success: false, message: err || 'Unable to find client.'})
    } else {

      // check permissions
      permissions.utilCheckClientPermission(req.user, clientId, "client", permission => {
        console.log("client search permission check", permission)
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this Client"})
        } else {
          let newClient = req.body;
          // Check if onBoarding is complete.
          if(!newClient.onBoarded && newClient._primaryAddress && newClient._primaryPhone) {
            newClient.onBoarded = true
            // NOTE: We probably want this to be type date with a default of null.
            // newClient.onBoarded = new Date();
          }
          delete newClient.address;
          delete newClient.phonenumbers;
          
          Client.query()
            .findById(clientId)
            .update(newClient) //valiation? errors??
            .returning('*') // doesn't do this automatically on an update
            .asCallback((err, client) => {
              if(err || !client) {
                console.log('err', err);
                res.send({success: false, message: err || 'Unable to update client.'})
              } else {
                Firm.query()
                .findById(client._firm)
                .then((firm) => {
                  console.log('my firm', firm);
                  if(firm.mangoCompanyID && firm.mangoApiKey && client.mangoClientID) {
                    // logger.info('----mango client update ----')
                    // const MANGO_UPDATE_CLIENT = mangobilling.MANGO_UPDATE_CLIENT.replace(':mangoClientID', client.mangoClientID);
                    // console.log('MANGO_UPDATE_CLIENT URL', MANGO_UPDATE_CLIENT);
                    
                    // const requestBody = {
                    //   "CompanyID": firm.mangoCompanyID,
                    //   "IShareCompanyID": firm._id,
                    //   "IShareClientID": client._id,
                    //   "ClientName": client.name
                    // }
                    // console.log('requestBody', requestBody);
                    // axios({
                    //   method: 'PUT',
                    //   url: MANGO_UPDATE_CLIENT,
                    //   data: requestBody,
                    //   headers: {
                    //     'vendorAPIToken': firm.mangoApiKey,
                    //     'Content-Type': 'application/json'
                    //   }
                    // })
                    // .then((mangoRes) => {
                    //   console.log('MANGO_UPDATE_CLIENT RESPONSE', mangoRes.data);
                    //   res.send({success: true, client});
                    // })
                    // .catch((err) => {
                    //   console.log('MANGO_UPDATE_CLIENT ERROR', err);
                    //   res.send({success: true, client});
                    // })
                    res.send({success: true, client});
                  } else {
                    res.send({success: true, client})
                  }
                })
              }
            })
        }
      })
    }
  })
}

exports.updateStatus = (req, res) => {
  logger.info('updating client status and update clientUser status');

  const clientId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Client.query()
  .findById(clientId)
  .asCallback((err, client) => {
    if(err || !client) {
      res.send({success: false, message: err || 'Unable to find client.'})
    } else {

      // check permissions
      permissions.utilCheckClientPermission(req.user, clientId, "client", permission => {
        console.log("client search permission check", permission)
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this Client"})
        } else {
          let newClient = req.body;
          // Check if onBoarding is complete.
          if(!newClient.onBoarded && newClient._primaryAddress && newClient._primaryPhone) {
            newClient.onBoarded = true
            // NOTE: We probably want this to be type date with a default of null.
            // newClient.onBoarded = new Date();
          }
          Client.query()
            .findById(clientId)
            .update(newClient) //valiation? errors??
            .returning('*') // doesn't do this automatically on an update
            .asCallback((err, client) => {
              if(err || !client) {
                res.send({success: false, message: err || 'Unable to update client.'});
              } else {
                res.send({success: true, client});

                // to get back all clientUser status to active if the user want's to visible the client
                const clientUserWhere = client.status === "visible" ? "clientArchived" : "active"; // get all clientUser which status set active or clientArchived for this process
                const clientUserStatus = client.status === "visible" ? "active" : "clientArchived"; 

                // set clientUser status deactived
                ClientUser.query()
                  .where({ _client: client._id, status: clientUserWhere })
                  .update({ status: clientUserStatus })
                  .then(json => {
                    logger.info("success update clientUser status");
                  });                
              }
            })
        }
      })
    }
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting client");
  
  // TODO: needs testing and updating
  const clientId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM clients WHERE id = ' + clientId + ';'

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

exports.sendReminder = (req, res) => {
  // TODO: rename. this sends a single, manual reminder, as compared to the automatic "nudge" reminders
  const clientId = parseInt(req.params.clientId);
  // Step 1: Find client
  Client.query()
  .findById(clientId)
  .asCallback((err, client) => {
    if(err || !client) {
      res.send({success: false, message: err || 'Unable to find client.'})
    } else {
      /**
       * Step 2: Send required info to activities controller
       */
      activitiesCtrl.utilCreateFromResource(
        req.user._id, client._firm, client._id
        , `%USER% sent a reminder to complete open tasks` // firmText 
        , `/firm/${client._firm}/workspaces/${client._id}/client-workflows` // firmLink
        , false, false // Not a firm reminder or email
        , `%USER% sent a reminder that you have open tasks to complete.` // clientText
        , `/portal/${client._id}/dashboard/due-soon` // clientLink
        , true // this IS a client reminder. 
        , true // We want to send an email
        , req.io
        , result => res.send(result)
      )
    }
  });
}

exports.bulkInvite = (req, res) => {
  // console.log('req.body', req.body)
  permissions.utilCheckFirmPermission(req.user, req.body.firmId, 'admin', permission => {
    if(permission) {
      logger.info('user has permission, attempting invitations.')
        // Even small imports of 30 or so clients will likely timeout.
        // Return now and let them continue working while this runs in the background.

        /// res.send({success: true});
        // const { newClients, firmId } = req.body;

        Firm.query()
          .findById(req.body.firmId)
          .then(firm => {
            if (firm) {
              exports.getEngagementTypesByFirmId(firm._id, response => {
                req.body.engagementTypes = response.engagementTypes;
                exports.utilCreateAndInvite(req.body, req.user, req.io, firm, (err, data) => {
                  if(err || !data) {
                    req.io.to(req.user._id).emit('upload_error', "There was an error importing your clients.")
                  } else {
                    /**
                     * NOTE: We probably want to save this data somehow since it will not persist on the front end
                     * if the user reloads or goes to a new page.
                     * 
                     * It could be converted to a csv and saved as a file which could generate an activity and a notification.
                     */
                    req.io.to(req.user._id).emit('finish_upload', data);
                    res.send({success: true});
                  }
                });
              });  
            } else {
              res.send({success: false, message: "Firm not found"})
            }
          })
    } else {
      logger.info('user does NOT have permission.')
      res.send({success: false, message: "You do not have permisson to invite users to this client account."})
    }
  });
}

exports.utilCreateAndInvite = (body, sender, socket, firm, cb) => {
  /* NOTE: Check permissions before hitting this util.
  * NOTE: This accepts an array of objects (newClients) with the following shape: 
  *  {
  *     clientIdentifier: '' // This is the unique client id from the old ${brandingName.title} system.
  *    , clientName: ''
  *    , accountType: ''
  *    , primaryContact: []
  *  }
  * 
  */

  logger.info('start upload');
  const { newClients, firmId, uploadOnly, clientNotification, selectedStaffs, staffNotification, engagementTypes } = body;
  let stats = {
    clientsCreated: 0
    , existingClients: 0
    , existingUsers: 0
    , successfulInvites: 0 
    , error: 0
    , results: []
    , existingStaffClient: 0
    , successfulInvitesSC: 0
    , selectedStaffs
    , newStaffClients: []
  }
  let totalLength = newClients.length; // .map(client => client.primaryContact ? client.primaryContact.length : 0).reduce((a,b) => a + b) + newClients.length // newClients.length;
  let totalAttempts = 0;
  let progressPercent = 0;

  /**
   * stats.status = 0 // client error, able to resend the client and contact
   * 
   */

  // change to mapSeries so we can avoid creating duplicates if a client is in the list more than once.
  async.mapSeries(newClients, (currentClient, invitationMapCb) => {
    
    progressPercent = (100 / parseInt(totalLength)) * totalAttempts;
    socket.to(sender._id).emit('upload_status', Math.floor(progressPercent));
    totalAttempts++;

    stats.results.push(currentClient);

    // default value
    stats.results[stats.results.length-1].error_message = "";
    stats.results[stats.results.length-1].result_message = "New client added";
    stats.results[stats.results.length-1].status = 0;
    stats.results[stats.results.length-1].has_contact = false;
    stats.results[stats.results.length-1].action = [];

    // address
    const clientAddress = {
      street1: currentClient.street1 && currentClient.street1.trim()
      , city: currentClient.city && currentClient.city.trim()
      , state: currentClient.state && currentClient.state.trim()
      , postal: currentClient.postal && currentClient.postal.trim()
      , country: currentClient.country && currentClient.country.trim()
    };

    const clientPhoneNumber = {
      number: currentClient.number && currentClient.number.trim()
      , type: "main"
    }

    // this block never happened
    if (!currentClient.clientName && currentClient.clientName <= 2) {
      stats.results[stats.results.length-1].error_message = "Failed to meet the minimum length";
      stats.results[stats.results.length-1].result_message = "Failed to create client";
      stats.results[stats.results.length-1].action.push("error");
      stats.error++;
      invitationMapCb(null, stats);
    } else {

      // check if client is exist
      Client.query()
        .where("_firm", parseInt(firmId))
        // This raw query is necessary so the name lookup is NOT case sensitive.
        .whereNot("status", "deleted")
        .where(raw('lower("name")'), currentClient.clientName.toLowerCase())
        .orderBy("_id", "desc")        
        .first()
        .asCallback((err, client) => {

          if (err) {

            stats.results[stats.results.length-1].error_message = "Failed to meet the minimum length";
            stats.results[stats.results.length-1].result_message = "Failed to create client";
            stats.results[stats.results.length-1].action.push("error");
            stats.error++;
            invitationMapCb(null, stats);

          } else if (client) {

            clientAddress._client = client._id;
            clientUserCtrl.addAddress(clientAddress, addressResponse => {

              clientPhoneNumber._client = client._id;
              clientUserCtrl.addPhoneNumber(clientPhoneNumber, phoneResponse => {

                // invite staff
                staffClientCtrl.prepareStaffClientRecords(selectedStaffs, firmId, client._id, staffNotification, result => {
                  StaffClient.query().insert(result).returning('*')
                  .then(staffClients => {
                    console.log('invite staff in existing client', staffClients);

                    if (staffClients && staffClients.length) {
                      stats.newStaffClients.push(...staffClients);
                    }

                    // existing client
                    stats.existingClients++;

                    // default value
                    stats.results[stats.results.length-1].error_message = "Client name already exists";
                    stats.results[stats.results.length-1].result_message = "Failed to create client";
                    stats.results[stats.results.length-1].client = client;
                    stats.results[stats.results.length-1].action.push("rename");

                    if (client.status === "archived") {

                      // default value
                      stats.results[stats.results.length-1].error_message = "Client name exist in archived clients";
                      stats.results[stats.results.length-1].result_message = "Failed to create client";
                      stats.results[stats.results.length-1].action.push("reinstate");
                      invitationMapCb(null, stats);

                    } else {

                      // invite contact
                      const invitations = [];
                      currentClient.primaryContact.map((contact) => {
                        if (contact.email && (contact.firstname || contact.lastname)) {
                          invitations.push({ email: contact.email, firstname: contact.firstname, lastname: contact.lastname, uploadOnly });
                        }
                        return contact;
                      });

                      if (invitations.length) {

                        clientUserCtrl.utilInvite(invitations, "", client._id, sender, (err, inviteCallback) => {
                          if (err) {
                            stats.results[stats.results.length-1].result_message += ", failed to add contact";
                            invitationMapCb(null, stats);
                          } else {
                            const returnStats = inviteCallback ? inviteCallback.stats ? inviteCallback.stats : {} : {}
                            stats.error += returnStats.error ? returnStats.error : 0;
                            stats.existingUsers += returnStats.existingUsers ? returnStats.existingUsers : 0;
                            stats.successfulInvites += returnStats.successfulInvites ? returnStats.successfulInvites : 0;
                            stats.results[stats.results.length-1].result_message += ", contact added";

                            // set primary contact 
                            if (!client._primaryContact) {
                              const user = inviteCallback ? inviteCallback.results ? inviteCallback.results[0] ? inviteCallback.results[0].user ? inviteCallback.results[0].user : {} : {} : {} : {};
                              if (user._id) {
                                Client.query().findById(client._id)
                                  .update({ _primaryContact: user._id })
                                  .returning("*")
                                  .then(result => {
                                    invitationMapCb(null, stats);
                                  });
                              } else {
                                invitationMapCb(null, stats);
                              }
                            } else {
                              invitationMapCb(null, stats);
                            }
                          }
                        });
                      } else {
                        invitationMapCb(null, stats);
                      }
                    }
                  });
                });
              });
            });
          } else {

            // Create new client.
            const newClient = {
              identifier: currentClient.clientIdentifier
              , name: currentClient.clientName
              , engagementTypes: currentClient.engagementTypes
              , _firm: parseInt(firmId)
              , sN_upload: clientNotification.sN_upload
              , sN_viewed: clientNotification.sN_viewed
              , sN_downloaded: clientNotification.sN_downloaded
              , sN_sendMessage: clientNotification.sN_sendMessage
              , sN_leaveComment: clientNotification.sN_leaveComment
              , sN_autoSignatureReminder: clientNotification.sN_autoSignatureReminder
            };

            Client.query().insert(newClient)
            .returning('*')
            .asCallback((err1, client) => {

              if (err1) {

                stats.errors++;
                stats.result_message = 'Failed to create client';
                stats.results[stats.results.length-1].action.push("error"); 
                invitationMapCb(null, stats);
              } else {

                clientAddress._client = client._id;
                clientUserCtrl.addAddress(clientAddress, addressResponse => {

                  clientPhoneNumber._client = client._id;
                  clientUserCtrl.addPhoneNumber(clientPhoneNumber, phoneResponse => {

                    // invite staff 
                    staffClientCtrl.prepareStaffClientRecords(selectedStaffs, firmId, client._id, staffNotification, result => {
                      StaffClient.query().insert(result).returning('*')
                      .then(staffClients => {
                        console.log('invite staff in new created client', staffClients);

                        if (staffClients && staffClients.length) {
                          stats.newStaffClients.push(...staffClients);
                        }
                        
                          //--create mango client
                        Firm.query()
                        .findById(firmId)
                        .then((firm) => {
                          console.log('my firm', firm);
                          if(firm.mangoCompanyID && firm.mangoApiKey) {
                            // logger.info('----mango condition----')
                            // const MANGO_ADD_CLIENT = mangobilling.MANGO_CREATE_CLIENT;
                            // const requestBody = {
                            //   "CompanyID": firm.mangoCompanyID,
                            //   "IShareCompanyID": firm._id,
                            //   "IShareClientID": client._id,
                            //   "ClientName": client.name
                            // }
                            // axios({
                            //   method: 'POST',
                            //   url: MANGO_ADD_CLIENT,
                            //   data: requestBody,
                            //   headers: {
                            //     'vendorAPIToken': firm.mangoApiKey,
                            //     'Content-Type': 'application/json'
                            //   }
                            // })
                            // .then((mangoRes) => {
                            //   mangoRes = mangoRes.data;
                            //   console.log('mangoRes', mangoRes.data);
                            //   if(mangoRes && mangoRes.data && mangoRes.data.ClientID) {
                            //     const mangoClient = mangoRes.data;
                            //     console.log('mangoClient', mangoClient);
                            //     Client.query()
                            //       .findById(client._id)
                            //       .update({
                            //         mangoClientID: mangoClient.ClientID,
                            //         mangoCompanyID: mangoClient.CompanyID
                            //       })
                            //       .returning('*')
                            //       .then((client) => {
                            //         console.log('mango client', client);
                            //       })
                            //   }
                            // })
                            // .catch((err) => {
                            //   console.log('mango add client error', err);
                            // })
                          }
                        })
                        //--create mango client

                        stats.clientCreated = true;
                        stats.clientsCreated++;
                        stats.result_message = 'New client created.';

                        if (client.engagementTypes && client.engagementTypes.length && client.engagementTypes[0] && engagementTypes.indexOf(client.engagementTypes[0]) === -1) {
                          stats.results[stats.results.length-1].result_message += ", new engagement type added";
                        }

                        // invite contact
                        const invitations = [];
                        currentClient.primaryContact.map((contact) => {
                          if (contact.email && (contact.firstname || contact.lastname)) {
                            invitations.push({ 
                              email: contact.email, 
                              firstname: contact.firstname, 
                              lastname: contact.lastname,
                              uploadOnly 
                            });
                          }
                          return contact;
                        });

                        if (invitations.length) {
                          clientUserCtrl.utilInvite(invitations, "", client._id, sender, (err, inviteCallback) => {
                            if (err) {
                              stats.results[stats.results.length-1].result_message += ", failed to add contact";
                              invitationMapCb(null, stats);
                            } else {
                              const returnStats = inviteCallback ? inviteCallback.stats ? inviteCallback.stats : {} : {}
                              stats.error += returnStats.error ? returnStats.error : 0;
                              stats.existingUsers += returnStats.existingUsers ? returnStats.existingUsers : 0;
                              stats.successfulInvites += returnStats.successfulInvites ? returnStats.successfulInvites : 0;
                              stats.results[stats.results.length-1].result_message += ", contact added";
                              
                              // set primary contact 
                              if (!client._primaryContact) {
                                const user = inviteCallback ? inviteCallback.results ? inviteCallback.results[0] ? inviteCallback.results[0].user ? inviteCallback.results[0].user : {} : {} : {} : {};
                                const address = inviteCallback ? inviteCallback.results ? inviteCallback.results[0] ? inviteCallback.results[0].address ? inviteCallback.results[0].address : {} : {} : {} : {};
                                const phoneNumber = inviteCallback ? inviteCallback.results ? inviteCallback.results[0] ? inviteCallback.results[0].number ? inviteCallback.results[0].number : {} : {} : {} : {};
                                if (user._id) {
                                  Client.query().findById(client._id)
                                    .update({ _primaryContact: user._id, _primaryAddress: address._id, _primaryPhone: phoneNumber._id })
                                    .returning("*")
                                    .then(result => {
                                      User.query().findById(user._id)
                                      .update({ _primaryAddress: address._id, _primaryPhone: phoneNumber._id, username: user.username })
                                      .returning("*")
                                      .then(result => {
                                        invitationMapCb(null, stats);
                                      })
                                    });
                                } else {
                                  invitationMapCb(null, stats);
                                }
                              } else {
                                invitationMapCb(null, stats);
                              }
                            }
                          });
                        } else {
                          invitationMapCb(null, stats);
                        }
                      });
                    });
                  });
                });
              }
            });   
          }
        });
    }
  }, (err4, results) => {
    if(err4) {
      logger.error(err4);
      cb('async error - check logs', null)
    } else {
      cb(null, stats);
    }
  });
}

exports.utilSendBulkReminders = (clients, callback) => {
  /**
   * 1. For each client get all quickTasks that match the following criteria:
   *  a) quickTasks with "open" status and a type of 'signature'.
   *  b) quickTasks with "open" status and a type of 'file' and an empty _returnedFiles array.
   * 2. Generate an email with links to each sharelink url.
   */
  async.eachLimit(clients, 10, (client, cb) => {
    quickTasksCtrl.utilGetReminderTasksByClient(client._id, (err, quickTasks) => {
      if(err) {
        logger.error("ERROR")
        logger.info(err)
        cb(err)
      } else {
        // We have all quickTasks that need a reminder sent.
        // find the firm so that we can use custom urls, if applicable
        Firm.query().findById(client._firm)
        .asCallback((err, firm) => {
          if(err || !firm) {
            cb("Error finding Firm object! firm id=" + client._firm)
          } else {
            // Now generate and send the emails.
            exports.utilSendQuickTaskReminderEmails(client._id, firm, quickTasks, results => {
              if(!results.success) {
                cb(results.message)
              } else {
                cb()
              }
            })
          }
        })
      }
    })
  }, err => {
    if(err) {
      logger.error("ERROR SENDING REMINDERS");
      logger.info(err)
      callback({success: false, message: err});
    } else {
      logger.info("SUCCESS, REMINDERS SENT")
      callback({success: true, message: "Finished sending reminders"});
    }
  });
}

exports.sendRemindersByClient = (req, res) => {
  // TODO: Some kind of authentication.
  const clientId = parseInt(req.params.clientId)
  Client.query()
  .findById(clientId)
  .asCallback((err, client) => {
    if(err || !client) {
      res.send({success: false, message: err || 'Unable to find client.'})
    } else {
      exports.utilSendBulkReminders([client], result => {
        res.send(result);
      });
    }
  });
}

exports.utilSendQuickTaskReminderEmails = (clientId, firm, quickTasks, callback) => {
  /**
   * NOTE: For 'signature' type quickTasks we need to send emails to people in the signingLinks array. On
   * 'file' type quickTasks we'll need to send emails ot all clientUsers. So we'll have to loop through the
   * quickTasks, query the shareLink for each, and build an object with the email addresses as keys and an 
   * object containing two arrays, one for 'signature' type and one for 'file' type quickTasks.
   */
  // First get all users for this client. We'll need these to send reminders on file type quickTasks.
  usersCtrl.utilListByClient((clientId, result = {}) => {
    if(!result.success) {
      callback({success: false, message: 'Could not find users for this client. Client._id =', clientId})
    } else {
      const clientUserEmails = result.users.map(user => user.username);
      /**
       * NOTE: In order to group these tasks into one email per user, we need to build the tasksByUserEmail object below.
       * Each user email will be a key on the object with the value being an object containing 2 arrays, one for quickTasks
       * with a type of 'file' and one for quickTasks with a type of 'signature'
       * 
       * Example:
       * 
       * tasksByUserEmail: {
       *   firstEmailAddress: {
       *     file: [
       *       {
       *         link: shareLink.url
       *         , prompt: quickTask.prompt
       *       }
       *       , {
       *         link: shareLink.url
       *         , prompt: quickTask.prompt
       *       }
       *     ]
       *     , signature: [
       *        {
       *          link: shareLink.url
       *          , prompt: quickTask.prompt
       *        }
       *        , {
       *         link: shareLink.url
       *         , prompt: quickTask.prompt
       *        }
       *     ]
       *   }
       *   , secondEmailAddress: {
       *     file: [
       *       {
       *         link: shareLink.url
       *         , prompt: quickTask.prompt
       *       }
       *       , {
       *         link: shareLink.url
       *         , prompt: quickTask.prompt
       *       }
       *     ]
       *     , signature: [
       *        {
       *          link: shareLink.url
       *          , prompt: quickTask.prompt
       *        }
       *        , {
       *         link: shareLink.url
       *         , prompt: quickTask.prompt
       *        }
       *     ]
       *   }
       *   , thirdEmailAddress: {...}
       * }
       */
      let tasksByUserEmail = {}
      async.each(quickTasks, (quickTask, cb) => {
        // First grab the shareLink so we can access the shareLink.url
        ShareLink.query()
        .where({_quickTask: parseInt(quickTask._id)})
        .first()
        .asCallback((err, shareLink) => {
          if(err || !shareLink) {
            logger.error("ERROR")
            logger.info(err || 'shareLink not found.')
            cb(err)
          } else {
            if(quickTask.type == 'signature') {
              // On signature type quickTasks we need to pull the user email from the signingLinks array
              quickTask.signingLinks.forEach(link => {
                if(tasksByUserEmail[link.signatoryEmail]) {
                  // user email is already on the object. Check for a signature array
                  if(tasksByUserEmail[link.signatoryEmail].signature) {
                    // user email and signature array are already on the object. Add the shareLink url and quickTask prompt to this user's array.
                    tasksByUserEmail[link.signatoryEmail].signature.push({link: shareLink.url, prompt: quickTask.prompt})
                  } else {
                    // user email is on the object. Add the signature array with this shareLink url and quickTask prompt added to it.
                    tasksByUserEmail[link.signatoryEmail].signature = [{link: shareLink.url, prompt: quickTask.prompt}]
                  }
                } else {
                  // Add the user key and signature array to the object and push this shareLink url and quickTask prompt to it.
                  tasksByUserEmail[link.signatoryEmail] = {signature: []}
                  tasksByUserEmail[link.signatoryEmail].signature.push({link: shareLink.url, prompt: quickTask.prompt});
                }
              });
            } else if(quickTask.type == 'file') {
              // On file type quickTasks we need to send an email to every clientUser.
              clientUserEmails.forEach(email => {
                if(tasksByUserEmail[email]) {
                  // user email is already on the object. Check for a file array.
                  if(tasksByUserEmail[email].file) {
                    // user email and file array are already on the object. Push the shareLink url and quickTask prompt to this user's array.
                    tasksByUserEmail[email].file.push({link: shareLink.url, prompt: quickTask.prompt})
                  } else {
                    // user email is on the object. Add the file array with this shareLink url and quickTask prompt added to it.
                    tasksByUserEmail[email].file = [{link: shareLink.url, prompt: quickTask.prompt}]
                  }
                } else {
                  // Add the user key and file array to the object and push this shareLink url and quickTask prompt to it.
                  tasksByUserEmail[email] = {file: []}
                  tasksByUserEmail[email].file.push({link: shareLink.url, prompt: quickTask.prompt});
                }
              });
            } else {
              // unsupported quickTask type.
            }
            cb();
          }
        })
      }, err => {
        if(err) {
          logger.error("ERROR SENDING REMINDERS");
          logger.info(err)
          callback({success: false, message: err});
        } else {
          // set custom url, if applicable
          let firmUrl = appUrl;
          if(firm && firm.domain) {
            firmUrl = firm.domain;
          }
          const template = 'client-reminder'
          const subject = `Reminder: Your attention is needed in the ${firm.name} ${brandingName.title} portal`;

          let firmLogo;
          if(firm.logoUrl) {
            firmLogo = `<img alt="" src="https://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="center"/>`
          }
          // generate an email for each user in the tasksByUserEmail object.
          async.each(Object.keys(tasksByUserEmail), async (userEmail, cb) => {
            const targets = [userEmail]
            // console.log('targets', targets);
            let userTasks = tasksByUserEmail[userEmail];
            let signatureTasks = userTasks && userTasks.signature ? userTasks.signature : null;
            let fileTasks = userTasks && userTasks.file ? userTasks.file : null;
            let taskList = '';
            if(signatureTasks && signatureTasks.length > 0) {
              // add each signature task to the taskList
              taskList += `<tr><td valign="top" class="mcnTextContent" style="padding: 18px;color: #000000;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;">Signatures Requested</td></tr>`
              signatureTasks.forEach(task => {
                // Only add this task to the list if it doesn't have a response date.
                if(!task.responseDate) {
                  taskList += `<tr><td style="padding-left: 18px;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;"><a href="${task.link}"><p> ${task.prompt || 'Signature request'} </p></a></td><tr>`
                }
              });
            }
            if(fileTasks && fileTasks.length > 0) {
              // add each file task to the taskList
              taskList += `<tr><td valign="top" class="mcnTextContent" style="padding: 18px;color: #000000;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;">Files Requested</td></tr>`
              fileTasks.forEach(task => {
                taskList += `<tr><td style="padding-left: 18px;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;"><a href="${task.link}"><p> ${task.prompt || 'File request'} </p></a></td><tr>`
              });
            }
            const content = [
              { name: 'taskList' , content: taskList }
            ]
            // Add the firm logo is applicable.
            if(firmLogo) {
              content.push({ name: 'firmLogo' , content: firmLogo })
            }

            const fromInfo = await firmsController.getEmailFromInfo(firm._id, null);
            emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
              if(!data.success) {
                cb(data)
              } else {
                cb()
              }
            });
          }, err => {
            if(err) {
              logger.error("ERROR SENDING REMINDERS");
              logger.info(err)
              callback({success: false, message: err});
            } else {
              logger.info("SUCCESS, REMINDERS SENT")
              callback({success: true, message: "Finished sending reminders"});
            }  
          });
        }
      });
    }
  });
}

exports.bulkUpdate = (req, res) => {
  logger.info('client bulk update trigger');

  const { type, clientIds } = req.body;

  // to get back all clientUser status to active if the user want's to visible the client
  const clientUserWhere = type === "visible" ? "clientArchived" : "active"; // get all clientUser which status set active or clientArchived for this process
  const clientUserStatus = type === "visible" ? "active" : "clientArchived"; 

  async.map(clientIds, (clientId, callback) => {
    Client.query()
      .findById(clientId)
      .update({ status: type })
      .returning('*')
      .then(client => {
        if (client) {
          if(type == 'deleted') {
            Firm.query()
            .findById(client._firm)
            .then((firm) => {
              console.log('my firm', firm);
              if(firm.mangoCompanyID && firm.mangoApiKey && client.mangoClientID) {
                logger.info('----mango client delete----')
                const MANGO_DELETE_CLIENT = mangobilling.MANGO_DELETE_CLIENT.replace(':mangoClientID', client.mangoClientID);
                console.log('MANGO_DELETE_CLIENT URL', MANGO_DELETE_CLIENT);
                const requestBody = {
                  "CompanyID": firm.mangoCompanyID,
                  "IShareCompanyID": firm._id,
                  "IShareClientID": client._id,
                  "ClientName": client.name
                }
                console.log('requestBody', requestBody);
                // axios({
                //   method: 'DELETE',
                //   url: MANGO_DELETE_CLIENT,
                //   headers: {
                //     'vendorAPIToken': firm.mangoApiKey,
                //     'Content-Type': 'application/json'
                //   }
                // })
                // .then((mangoRes) => {
                //   console.log('mango delete client response', mangoRes.data);
                // })
                // .catch((err) => {
                //   console.log('mango delete client error', err);
                // })
              }
            })
          }

          // set clientUser status deactived
          ClientUser.query()
            .where({ _client: client._id, status: clientUserWhere })
            .update({ status: clientUserStatus })
            .then(json => {
              logger.info("success update clientUser status");
              callback(null, client);
            });
        } else {
          callback(null, null);
        }
      });
  }, (err, list) => {
    logger.info('success client bulk update');
    res.send({ success: true, data: list });
  });
}

exports.bulkNotificationUpdate = (req, res) => {
  const { clientIds, firmId } = req.body;
  delete req.body.clientIds;
  delete req.body.firmId;

  permissions.utilCheckFirmPermission(req.user, firmId, 'access', permission => {
    if(permission) {
      logger.info('user has permission, attempting invitations.')
        // Even small imports of 30 or so clients will likely timeout.
        // Return now and let them continue working while this runs in the background.

      console.log(req.body);
      console.log(clientIds)
      Client.query().whereIn("_id", clientIds).update(req.body).returning("*")
      .asCallback((err, clients) => {

        if (err && !clients) {
          console.log("err", err);
          res.send({ success: false, message: "Failed clients update" });
        } else {
          res.send({ success: true, data: clients });
        }
      });
    } else {
      logger.info('user does NOT have permission.')
      res.send({success: false, message: "You do not have permisson to invite users to this client account."})
    }
  });
}

exports.getEngagementTypesByFirmId = (firmId, callback) => {
  Client.query().where({ 
    status: 'visible'
    , _firm: firmId
  })
  .whereRaw('? != any (??)', ['', 'engagementTypes'])
  .select('engagementTypes')
  .then(clients => {
    const CLIENT_ENGAGEMENT_TYPES = [
        '1040'
        ,'709'
        ,'990'
        ,'1041'
        ,'1065'
        ,'1120'
        ,'1120S'
        ,'Bookkeeping'
        ,'Accounting'
        ,'Advisory'
        ,'Audit'
        ,'Attestation – Audit'
        ,'Attestation – Review'
        ,'Attestation - Other'
        ,'Tax Preparation'
        ,'Tax Planning'
        ,'Tax Advisory & Consulting'
        ,'Tax Representation'
        ,'Accounting Consulting'
        ,'Risk & Financial Advisory'
        ,'Merger & Acquisition'
        ,'Digital & Analytics'
        ,'Strategy & Corporate Finance'
        ,'Valuation'
        ,'Other'
    ];
    clients.forEach(client => {
        if (client && client.engagementTypes && client.engagementTypes.length) {
            client.engagementTypes.forEach(item => {
                if (item && CLIENT_ENGAGEMENT_TYPES.indexOf(item) === -1) {
                    CLIENT_ENGAGEMENT_TYPES.push(item);
                }
            });
        }
    });
    const engagementTypes = CLIENT_ENGAGEMENT_TYPES && CLIENT_ENGAGEMENT_TYPES.sort();
    callback({ success: true, engagementTypes });
  })
}

exports.getEngagementTypes = (req, res) => {
  const firmId = req.params.firmId;
  permissions.utilCheckFirmPermission(req.user, firmId, 'access', permission => {
    if (!permission) {
      logger.info('user does NOT have permission.')
      res.send({success: false, message: "You do not have permisson to this firm account."})
    } else {
      exports.getEngagementTypesByFirmId(firmId, response => {
        res.send(response);
      });
    }
  });
}

