/**
 * Sever-side controllers for ClientActivity.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientActivity
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientActivity = require('./ClientActivityModel');
const ClientTask = require('../clientTask/ClientTaskModel');

exports.list = (req, res) => {
  ClientActivity.query()
  .then(clientActivities => {
    res.send({success: true, clientActivities})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientActivities queried from the array of _id's passed in the query param
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
    ClientActivity.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientActivities) => {
        if(err || !clientActivities) {
          res.send({success: false, message: `Error querying for clientActivities by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientActivities});
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
    
    if (Object.values(query).every(item => !item || item === 'undefined' || item === 'null') || Object.keys(query).length === 0) {
      res.send({ success: true, clientActivities: [] });
    } else {
      ClientActivity.query()
      .where(query)
      // Changing the default sort order to avoid sorting this list on the front end every time it's fetched.
      .orderBy('_id', 'desc')
      .then(clientActivities => {
        res.send({success: true, clientActivities})
      });
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
    ClientActivity.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientActivities) => {
      if(err || !clientActivities) {
        logger.error("ERROR:");
        logger.info(err);
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientActivities: clientActivities
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientActivity.find(mongoQuery).exec((err, clientActivities) => {
      if(err || !clientActivities) {
        logger.error("ERROR:");
        logger.info(err);
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientActivities: clientActivities });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientActivity by id');
  ClientActivity.query().findById(req.params.id)
  .then(clientActivity => {
    if(clientActivity) {
      res.send({success: true, clientActivity})
    } else {
      res.send({success: false, message: "Activity not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientActivity full mongo schema object');
  res.send({success: true, schema: ClientActivity.jsonSchema});
}


exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   * 
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientActivity default object');
  res.send({success: true, defaultObj: ClientActivity.defaultObject});
}

exports.create = (req, res) => {
  logger.info('creating new clientActivity');
  // let clientActivity = new ClientActivity({});

  // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     clientActivity[k] = req.body[k];
  //   }
  // }

  ClientActivity.query().insert(req.body)
  .returning('*')
  .then(clientActivity => {
    if(clientActivity) {
      // console.log('activity', activity)
      /**
       * Does the req object still exist after res.send? Yep: https://www.bennadel.com/blog/3275-you-can-continue-to-process-an-express-js-request-after-the-client-response-has-been-sent.htm
       */
      // notifsCtrl.generateFromClientActivity(clientActivity, req.io);
      res.send({ success: true, clientActivity });
    } else {
      res.send({ success: false, message: "Could not save clientActivity"})
    }
  });
}

exports.utilGenerateFromResponse = (clientTaskResponse) => {
  const clientTaskId = parseInt(clientTaskResponse._clientTask);
  ClientTask.query()
  .findById(clientTaskId)
  .asCallback((err, clientTask) => {
    if(err) {
      console.log('Could not find clientTask', err)
    } else {
      let newClientActivity = {}
      newClientActivity.text = clientTaskResponse._files ? 'Uploaded a file' : 'Completed a task'
      newClientActivity.link = `/portal/${clientTask._client}/client-workflows/${clientTaskResponse._clientWorkflow}`
      newClientActivity._user = clientTaskResponse._user
      newClientActivity._client = clientTask._client
      newClientActivity._firm = clientTask._firm
      ClientActivity.query().insert(newClientActivity)
      .returning('*')
      .asCallback((err, clientActivity) => {
        if(err) {
          console.log('Error creating clientActivity ', err)
        } else {
          console.log('Successfully created new clientActivity', clientActivity)
        }
      });
    }
  });
}


exports.update = (req, res) => {
  logger.info('updating clientActivity');
  logger.info('updating activity');

  const clientActivityId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientActivity.query()
  .findById(clientActivityId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(clientActivity => {
    if(clientActivity) {
      console.log("Activity", clientActivity)
      res.send({success: true, clientActivity})
    } else {
      res.send({success: false, message: `Error updating clientActivity id ${req.params.id}`})
    }

  });
}

exports.delete = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;

  logger.warn("deleting clientActivity");
  ClientActivity.findById(req.params.id).remove((err) => {
    if(err) {
      logger.error("ERROR:");
      logger.info(err);
      res.send({ success: false, message: err });
    } else {
      res.send({ success: true, message: "Deleted clientActivity" });
    }
  });
}
