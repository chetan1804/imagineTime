/**
 * Sever-side controllers for ClientTask.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientTask
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

// libraries
const async = require('async');

const ClientTask = require('./ClientTaskModel');
const ClientTaskResponse = require('../clientTaskResponse/ClientTaskResponseModel');
const ClientWorkflow = require('../clientWorkflow/ClientWorkflowModel');
const File = require('../file/FileModel')
const Firm = require('../firm/FirmModel');
const User = require('../user/UserModel');

const activitiesCtrl = require('../activity/activitiesController')
const clientTaskResponseCtrl = require('../clientTaskResponse/clientTaskResponsesController');
const clientWorkflowCtrl = require('../clientWorkflow/clientWorkflowsController')
const filesCtrl = require('../file/filesController');
const permissions = require('../../global/utils/permissions')
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

const assureSign = require('../../global/utils/assureSign')

let logger = global.logger;

const safeUserFields = [
  '_id', 'username', 'firstname', 'lastname', 'firstLogin'
]

exports.utilCheckAndGenerateActivity = (user, io, initialObj = {}, finalObj, callback = () => {}) => {
  console.log("client task utilCheckAndGenerateActivity")
  console.log(initialObj, finalObj)
  console.log("debug check")
  // this is the first one, but similar util should be copied for other resources as well
  
  /**
   * general:
   * see notes in activitiesController.utilCreateFromResource
   * this logic will determine whether to create an activity based on the resource changes
   * callback is optional and probably won't be used much (we will go ahead and return to the user before this)
   * initialObj is also optional (might be a create action)
   * 
   * this also determines whether or not to send to the client as well
   */

  /**
   * specific to clientTasks:
   * no activity is generate on create; this will be handled elsewhere by either the clientWorkflow being assigned or by the clientWorkflow updating.
   * 
   * 
   * (firm activity/client activity)
   * 1. "client task rejected"/"your task was rejected"
   *    status: awaitingApproval -> open
   * 
   * 2. "task available to client"/"new task available"
   *    status: anything else -> open
   * 
   * 3. "task awaiting approval"/"your task was submitted for approval"
   *    status: anything -> awaitingApproval
   * 
   * 4. "client completed a task"/"you completed a task"
   *    status: open -> completed
   * 
   * 5. "client task approved"/"your task has been approved"
   *    status: awaitingApproval -> completed
   * 
   * 6. "client signed a document"/"you signed a document"
   *    signature-request tasks only.
   *    status: open -> open
   * 
   * 7. more TBD
   * 
   */
  if(!initialObj.status || initialObj.status == finalObj.status) {
    if(initialObj.type !== 'signature-request') {
      console.log("debug 0");
      // 0. didnt change, return
      callback({success: true})
    } else {
      console.log("debug 6")
      // 6. A response was created for a signature task and the status is still "open".
      //    This means a user signed but we are still waiting for other users.
      activitiesCtrl.utilCreateFromResource(
        user._id, finalObj._firm, finalObj._client
        , `%USER% signed a document`
        , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
        , false, true
        , `%USER% signed a document`
        , `/portal/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
        , false, true
        , io
        , result => callback(result) 
      )
    }
  } else if(initialObj.status == "awaitingApproval" && finalObj.status == "open") {
    console.log("debug 1")
    // 1. 
    activitiesCtrl.utilCreateFromResource(
      user._id, finalObj._firm, finalObj._client
      , `%USER% rejected a client task`
      , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
      , false, true
      , `%USER% rejected a task`
      , `/portal/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
      , false, true
      , io
      , result => callback(result) 
    )
  } else if(finalObj.status == "open") {
    console.log("debug 2");
    callback({success: true})
    // This is hit when a task changes from "draft" to "open". We don't want notifications in this case because the user
    // will already get a notification when the workflow goes from "draft" to "published".
    // 2. 
    // activitiesCtrl.utilCreateFromResource(
    //   user._id, finalObj._firm, finalObj._client
    //   , `%USER% assigned a client a task`
    //   , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows`
    //   , false, false
    //   , `%USER% assigned you a task`
    //   , `/portal/${finalObj._client}/client-workflows`
    //   , false, false
    //   , io
    //   , result => callback(result) 
    // )
  } else if(finalObj.status == "awaitingApproval") {
    console.log("debug 3");
    // NOTE: only one that is actually testable from the UI right now
    // 3. 
    activitiesCtrl.utilCreateFromResource(
      user._id, finalObj._firm, finalObj._client
      , `%USER% submitted an item for approval`
      , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}` // not sure a route exists for this?
      , false, true
      , `%USER% submitted an item for approval` // in this case, both messages are the same
      , `/portal/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}` // we talked about giving this it's own route too I think
      , false, true
      , io
      , result => callback(result) // pass along even if we never use it
    )

  } else if(initialObj.status == "open" && finalObj.status == "completed") {
    console.log("debug 4");
    // 4. 
    activitiesCtrl.utilCreateFromResource(
      user._id, finalObj._firm, finalObj._client
      , `%USER% completed a client task`
      , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
      , false, true
      , `%USER% completed a task`
      , `/portal/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
      , false, true
      , io
      , result => callback(result) 
    )
  } else if(initialObj.status == "awaitingApproval" &&finalObj.status == "completed") {
    console.log("debug 5");
    // 5. 
    activitiesCtrl.utilCreateFromResource(
      user._id, finalObj._firm, finalObj._client
      , `%USER% approved a client task`
      , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
      , false, true
      , `%USER% approved a client task`
      , `/portal/${finalObj._client}/client-workflows/${finalObj._clientWorkflow}`
      , false, true
      , io
      , result => callback(result) 
    )
  } else {
    // no need to generate activity
    console.log("end")
  }
}

