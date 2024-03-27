/**
 * Sever-side controllers for Note.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Note
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

// import controller from resource 
const permissions = require('../../global/utils/permissions.js');
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const async = require('async');

const Request = require('./RequestModel');
const Activity = require('../activity/ActivityModel');
const RequestTask = require('../requestTask/RequestTaskModel');
const RequestFolder = require('../requestFolder/RequestFolderModel');
const { raw } = require('objection');
const Firm = require('../firm/FirmModel.js');

let logger = global.logger;

exports.list = (req, res) => {
  Request.query()
  .then(request => {
    res.send({success: true, request})
  })
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
        query['request.'+ nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }

    let newQuery = {}
    Object.keys(query).map(keyName => {
      newQuery['request.' + keyName] = query[keyName];
    });

    Request.query()
    .leftJoin(
      RequestTask.query()
      .select(
        "_request" // 
        , raw('array_length("_returnedFiles", 1) as totaluploadedfiles')
      )
      .as('requesttask')
      , 'requesttask._request'
      , 'request._id'
    )
    .where(newQuery)
    .select([
      'request.*'
    ])
    .where(builder => {
      if (!(query && query._client)) {
        builder.whereNull('_client')
      }
    })
    .sum('requesttask.totaluploadedfiles as totalUploadedFiles')
    .groupBy('request._id')
    .then(requests => {
      if (requests) {
        res.send({success: true, request: requests });
      } else {
        res.send({success: true, request: [] })
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get request by id');
  Request.query()
    .leftJoin(
      RequestTask.query()
      .select(
        "_request" // 
        , raw('array_length("_returnedFiles", 1) as totaluploadedfiles')
      )
      .as('requesttask')
      , 'requesttask._request'
      , 'request._id'
    )
    .where({ 'request._id': req.params.id })
    .select([
      'request.*'
    ])
    .sum('requesttask.totaluploadedfiles as totalUploadedFiles')
    .groupBy('request._id')
    .first()
    .then(requests => {
      if (requests) {
        res.send({success: true, request: requests });
      } else {
        res.send({success: true, request: [] })
      }
    });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get request schema ');
  res.send({success: true, schema: Request.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get note default object');
  res.send({success: true, defaultObj: Request.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  const { _firm, _client } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
    } else {

      req.body._createdBy = req.user._id
      Request.query().insert(req.body).returning("*")
        .asCallback((err, request) => {
          if (err && !request) {
            res.send({ success: false, message: "Failed to create." });
          } else {

            if (_client) {

              // add staff activity
              Activity
                .query()
                .insert({
                  isReminder: false
                  , link: `/firm/${_firm}/workspaces/${_client}/request-list/${request._id}/unpublished`
                  , sendEmail: false
                  , text: `%USER% created a request list`
                  , _firm
                  , _client: _client
                  , _user: request._createdBy
                })
                .returning("*")
                .then(activity => {
                  res.send({ success: true, request, activity });
                });
            } else {
              res.send({ success: true, request });
            }
          }
        });
    }
  });
}


exports.update = (req, res) => {
  const { _firm } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
    } else {

      if (req.params.id != req.body._id) {
        res.send({ success: false, message: "Error to find target request" });
      } else {
        delete req.body.requestTasks;
        delete req.body.totalUploadedFiles;
        Request.query()
        .findById(req.params.id)
        .update(req.body)
        .returning("*")
        .then(request => {
          if (!request) {
            res.send({ success: false, message: "Failed to update." });
          } else {
            res.send({ success: true, request });
          }
        });
      }
    }
  });
}

exports.portalRequest = (req, res) => {
  logger.info('get request by id');
  if (req.user) {
    Request.query()
    .where('_client', req.params.clientId)
    .then(requests => {
      if(requests) {
        async.filter(requests, (request, cb) => {
          if (request.delegatedAdmin.length && request.delegatedAdmin.includes(req.user._id)) {
            RequestTask.query().where('_request', request._id).then(requestTasks => {
              request["requestTasks"] = 0;
              if (requestTasks) {
                request["requestTasks"] = requestTasks.length;
              }
              cb(null, request);
            });
          } else {
            cb(null, null);
          }
        }, (err, result) => {
          res.send({success: true, request: result })
        });
      } else {
        res.send({success: false, message: "Request not found"});
      }
    });
  } else {
    res.send({success: false, message: "Request not found"})
  }
}

exports.bulkCreate = (req, res) => {

  const requestId = req.body.requestId;
  const selectedClientId = req.body.selectedClientId;
  const firmId = req.body.firmId;

  Firm.query().findById(firmId)
  .then(firm => {
    if (!firm) {
      res.send({ success: false, message: "firm not found." })
    } else {
      let firmUrl = appUrl;
      if(firm && firm.domain) {
        firmUrl = firm.domain;
      }

      permissions.utilCheckisStaffOwner(req.user, firmId, permission => {
        if (!permission) {
            res.send({success: false, message: "You do not have permission to access this Action"});
        } else {

          Request.query().findById(requestId)
          .then(request => {
            if (!request) {
              res.send({ success: false, message: "request not found." });
            } else {

              RequestTask.query().where({ _request: request._id })
              .then(requestTasks => {

                let socketId = req.user._id;
                let progress = 0;
                let totalProgressAttempt = 1;
                const dRequest = {
                  _createdBy: socketId
                  , _firm: firm._id
                  , type: request.type
                  , name: request.name
                }

                async.map(selectedClientId, (clientId, callback) => {
                  dRequest._client = clientId;

                  Request.query().insert(dRequest).returning('*')
                  .asCallback((err, newRequest) => {

                    progress = (100 / selectedClientId.length) *  totalProgressAttempt;
                    req.io.to(socketId).emit('upload_status', Math.floor(progress));
                    totalProgressAttempt++;

                    if (newRequest && newRequest._id && requestTasks && requestTasks.length) {

                      const dRequestTasks = requestTasks.map(item => {
                        const dRequestTask = {
                          _createdBy: socketId
                          , _client: newRequest._client
                          , _request: newRequest._id
                          , category: item.category
                          , description: item.description
                          , dueDate: item.dueDate
                          , status: item.status
                        }

                        dRequestTask.hex = Math.floor(Math.random()*16777215).toString(16)
                            + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                            + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                            + Math.floor(Math.random()*16777215).toString(16); // we can make this bigger if needed?
                        dRequestTask.url = `https://${firmUrl}/request/request-task/${dRequestTask.hex}`;
                        return dRequestTask;
                      });

                      RequestTask.query().insert(dRequestTasks).returning('*')
                      .asCallback((err, newRequestTasks) => {
                        console.log("newRequestTasks", newRequestTasks)
                        callback(err);
                      });
                    } else {
                      callback(err);
                    }
                  });
                }, (err) => {
                  if (!err) {
                    res.send({ success: true });
                  } else {
                    res.send({ success: false, message: err });
                  }
                });
              });
            }
          });
        }
      });
    }
  });
}