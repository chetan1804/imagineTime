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

const RequestFolder = require('./RequestFolderModel')
const Request = require('../request/RequestModel');
const Activity = require('../activity/ActivityModel');
const RequestTask = require('../requestTask/RequestTaskModel');

let logger = global.logger;

exports.list = (req, res) => {
  RequestFolder.query()
  .then(data => {
    res.send({success: true, data})
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
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }
    RequestFolder.query()
    .where(query)
    .then(data => {
      if (data) {
        res.send({success: true, data });
        // async.map(requests, (request, cb) => {
        //   RequestTask.query().count().where('_request', request._id).then(requestTasks => {
        //     request["requestTasks"] = requestTasks[0].count;
        //     cb(null, request);
        //   });
        // }, (err, result) => {
        //   res.send({success: true, request: result });
        // });
      } else {
        res.send({success: true, data: [] })
      }
    })
  }
}

exports.getById = (req, res) => {
  logger.info('get request by id');
  RequestFolder.query().findById(req.params.id)
  .then(requestFolder => {
    if(requestFolder) {
      res.send({success: true, requestFolder})
    } else {
      res.send({success: false, message: "Request not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get request schema ');
  res.send({success: true, schema: RequestFolder.jsonSchema});
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
  res.send({success: true, defaultObj: RequestFolder.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  const { _firm, _client } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
    } else {

      req.body._createdBy = req.user._id;
      RequestFolder.query()
        .insert(req.body)
        .returning("*")
        .then(data => {
          if (!data) {
            res.send({ success: false, message: "Failed to create." });
          } else {
            if (_client) {
              // add staff activity
              Activity
                .query()
                .insert({
                  isReminder: false
                  , link: `/firm/${_firm}/workspaces/${_client}/request-folder/${data._id}/unpublished`
                  , sendEmail: false
                  , text: `%USER% created a request folder`
                  , _firm
                  , _client: _client
                  , _user: data._createdBy
                })
                .returning("*")
                .then(activity => {
                  res.send({ success: true, requestFolder: data, activity });
                });
            } else {
              res.send({ success: true, requestFolder: data });
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
        RequestFolder.query()
        .findById(req.params.id)
        .update(req.body)
        .returning("*")
        .then(data => {
          if (!data) {
            res.send({ success: false, message: "Failed to update." });
          } else {
            res.send({ success: true, requestFolder: data });
          }
        });
      }
    }
  });
}