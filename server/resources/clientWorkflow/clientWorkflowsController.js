/**
 * Sever-side controllers for ClientWorkflow.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientWorkflow
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientWorkflow = require('./ClientWorkflowModel');
const ClientTaskTemplate = require('../clientTaskTemplate/ClientTaskTemplateModel');

const activitiesCtrl = require('../activity/activitiesController');
const clientTaskCtrl = require('../clientTask/clientTasksController');
const logger = global.logger;
const sqlUtils = require('../../global/utils/sqlUtils');

const async = require('async');

exports.utilCheckAndGenerateActivity = (user, io, initialObj = {}, finalObj, callback = () => {}) => {
  console.log("clientWorkflow utilCheckAndGenerateActivity")

  /**
   * activities specific to clientWorkflows:
   * 
   * (firm activity/client activity)
   * 1. "clientWorkflow was published"/"clientWorkflow was published"
   *    status: anything => published
   * 
   * 2. "clientWorkflow was archived"/null
   *    status: anything => archived
   */

  if(!initialObj.status || initialObj.status == finalObj.status) {
    // 0. didnt change, return
    callback({success: true})
  } else if(finalObj.status == "published") {
    // 1.
    activitiesCtrl.utilCreateFromResource(
      user._id, finalObj._firm, finalObj._client
      , `%USER% published a client clientWorkflow`
      , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._id}`
      , false, false
      , `%USER% sent you a new clientWorkflow`
      , `/portal/${finalObj._client}/client-workflows/${finalObj._id}`
      , false, true // isReminder, sendEmail
      , io
      , result => callback(result)
    )
  } else if(finalObj.status == "archived") {
    // 2.
    activitiesCtrl.utilCreateFromResource(
      user._id, finalObj._firm, finalObj._client
      , `%USER% archived a client clientWorkflow`
      , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/client-workflows/${finalObj._id}`
      , false, false
      , null // client never needs to see this
      , null
      , false, false
      , io
      , result => callback(result)
    )
  }

}

exports.utilSearch = (vectorQueryString, firmId = null, firmClientIds = null, clientId = null, callback) => {
  console.log("CLIENT_WORKFLOW UTIL SEARCH", vectorQueryString, clientId)

  if (vectorQueryString && vectorQueryString.indexOf('-AMPERSAND-') > -1) {
    vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '&');
  }
  vectorQueryString = vectorQueryString && vectorQueryString.trim().toLowerCase();

  // console.log('vectorQueryString workflow',vectorQueryString, specialQueryString)

  // 3 types, which may end up being more different later
  // admin, firm, client
  if(clientId) {
    // client search
    ClientWorkflow.query()
    .where({_client: clientId, status: 'published'})
    .whereRaw('LOWER(title) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
          queryArr.map(item => {
              builder.orWhereRaw('LOWER(title) LIKE ?', `%${item}%`)
          });
      }
    })
    .then(clientWorkflows => {
      callback({success: true, clientWorkflows})
    })
  } else if(firmId && firmClientIds) {
    // firm non-admin search
    ClientWorkflow.query()
    // note: needs testing. it looks like "or" creates a new branch and things need to be repeated
    // NOTE: Fixed "or" issue with a sub query.
    .where({_firm: firmId})
    .where(builder => {
      builder
      .whereIn('_client', firmClientIds)
      .orWhereNull('_client');
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
    .then(clientWorkflows => {
      callback({success: true, clientWorkflows})
    })
  } else if(firmId) {
    // firm search
    ClientWorkflow.query()
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
    .asCallback((err, clientWorkflows) => {
      console.log("err", err)
      callback({success: true, clientWorkflows})
    })
  } else {
    // ADMIN search
    ClientWorkflow.query()
    .whereRaw('LOWER(title) LIKE ?', `%${vectorQueryString}%`)
    .where(builder => {
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
          queryArr.map(item => {
              builder.orWhereRaw('LOWER(title) LIKE ?', `%${item}%`)
          });
      }
    })
    .then(clientWorkflows => {
      callback({success: true, clientWorkflows})
    })
  }
}

exports.list = (req, res) => {
  ClientWorkflow.query()
  .then(clientWorkflows => {
    res.send({success: true, clientWorkflows})
  })
}