exports.utilSearch = (vectorQueryString, firmId = null, firmClientIds = null, clientId = null, callback) => {
  console.log("CLIENTASK UTIL SEARCH", vectorQueryString, clientId)
  if (vectorQueryString && vectorQueryString.indexOf('-AMPERSAND-') > -1) {
    vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '&');
  }
  vectorQueryString = vectorQueryString && vectorQueryString.trim().toLowerCase();
  
  // 3 types, which may end up being more different later
  // admin, firm, client
  if(clientId) {
    // client search
    ClientTask.query()
    .where({_client: clientId})
    .whereNot({status: 'draft'})
    .whereRaw('LOWER(title) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(title) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clientTasks => {
      callback({success: true, clientTasks})
    })
  } else if(firmId && firmClientIds) {
    // firm non-admin search
    ClientTask.query()
    .where({_firm: firmId})
    .where(builder => {
      builder
      .whereIn('_client', firmClientIds)
      .orWhereNull('_client')
    })
    .whereRaw('LOWER(title) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(title) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clientTasks => {
      callback({success: true, clientTasks})
    })
  } else if(firmId) {
    // firm search
    ClientTask.query()
    .where({_firm: firmId})
    .whereRaw('LOWER(title) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(title) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clientTasks => {
      callback({success: true, clientTasks})
    })
  } else {
    // ADMIN search
    ClientTask.query()
    .whereRaw('LOWER(title) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
        queryArr.map(item => {
          builder.orWhereRaw('LOWER(title) LIKE ?', `%${item}%`)
        });
      }
    })
    .then(clientTasks => {
      callback({success: true, clientTasks})
    })
  }
}

