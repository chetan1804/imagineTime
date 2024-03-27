/**
 * Sever-side controllers for ClientTaskTemplate.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientTaskTemplate
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientTaskTemplate = require('./ClientTaskTemplateModel');
const ClientWorkflowTemplate = require('../clientWorkflowTemplate/ClientWorkflowTemplateModel');

const permissions = require('../../global/utils/permissions')

let logger = global.logger;

exports.list = (req, res) => {
  ClientTaskTemplate.query()
  .asCallback((err, clientTaskTemplates) => {
    if(err || !clientTaskTemplates) {
      res.send({success: false, message: err || "Error fetching Client Task Templates"})
    } else {
      res.send({success: true, clientTaskTemplates})
    }
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientTaskTemplates queried from the array of _id's passed in the query param
   *
   * NOTES:
   * node default max request headers + uri size is 80kb.
   */

  if(!req.query[req.params.refKey]) {
    // make sure the correct query params are included
    res.send({success: false, message: `Missing query param(s) specified by the ref: ${req.params.refKey}`});
  } else {
    ClientTaskTemplate.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTaskTemplates) => {
        if(err || !clientTaskTemplates) {
          res.send({success: false, message: `Error querying for clientTaskTemplates by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientTaskTemplates});
        }
    })
  }
}

exports.listByRefs = (req, res) => {
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   */

   // build query
  let query = {
    [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
  }
  // test for optional additional parameters
  const nextParams = req.params['0'];
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }
    ClientTaskTemplate.query()
    .where(query)
    .asCallback((err, clientTaskTemplates) => {
      if(err) {
        res.send({success: false, message: err})
      } else {
        res.send({success: true, clientTaskTemplates})
      }
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

  for(key in req.query) {
    if(req.query.hasOwnProperty(key)) {
      if(key == "page") {
        page = parseInt(req.query.page);
      } else if(key == "per") {
        per = parseInt(req.query.per);
      } else {
        logger.debug("found search query param: " + key);
        mongoQuery[key] = req.query[key];
      }
    }
  }

  logger.info(mongoQuery);
  if(page || per) {
    page = page || 1;
    per = per || 20;
    ClientTaskTemplate.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientTaskTemplates) => {
      if(err || !clientTaskTemplates) {
        logger.error("ERROR:");
        logger.info(err);
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientTaskTemplates: clientTaskTemplates
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientTaskTemplate.find(mongoQuery).exec((err, clientTaskTemplates) => {
      if(err || !clientTaskTemplates) {
        logger.error("ERROR:");
        logger.info(err);
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientTaskTemplates: clientTaskTemplates });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientTaskTemplate by id');
  const clientTaskTemplateId = parseInt(req.params.id)
  ClientTaskTemplate.query().findById(clientTaskTemplateId)
  .asCallback((err, clientTaskTemplate) => {
    if(err || !clientTaskTemplate) {
      res.send({success: false, message: err || "Client Task Template not found"})
    } else {
      res.send({success: true, clientTaskTemplate})
    }
  });
}

exports.getSchema = (req, res) => {
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientTaskTemplate full mongo schema object');
  res.send({success: true, schema: ClientTaskTemplate.getSchema()});
}


exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   * 
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientTaskTemplate default object');
  res.send({success: true, defaultObj: ClientTaskTemplate.getDefault()});
}

exports.create = (req, res) => {
  logger.info('creating new clientTaskTemplate');
  let clientTaskTemplate = req.body;
  clientTaskTemplate._createdBy = req.user._id;

  ClientTaskTemplate.query().insert(clientTaskTemplate)
  .returning('*')
  .asCallback((err, clientTaskTemplate) => {
    if(err) {
      logger.error('Problem creating clientTaskTemplate');
      logger.info(err);
      res.send({success: false, message: err})
    } else {
      logger.info("clientTaskTemplate created")
      logger.info(clientTaskTemplate)
      res.send({success: true, clientTaskTemplate})
    }
  })
}

exports.update = (req, res) => {
  logger.info('updating task template');

  const clientTaskTemplateId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientTaskTemplate.query()
  .findById(clientTaskTemplateId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .asCallback((err, clientTaskTemplate) => {
    if(err) {
      logger.error('Problem updating clientTaskTemplate');
      logger.info(err);
      res.send({success: false, message: err})
    } else {
      logger.info("clientTaskTemplate updated")
      logger.info(clientTaskTemplate)
      res.send({success: true, clientTaskTemplate})
    }
  })
}

exports.staffDelete = (req, res) => {
  /**
   * Allow staff (permission level TBD) to delete a clientTaskTemplate when
   * the clientTaskTemplate belongs to a clientWorkflowTemplate with a status
   * of "draft", meaning that the clientWorkflowTemplate is still being built.
   */
  const clientTaskTemplateId = parseInt(req.params.id) // has to be an int
  logger.info("Starting staffDelete of clientTaskTemplate.")
  // First find the clientTask
  ClientTaskTemplate.query()
  .findById(clientTaskTemplateId)
  .asCallback((err, clientTaskTemplate) => {
    if(err) {
      logger.error("Problem fetching clientTaskTemplate.")
      logger.error(err)
      res.send({success: false, message: err})
    } else {
      logger.info("Found clientTaskTemplate. Checking user permission.")
      // Now check permission.
      permissions.utilCheckFirmPermission(req.user, clientTaskTemplate._firm || null, "access", permission => {
        if(!permission) {
          logger.info("user does NOT have permission.")
          res.send({success: false, message: "You do not have permisson to delete this clientTaskTemplate."})
        } else {
          // User has permisson. Check the clientWorkflowTemplate status.
          logger.info("User has permission. Checking parent clientWorkflowTemplate status.")
          ClientWorkflowTemplate.query()
          .findById(clientTaskTemplate._clientWorkflowTemplate)
          .asCallback((err, clientWorkflowTemplate) => {
            if(err || !clientWorkflowTemplate) {
              logger.error("Problem fetching clientWorkflowTemplate")
              logger.error(err)
              res.send({success: false, message: err || "Problem finding clientWorkflowTemplate"})
            } else {
              if(clientWorkflowTemplate.status !== "draft") {
                logger.info("clientWorkflowTemplate is not a draft. Not deleting clientTaskTemplate.")
                // clientWorkflowTemplate is either "published" or "archived". Can't delete this clientTaskTemplate.
                res.send({success: false, message: "You cannot delete a clientTaskTemplate from an already published clientWorkflowTemplate."})
              } else {
                // safe to delete.
                logger.info("attempting to delete clientTaskTemplate on clientWorkflowTemplate with a status of draft.")
                exports.utilDelete(clientTaskTemplate._id, result => {
                  if(!result.success) {
                    res.send({success: false, message})
                  } else {
                    res.send({success: true, clientTaskTemplate})
                  }
                });
              }
            }
          });
        }
      });
    }
  });
}

exports.delete = (req, res) => {
  logger.warn("deleting task");
  // TODO: needs testing and updating
  const clientTaskTemplateId = parseInt(req.params.id) // has to be an int

  ClientTaskTemplate.query()
  .findById(clientTaskTemplateId)
  .del()
  .returning('*')
  .asCallback((err, clientTaskTemplate) => {
    if(err) {
      logger.error(err)
      res.send({success: false, message: err});
    } else {
      console.log("clientTaskTemplate deleted: ", clientTaskTemplate)
      res.send({success: true, clientTaskTemplate})
    }
  });
}

exports.utilDelete = (clientTaskTemplateId, callback) => {
  ClientTaskTemplate.query()
  .findById(clientTaskTemplateId)
  .del()
  .returning('*')
  .asCallback((err, clientTaskTemplate) => {
    if(err) {
      logger.error("Problem deleting clientTaskTemplate")
      logger.error(err)
      callback({success: false, message: "Error deleting clientTaskTemplate."})
    } else {
      logger.info("clientTaskTemplate deleted")
      logger.info(clientTaskTemplate)
      callback({success: true, clientTaskTemplate})
    }
  });
}
