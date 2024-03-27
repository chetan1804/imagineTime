/**
 * Sever-side controllers for ClientWorkflowTemplate.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientWorkflowTemplate
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientWorkflowTemplate = require('./ClientWorkflowTemplateModel');
let logger = global.logger;

exports.list = (req, res) => {
  ClientWorkflowTemplate.query()
  .then(clientWorkflowTemplates => {
    res.send({success: true, clientWorkflowTemplates})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientWorkflowTemplates queried from the array of _id's passed in the query param
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
    // ClientWorkflowTemplate.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientWorkflowTemplates) => {
    //     if(err || !clientWorkflowTemplates) {
    //       res.send({success: false, message: `Error querying for clientWorkflowTemplates by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientWorkflowTemplates.length == 0) {
    //       ClientWorkflowTemplate.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientWorkflowTemplates) => {
    //         if(err || !clientWorkflowTemplates) {
    //           res.send({success: false, message: `Error querying for clientWorkflowTemplates by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientWorkflowTemplates});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientWorkflowTemplates});
    //     }
    // })
    ClientWorkflowTemplate.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientWorkflowTemplates) => {
        if(err || !clientWorkflowTemplates) {
          res.send({success: false, message: `Error querying for clientWorkflowTemplates by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientWorkflowTemplates});
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
    ClientWorkflowTemplate.query()
    .where(query)
    .then(clientWorkflowTemplates => {
      res.send({success: true, clientWorkflowTemplates})
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
    ClientWorkflowTemplate.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientWorkflowTemplates) => {
      if(err || !clientWorkflowTemplates) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientWorkflowTemplates: clientWorkflowTemplates
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientWorkflowTemplate.find(mongoQuery).exec((err, clientWorkflowTemplates) => {
      if(err || !clientWorkflowTemplates) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientWorkflowTemplates: clientWorkflowTemplates });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientWorkflowTemplate by id');
  const clientWorkflowTemplateId = parseInt(req.params.id)
  ClientWorkflowTemplate.query().findById(clientWorkflowTemplateId)
  .then(clientWorkflowTemplate => {
    if(clientWorkflowTemplate) {
      res.send({success: true, clientWorkflowTemplate})
    } else {
      res.send({success: false, message: "Client Workflow Template not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientWorkflowTemplate schema ');
  res.send({success: true, schema: ClientWorkflowTemplate.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientWorkflowTemplate default object');
  res.send({success: true, defaultObj: ClientWorkflowTemplate.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new clientWorkflowTemplate');
  let clientWorkflowTemplate = req.body;
  clientWorkflowTemplate._createdBy = req.body.user;
  if(clientWorkflowTemplate.items) {
    clientWorkflowTemplate.items = JSON.stringify(clientWorkflowTemplate.items) // it's an array so it has to be stringified.
  }

  ClientWorkflowTemplate.query().insert(req.body)
  .returning('*')
  .then(clientWorkflowTemplate => {
    if(clientWorkflowTemplate) {
      res.send({success: true, clientWorkflowTemplate})
    } else {
      res.send({ success: false, message: "Could not save ClientWorkflowTemplate"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating clientWorkflowTemplate');

  const clientWorkflowTemplateId = parseInt(req.params.id) // has to be an int
  req.body.items = JSON.stringify(req.body.items) // it's an array so it has to be stringified.
  // using knex/objection models
  ClientWorkflowTemplate.query()
  .findById(clientWorkflowTemplateId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(clientWorkflowTemplate => {
    console.log("ClientWorkflowTemplate", clientWorkflowTemplate)
    res.send({success: true, clientWorkflowTemplate})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting clientWorkflowTemplate");
  
  // TODO: needs testing and updating
  const clientWorkflowTemplateId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM clientWorkflowTemplates WHERE id = ' + clientWorkflowTemplateId + ';'

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