exports.listByClientWorkflow = (req, res) => {
  logger.info('Find all sub-clientWorkflows actively associated with this clientWorkflow: ', req.params.clientWorkflowId);

  ClientWorkflow.query()
  .findById(parseInt(req.params.clientWorkflowId))
  .then(clientWorkflow => {
    if(!clientWorkflow) {
      res.send({success: false, message: "Unable to locate ClientWorkflow"})
    } else {
      // Since "items" holds tasks AND clientWorkflows, filter out undefined values resulting from item being a task instead of a clientWorkflow.
      let clientWorkflowIds = clientWorkflow.items.map(item => item._clientWorkflow).filter(clientWorkflowId => clientWorkflowId);
      // console.log('clientWorkflowIds', clientWorkflowIds)
      ClientWorkflow.query()
      .findByIds(clientWorkflowIds)
      // .whereIn('_id', clientWorkflowIds) // needs to be tested
      .then(clientWorkflows => {
        if(!clientWorkflows) {
          res.send({success: false, message: "Unable to locate ClientWorkflows"})
        } else {
          res.send({success: true, clientWorkflows: clientWorkflows});
        }
      })
      .catch(err => {
        logger.error("ERROR: ")
        logger.info(err)
        res.send({success: false, message: err})
      })
    }
  })
}


exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientWorkflows queried from the array of _id's passed in the query param
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
    // ClientWorkflow.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientWorkflows) => {
    //     if(err || !clientWorkflows) {
    //       res.send({success: false, message: `Error querying for clientWorkflows by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientWorkflows.length == 0) {
    //       ClientWorkflow.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientWorkflows) => {
    //         if(err || !clientWorkflows) {
    //           res.send({success: false, message: `Error querying for clientWorkflows by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientWorkflows});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientWorkflows});
    //     }
    // })
    ClientWorkflow.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientWorkflows) => {
        if(err || !clientWorkflows) {
          res.send({success: false, message: `Error querying for clientWorkflows by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientWorkflows});
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
    [req.params.refKey]: req.params.refId === 'null' ? null : parseInt(req.params.refId)
  }
  // test for optional additional parameters
  const nextParams = req.params['0'];
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    let tagIds = [];

    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {

        // special catch for tag queries
        // they should be separated by commas
        if(nextParams.split("/")[i] == "_tags") {
          // raw tag id: allow multiple tags in query
          // console.log(nextParams.split("/")[i+1].split(","))

          tagIds = tagIds.concat(nextParams.split("/")[i+1].split(","))

        } else if(nextParams.split("/")[i] == "tags") {
          // case: passed in the tag STRINGS
          // we need to first query the tag objects from their ids before fetching the file objects
          let tagNames = nextParams.split("/")[i+1].split(",")
          query.tags = tagNames;
          // we will catch for thiss down below and do some additional db calls
        } else {
          query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
        }
      }
    }
    // console.log('QUERY', query);
    if(tagIds && tagIds.length > 0) {
      // console.log("TAGIDS", tagIds)
      // query with specific tagIds
      let rawQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
      ClientWorkflow.query()
      // .debug(true)
      .where(query)
      .whereRaw(...rawQuery)
      .then(clientWorkflows => {
        res.send({success: true, clientWorkflows})
      })
      .catch(err => {
        logger.error("ERROR: ")
        logger.info(err)
        res.send({success: false, message: err})
      })
    } else {
      // regular query
      ClientWorkflow.query()
      .where(query)
      .then(clientWorkflows => {
        res.send({success: true, clientWorkflows})
      })
      .catch(err => {
        logger.error("ERROR: ")
        logger.info(err)
        res.send({success: false, message: err})
      })
    }
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
    ClientWorkflow.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientWorkflows) => {
      if(err || !clientWorkflows) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientWorkflows: clientWorkflows
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientWorkflow.find(mongoQuery).exec((err, clientWorkflows) => {
      if(err || !clientWorkflows) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientWorkflows: clientWorkflows });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientWorkflow by id');
  ClientWorkflow.query().findById(req.params.id)
  .then(clientWorkflow => {
    if(clientWorkflow) {
      res.send({success: true, clientWorkflow})
    } else {
      res.send({success: false, message: "ClientWorkflow not found"})
    }
  });
}

exports.utilGetById = (clientWorkflowId, callback) => {
  ClientWorkflow.query().findById(clientWorkflowId)
  .asCallback((err, clientWorkflow) => {
    if(err) {
      callback({success: false, message: err})
    } else {
      callback({success: true, clientWorkflow})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientWorkflow schema ');
  res.send({success: true, schema: ClientWorkflow.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientWorkflow default object');
  res.send({success: true, defaultObj: ClientWorkflow.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new clientWorkflow');
  let clientWorkflow = req.body
  // console.log(clientWorkflow)
  if(clientWorkflow.items) {
    clientWorkflow.items = JSON.stringify(clientWorkflow.items) // it's an array so it has to be stringified.
  }
  clientWorkflow._createdBy = req.user._id
  ClientWorkflow.query().insert(clientWorkflow)
  .returning('*')
  .then(clientWorkflow => {
    if(clientWorkflow) {
      res.send({success: true, clientWorkflow})
    } else {
      res.send({ success: false, message: "Could not save ClientWorkflow"})
    }
  });
}

exports.createFromTemplate = (req, res) => {
  console.log('Creating clientWorkflow from template');
  // console.log('req.body', req.body);
  const clientWorkflowTemplate = req.body.clientWorkflowTemplate;
  // build the basic clientWorkflow using the template info.
  let newClientWorkflow = {
    _client: req.body.clientId
    , _createdBy: req.user._id
    , _firm: req.body.firmId
    , description: clientWorkflowTemplate.description
    , title: clientWorkflowTemplate.title
    , status: "draft"
    , _tags: clientWorkflowTemplate._tags
  }  
  ClientWorkflow.query()
  .insert(newClientWorkflow)
  .returning('*')
  .asCallback((err, clientWorkflow) => {
    if(err || !clientWorkflow) {
      //error
      console.log('ERROR');
      console.log(err || 'unable to create clientWorkflow');
      res.send({success: false, message: err || 'Unable to create clientWorkflow'})

    } else {
      console.log('clientWorkflow', clientWorkflow);
      async.eachSeries(clientWorkflowTemplate.items, (item, itemCb) => {        
        /**
         * 1. Query the item
         * 2. Create a new object using the item as a reference (either a new clientTask or a new clientWorkflow)
         * 3. Save the new item and push the key and id to the items array.
         * 4. When the whole loop is done, save the new clientWorkflow.
         */
        if(item._clientTaskTemplate) {
          ClientTaskTemplate.query()
          .findById(parseInt(item._clientTaskTemplate))
          .asCallback((err, clientTaskTemplate) => {
            if(err || !clientTaskTemplate) {
              //error
              console.log('ERROR');
              console.log((err || "unable to find clientTaskTemplate"));
            } else {
              // Found the clientTaskTemplate.
              // Create a new clientTask based on this template.
              let newClientTask = {
                _clientWorkflow: clientWorkflow._id
                , _client: clientWorkflow._client
                , _createdBy: req.user._id
                , _firm: clientWorkflow._firm
                , description: clientTaskTemplate.description
                , dueDate: clientTaskTemplate.dueDate
                , needsApproval: clientTaskTemplate.needsApproval ? true : false
                , status: "draft"
                , title: clientTaskTemplate.title
                , type: clientTaskTemplate.type
              }
              clientTaskCtrl.utilCreate(newClientTask, result => {
                if(result.success) {
                  logger.info('new clientTask created.')
                  // New clientTask created. Push to clientWorkflow.items 
                  clientWorkflow.items.push({_clientTask: result.clientTask._id})
                  itemCb()
                } else {
                  logger.error("ERROR")
                  logger.info(result.message)
                  itemCb(result.message)
                }
              })
            }
          })
        } else if(item._clientWorkflowTemplate) {
          /**
           * create a subClientWorkflow
           * 
           * If we reenable subClientWorkflows we'll probably need to turn this whole method in to a util
           * that can be called recursively with a parent clientWorkflow passed in.
           */
          itemCb();
        }
      }, err => {
        if(err) {
          logger.error('ERROR')
          logger.info(err)
          res.send({success: false, message: err || 'Unable to build clientWorkflow from template'})
        } else {
          // Loop is done, save the updated clientWorkflow
          logger.info('finished building clientWorkflow');
          logger.info('attempting to save updated clientWorkflow')
          logger.info(clientWorkflow)
          exports.utilUpdate(req.user, req.io, clientWorkflow, result => {
            console.log('result', result);
            res.send(result)
          })
        }
      })
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating clientWorkflow');
  exports.utilUpdate(req.user, req.io, req.body, result => {
    res.send(result)
  })
}

exports.utilUpdate = (user, io, newClientWorkflow, callback) => {
  newClientWorkflow.items = JSON.stringify(newClientWorkflow.items) // arrays have to be stringified before saving.
  ClientWorkflow.query()
  .findById(newClientWorkflow._id)
  .asCallback((err, oldClientWorkflow) => {
    if(err || !oldClientWorkflow) {
      callback({success: false, message: err || 'Error finding clientWorkflow'})
    } else {
      ClientWorkflow.query()
      .findById(newClientWorkflow._id)
      .update(newClientWorkflow) //valiation? errors?? 
      .returning('*') // doesn't do this automatically on an update
      .asCallback((err, clientWorkflow) => {
        if(err || !clientWorkflow) {
          callback({success: false, message: err || 'Error updating clientWorkflow'})
        } else {
          exports.utilCheckAndGenerateActivity(user, io, oldClientWorkflow, clientWorkflow)
          if(oldClientWorkflow.status === 'draft' && clientWorkflow.status === 'published') {
            // Workflow was just published. Update the status of everything in the items array.
            exports.utilUpdateItemsArrayOnPublish(user, io, clientWorkflow, result => {
              if(!result.success) {
                callback({ success: false, message: result.message || "Error updating this workflow's items array"})
              } else {
                callback({ success: true, clientWorkflow})
              }
            });
          } else {
            callback({ success: true, clientWorkflow});
          }
        }
      })
    }
  });
}

exports.utilUpdateItemsArrayOnPublish = (user, io, clientWorkflow, callback) => {
  logger.info('attempting to update items array on publish')
  // Update the status of everything in the items array.
  async.each(clientWorkflow.items, (item, cb) => {
    if(item._clientTask) {
      // update the task status
      clientTaskCtrl.utilUpdateStatus(user, io, item._clientTask, 'open', result => {
        if(!result.success) {
          // error
          logger.error('ERROR:');
          logger.info(result.message);
          cb(result.message);
        } else {
          logger.info("clientTask status updated")
          cb();
        }
      })
    } else if(item._clientWorkflow) {
      // TODO: If we start using sub-workflows we'll need to do something here.
      cb();
      // exports.utilGetById(item._clientWorkflow, result => {
      //   if(!result.success) {
      //     // error
      //     logger.error('ERROR:')
      //     logger.info(result.message || 'Problem finding clientWorkflow by id.')
      //     cb(result.message)
      //   } else {
      //     // Update the workflow status.
      //     let newClientWorkflow = result.clientWorkflow
      //     newClientWorkflow.status = 'published'
      //     exports.utilUpdate(user, io, newClientWorkflow, result => {
      //       if(!result.success) {
      //         // error
      //         logger.error('ERROR:');
      //         logger.info(result.message);
      //         cb(result.message);
      //       } else {
      //         logger.info('sub workflow status updated');
      //         cb();
      //       }
      //     })
      //   }
      // })
    } else {
      logger.error('ERROR');
      logger.info('Unrecognized item type');
      cb('Unrecognized item type');
    }
  }, (err) => {
    console.log('done');
    if(err) {
      console.log('ERROR:');
      callback({ success: false, message: err || 'Error updating items array'})
    } else {
      logger.info('Successfully updated items array for clientWorkflow')
      logger.info(clientWorkflow)
      callback({ success: true });
    }
  });
}

exports.delete = (req, res) => {
  logger.warn("deleting clientWorkflow");
  
  // TODO: needs testing and updating
  const clientWorkflowId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM clientWorkflows WHERE id = ' + clientWorkflowId + ';'

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