exports.list = (req, res) => {
  ClientTask.query()
  .then(clientTasks => {
    res.send({success: true, clientTasks})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientTasks queried from the array of _id's passed in the query param
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
    // ClientTask.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTasks) => {
    //     if(err || !clientTasks) {
    //       res.send({success: false, message: `Error querying for clientTasks by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientTasks.length == 0) {
    //       ClientTask.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTasks) => {
    //         if(err || !clientTasks) {
    //           res.send({success: false, message: `Error querying for clientTasks by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientTasks});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientTasks});
    //     }
    // })
    ClientTask.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTasks) => {
        if(err || !clientTasks) {
          res.send({success: false, message: `Error querying for clientTasks by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientTasks});
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
    ClientTask.query()
    .where(query)
    .then(clientTasks => {
      res.send({success: true, clientTasks})
    })
  }
}

exports.search = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  // search by query parameters
  // NOTE: It's up to the front end to make sure the params match the model
  let mongoQuery = {};
  let page, per;

  for(const key in req.query) {
    if(req.query.hasOwnProperty(key)) {
      if(key == "page") {
        page = parseInt(req.query.page);
      } else if(key == "per") {
        per = parseInt(req.query.per);
      } else {
        logger.debug("found search query param: ", key);
        mongoQuery[key] = req.query[key];
      }
    }
  }

  logger.info(mongoQuery);
  if(page || per) {
    page = page || 1;
    per = per || 20;
    ClientTask.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientTasks) => {
      if(err || !clientTasks) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientTasks: clientTasks
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientTask.find(mongoQuery).exec((err, clientTasks) => {
      if(err || !clientTasks) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientTasks: clientTasks });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get task by id');
  ClientTask.query().findById(req.params.id)
  .asCallback((err, clientTask) => {
    if(err || !clientTask) {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: "ClientTask not found"})
    } else {
      res.send({success: true, clientTask})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get task schema ');
  res.send({success: true, schema: ClientTask.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get task default object');
  res.send({success: true, defaultObj: ClientTask.defaultObject});
  // res.send({success: false})
}

exports.updateStatus = (req, res) => {
  console.log("client task - update status")
  // just a front end for the util
  exports.utilUpdateStatus(req.user, req.io, req.params.id, req.params.status, result => {
    res.send(result);
  })
}

exports.utilUpdateStatus = (user, io, clientTaskId, newStatus, cb) => {
  // PENDING PENDING PENDING - needs api route
  // NOTE: this is based on the still-needs-to-be-discussed changes to the clientTask statuses
  // would replace "utilUpdateStatusOnResponse" below

  // tentative way to change statuses, which will let us:
  // 1. check permissions on these statuses
  // 2. generate activities

  ClientTask.query()
  .findById(clientTaskId)
  .asCallback((err, oldClientTask) => {
    if(err || !oldClientTask) {
      cb({success: false, message: err || 'error finding clientTask by id.'})
    } else {
      // TODO: permission checks
      let updateFields = {
        "status": newStatus
      }
      if(oldClientTask.needsApproval && newStatus == "completed") {
        // staff is approving
        updateFields._approvedBy = user._id
      } else if(oldClientTask.needsApproval && newStatus == "awaitingApproval") {
        // client is requesting approval
        updateFields._completedBy = user._id
      } else if(newStatus == "completed") {
        // doesnt need approval, client is completing
        updateFields._completedBy = user._id
      }

      ClientTask.query()
      .findById(clientTaskId)
      .update(updateFields)
      .returning('*')
      .asCallback((err, clientTask) => {
        if(err || !clientTask) {
          cb({ success: false, message: err || 'error updating clientTask'})
        } else {
          logger.info('clientTask status successfully updated.')
          exports.utilCheckAndGenerateActivity(user, io, oldClientTask, clientTask)
          cb({ success: true, clientTask })
        }
      });
    }
  })
}

/**
 * NOTE: The method below determines the new status of a clientTask when a clienTaskResponse is created.
 * Updates the status to "completed" or "awaitingApproval" depending on clientTask.needsApproval
 */
exports.utilUpdateStatusOnResponse = (user, io, clientTaskResponse, cb) => {
  logger.info('Begin updating status on response')
  const clientTaskId = parseInt(clientTaskResponse._clientTask);
  ClientTask.query()
  .findById(clientTaskId)
  .asCallback((err, oldClientTask) => {
    if(err || !oldClientTask) {
      cb({ success: false, message: err || "Error finding clientTask"})
    } else if(oldClientTask.type === 'signature-request') {
      /**
       * NOTE: signature-request tasks require a special catch. Two scenerios can occur here:
       *  1. No file is attached. This means we are still waiting for at least one signer. In this case we keep the status "open".
       *  2. A file is attached. This means the last person just signed and we have the signed document. Change status to "awaitingApproval"
       *     or "completed" depending on clientTask.needsApproval.
       */
      let newStatus;
      // If the clientTaskResponse has a file attached, the last signature was just completed.
      if(clientTaskResponse._files && clientTaskResponse._files[0]) {
        // this is the last signing link, go ahead and update the status.
        if(oldClientTask.needsApproval) {
          newStatus = "awaitingApproval"
        } else {
          newStatus = "completed"
        }
      } else {
        // We are still waiting on at least one signer. Keep the status "open".
        newStatus = "open"
      }
      exports.utilUpdateStatus(user, io, clientTaskId, newStatus, result => {
        if(result.success) {
          cb({ success: true, clientTask: result.clientTask })
        } else {
          cb(result)
        }
      })
    } else {
      let newStatus;
      if(oldClientTask.needsApproval) {
        newStatus = "awaitingApproval"
      } else {
        newStatus = "completed"
      }
      exports.utilUpdateStatus(user, io, clientTaskId, newStatus, result => {
        if(result.success) {
          cb({ success: true, clientTask: result.clientTask })
        } else {
          cb(result)
        }
      })
    }
  })
}

exports.create = (req, res) => {
  logger.info('creating new task');
  let clientTask = req.body;
  clientTask._createdBy = req.user._id;
  ClientTask.query().insert(clientTask)
  .returning('*')
  .then(clientTask => {
    if(clientTask) {
      res.send({success: true, clientTask})
    } else {
      res.send({ success: false, message: "Could not save ClientTask"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating task');
  req.body.signingLinks = JSON.stringify(req.body.signingLinks) // arrays have to be stringified before saving.
  const clientTaskId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientTask.query()
  .findById(clientTaskId)
  .then(oldClientTask => {
    
    ClientTask.query()
    .findById(clientTaskId)
    .update(req.body) //valiation? errors?? 
    .returning('*') // doesn't do this automatically on an update
    .then(clientTask => {
      
      exports.utilCheckAndGenerateActivity(req.user, req.io, oldClientTask, clientTask)
      
      console.log("clientTask", clientTask)
      res.send({success: true, clientTask})
    })
  })
}

exports.staffDelete = (req, res) => {
  /**
   * When building a workflow, staff might add the wrong type of clientTask or decide they don't need a clientTask they've added.
   * At this point its lifecycle, it should be safe to delete the clientTask since nobody has yet interacted with it.
   * This method will ONLY allow clientTask deletion in one of the following situations:
   * 
   *  1. The clientTask has a status of "draft", meaning it was added to a published workflow, but has not yet been made visible to the client.
   * 
   *  2. The clientTask belongs to a clientWorkflow with a status of "draft", meaning that the clientWorkflow is still being built.
   * 
   */
  const clientTaskId = parseInt(req.params.id) // has to be an int
  logger.info("Starting staffDelete of clientTask.")
  // First find the clientTask
  ClientTask.query()
  .findById(clientTaskId)
  .asCallback((err, clientTask) => {
    if(err) {
      logger.error("Problem fetching clientTask.")
      logger.error(err)
      res.send({success: false, message: err})
    } else {
      logger.info("Found clientTask. Checking user permission.")
      // Now check permission
      permissions.utilCheckClientPermission(req.user, clientTask._client, "access", permission => {
        if(!permission) {
          logger.info("user does NOT have permission.")
          res.send({success: false, message: "You do not have permisson to delete this clientTask."})
        } else {
          logger.info("user has permission.")
          // User has permisson. Check the clientTask status.
          if(clientTask.status === "draft") {
            // safe to delete.
            logger.info("attempting to delete clientTask with status of draft")
            exports.utilDelete(clientTask._id, result => {
              if(!result.success) {
                res.send({success: false, message})
              } else {
                res.send({success: true, clientTask})
              }
            });
          } else {
            logger.info("clientTask is not a draft. Checking parent clientWorkflow status.")
            // the clientTask isn't a draft. Check the status of the clientWorkflow.
            clientWorkflowCtrl.utilGetById(clientTask._clientWorkflow, result => {
              if(!result.success) {
                logger.error("Problem fetching clientWorkflow")
                logger.error(result.message)
                res.send({success: false, message: result.message})
              } else {
                const clientWorkflow = result.clientWorkflow
                if(clientWorkflow.status !== "draft") {
                  logger.info("clientWorkflow is not a draft. Not deleting clientTask.")
                  // clientWorkflow is either "published" or "archived". Can't delete this clientTask.
                  res.send({success: false, message: "You cannot delete a clientTask that has been made available to a client."})
                } else {
                  // safe to delete.
                  logger.info("attempting to delete clientTask on clientWorflow with a status of draft.")
                  exports.utilDelete(clientTask._id, result => {
                    if(!result.success) {
                      res.send({success: false, message})
                    } else {
                      res.send({success: true, clientTask})
                    }
                  });
                }
              }
            });
          }
        }
      });
    }
  });
}

exports.delete = (req, res) => {
  logger.warn("deleting task");
  // TODO: needs testing and updating
  const clientTaskId = parseInt(req.params.id) // has to be an int

  ClientTask.query()
  .findById(clientTaskId)
  .del()
  .returning('*')
  .asCallback((err, clientTask) => {
    if(err) {
      logger.error(err)
      res.send({success: false, message: err});
    } else {
      console.log("clientTask deleted: ", clientTask)
      res.send({success: true, clientTask})
    }
  });
}

exports.utilDelete = (clientTaskId, callback) => {
  ClientTask.query()
  .findById(clientTaskId)
  .del()
  .returning('*')
  .asCallback((err, clientTask) => {
    if(err) {
      logger.error("Problem deleting clientTask", clientTask)
      logger.error(err)
      callback({success: false, message: "Error deleting clientTask."})
    } else {
      console.log("clientTask deleted: ", clientTask)
      callback({success: true, clientTask})
    }
  });
}

exports.utilCreate = (clientTask, callback) => {
  logger.info("Creating new clientTask")
  ClientTask.query().insert(clientTask)
  .returning('*')
  .asCallback((err, clientTask) => {
    if(err || !clientTask) {
      callback({success: false, message: err || "Could not save ClientTask"})
    } else {
      callback({success: true, clientTask})
    }
  });
}

exports.utilGetReminderTasksByClient = (clientId, callback) => {
  const today = new Date()
  let soon = new Date();
  soon.setDate(today.getDate() + 30)
  const overdueQuery = `_client = ${parseInt(clientId)} AND status = 'open' AND "dueDate" < '${today.toISOString()}'`
  const dueSoonQuery = `_client = ${parseInt(clientId)} AND status = 'open' AND "dueDate" < '${soon.toISOString()}' AND "dueDate" >= '${today.toISOString()}'`
  async.parallel({
    overdue: cb => {
      ClientTask.query()
      .whereRaw(overdueQuery)
      .asCallback((err, clientTasks) => {
        if(err || !clientTasks) {
          cb(err || "Problem finding overdue clientTasks.")
        } else {
          cb(null, clientTasks)
        }
      });
    }
    , dueSoon: cb => {
      ClientTask.query()
      .whereRaw(dueSoonQuery)
      .asCallback((err, clientTasks) => {
        if(err || !clientTasks) {
          cb(err || "Problem finding due soon clientTasks.")
        } else {
          cb(null, clientTasks)
        }
      });
    }
  }, (err, results) => {
    if(err || !results) {
      logger.error("ERROR")
      logger.info(err)
      callback(err)
    } else {
      callback(null, results)
    }
  })
}

exports.prepareForSignature = (req, res) => {
  logger.info("Preparing document for signature.")
  /**
   * req.body should look like this:
   * body: {
   *  templateId: "String"
   *  , fileId: "String"
   *  , signers: [
   *      userId
   *      , userId
   *  ]
   * }
   */
  // console.log('req.body', req.body);
  
  // signers is an array of userIds. Need to fetch the user objects and construct signer objects for each.
  if(!req.body.signers || req.body.signers.length < 1) {
    res.send({ success: false, message: "ERROR: Missing required signer in request."})
  } else {
    User.query()
    .select(...safeUserFields)
    .whereIn('_id', req.body.signers)
    .asCallback((err, signers) => {
      if(err || !signers) {
        res.send({ success: false, message: "ERROR: Unable to locate signer info." })
      } else {
        const clientTaskId = parseInt(req.params.id);
        ClientTask.query()
        .findById(clientTaskId)
        .asCallback((err, clientTask) => {
          if(err || !clientTask) {
            res.send({success: false, message: err || "Error finding clientTask."})
          } else {
            // We need an authToken from assureSign before we can do anything.
            assureSign.getAuthToken(result => {
              if(!result.success) {
                res.send(result)
              } else {
                const authToken = result.token;
                const templateId = req.body.templateId
                // Now fetch the blank template, we'll fill it out with the rest of the info on req.body.
                assureSign.getTemplateById(authToken, templateId, result => {
                  if(!result.success) {
                    res.send(result)
                  } else {
                    template = result.template;
                    // This method will attach the file (if one is present) and the signers to the template and return a prepared envelopeId.
                    // We only allow one file to be uploaded to a signature request. So we'll pass clientTask._files[0].
                    assureSign.prepareEnvelope(authToken, clientTask._files[0], signers, template, result => {
                      if(!result.success) {
                        res.send(result)
                      } else {
                        // We could call prepareEnvelope again if we wanted to change anything.
                        // Now that we are done building the envelope we have to submit it.
                        const preparedEnvelopeId = result.preparedEnvelopeId
                        assureSign.submitPreparedEnvelope(authToken, preparedEnvelopeId, result => {
                          // console.log("RESULT OF SUBMIT PREPARED ENVELOPE");
                          // logger.info(result)
                          if(!result.success) {
                            res.send(result)
                          } else {
                            const finalEnvelopeId = result.finalEnvelopeId;
                            // We have our final envelopeId.
                            // Fetch the firm so we can use firm.domain to build the redirectUrl.
                            Firm.query()
                            .findById(clientTask._firm)
                            .asCallback((err, firm) => {
                              if(err || !firm) {
                                res.send({success: false, message: "Unable to locate firm. Please try again.", err})
                              } else {
                                // set custom url, if applicable
                                let firmUrl = appUrl;

                                if(firm && firm.domain) {
                                  firmUrl = firm.domain;
                                }
                                // Pass the finalEnvelopeId and the redirect url. Returns same finalEnvelopeId and signingLinks.
                                // We're adding clientTask as a query param in the redirectUrl so we can catch for it on the frontend after signing.
                                let redirectUrl = encodeURI(`http://${firmUrl}/portal/${clientTask._client}/client-workflows/${clientTask._clientWorkflow}/?clientTask=${clientTask._id}`)
                                assureSign.getSigningLinks(authToken, finalEnvelopeId, redirectUrl, result => {
                                  if(!result.success) {
                                    res.send(result)
                                  } else {
                                    // save the signingLink and envelopeId on the clientTask and return the clientTask to the front end.
                                    const signingLinks = result.signingLinks
                                    clientTask.envelopeId = signingLinks[0].envelopeID;
                                    clientTask.signingLinks = JSON.stringify(signingLinks);
                                    clientTask.assureSignTemplateId = templateId;
                                    ClientTask.query()
                                    .findById(clientTask._id)
                                    .update(clientTask)
                                    .returning('*')
                                    .asCallback((err, updatedClientTask) => {
                                      if(err || !updatedClientTask) {
                                        logger.error("ERROR: ")
                                        logger.info(err || "Unable to update clientTask.", clientTask._id)
                                        res.send({success: false, message: "Unable to update clientTask. Please try again.", err})
                                      } else {
                                        // console.log("Client Task Updated! ", updatedClientTask);
                                        res.send({ success: true, clientTask: updatedClientTask })
                                      }
                                    })
                                  }
                                })
                              }
                            })
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  }
}

exports.finalizeSignature = (req, res) => {
  /**
   * Here's what needs to happen:
   * 1. Fetch the signed document.
   * 2. Save it as a file.
   * 3. Create a clientTaskResponse with a reference to the file.
   * 4. Update the clientTask status
   * 5. Return the updated clientTask to the frontend.
   */
  const clientTaskId = parseInt(req.params.id);
  ClientTask.query()
  .findById(clientTaskId)
  .asCallback((err, clientTask) => {
    if(err || !clientTask) {
      res.send({ success: false, message: "ClientTask not found" })
    } else {
      // fetch the file on clientTask so we can use the filename on the new file.
      File.query()
      .findById(clientTask._files[0])
      .asCallback((err, file) => {
        if(err || !file) {
          res.send({ success: false, message: "Original file not found" })
        } else {
          // Always need to get an authToken before hitting the assureSign API.
          assureSign.getAuthToken(result => {
            if(!result.success) {
              res.send(result)
            } else {
              // We have the auth token (result.token) now put together the request.
              const authToken = result.token;
              // If we decide to use an envelope password it would be passed below in place of null.
              assureSign.getSignedDocument(authToken, null, clientTask.envelopeId, result => {
                if(!result.success) {
                  res.send(result)
                } else {
                  // We have the signed document. Now save it as a file.
                  const signedDocument = result.signedDocument
                  const filePointers = {
                    category: file.category
                    , contentType: file.contentType
                    , fileExtension: file.fileExtension
                    , filename: `Signed_${file.filename}`
                    , status: file.status
                    , _firm: clientTask._firm
                    , _user: req.user ? req.user._id : null
                    , _client: clientTask._client
                    , _tags: [] // TODO: Should we add the original file tags and "signed" here?
                  }
                  filesCtrl.utilCreateFromBase64(signedDocument, filePointers, false, result => {
                    if(!result.success) {
                      res.send(result)
                    } else {
                      // The signed document has been saved. Now create a clientTaskResponse.
                      const clientTaskResponse = {
                        _user: req.user._id
                        , _clientTask: clientTask._id
                        , _clientWorkflow: clientTask._clientWorkflow
                        , _files: [result.file._id]
                      }
                      clientTaskResponseCtrl.utilCreate(clientTaskResponse, req.user, req.io, result => {
                        if(!result.success) {
                          res.send({ success: false, message: err || "Could not save ClientTaskResponse"})
                        } else {
                          // send the updated client task back.
                          ClientTask.query()
                          .findById(clientTask._id)
                          .asCallback((err, clientTask) => {
                            if(err || !clientTask) {
                              logger.error("ERROR: ")
                              logger.info(err || "Unable to find updated clientTask.", clientTask._id)
                              res.send({ success: false, message: "Updated clientTask not found" })
                            } else {
                              res.send({ success: true, clientTask})
                            }
                          })
                        }
                      })
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
