/**
 * Sever-side controllers for ClientTaskResponse.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientTaskResponse
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientTaskResponse = require('./ClientTaskResponseModel');
const clientTasksCtrl = require('../clientTask/clientTasksController');
let logger = global.logger;

exports.list = (req, res) => {
  ClientTaskResponse.query()
  .then(clientTaskResponses => {
    res.send({success: true, clientTaskResponses})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientTaskResponses queried from the array of _id's passed in the query param
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
    // ClientTaskResponse.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTaskResponses) => {
    //     if(err || !clientTaskResponses) {
    //       res.send({success: false, message: `Error querying for clientTaskResponses by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientTaskResponses.length == 0) {
    //       ClientTaskResponse.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTaskResponses) => {
    //         if(err || !clientTaskResponses) {
    //           res.send({success: false, message: `Error querying for clientTaskResponses by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientTaskResponses});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientTaskResponses});
    //     }
    // })
    ClientTaskResponse.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientTaskResponses) => {
        if(err || !clientTaskResponses) {
          res.send({success: false, message: `Error querying for clientTaskResponses by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientTaskResponses});
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
    ClientTaskResponse.query()
    .where(query)
    .then(clientTaskResponses => {
      res.send({success: true, clientTaskResponses})
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
    ClientTaskResponse.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientTaskResponses) => {
      if(err || !clientTaskResponses) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientTaskResponses: clientTaskResponses
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientTaskResponse.find(mongoQuery).exec((err, clientTaskResponses) => {
      if(err || !clientTaskResponses) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientTaskResponses: clientTaskResponses });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientTaskResponse by id');
  ClientTaskResponse.query().findById(req.params.id)
  .then(clientTaskResponse => {
    if(clientTaskResponse) {
      res.send({success: true, clientTaskResponse})
    } else {
      res.send({success: false, message: "ClientTaskResponse not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientTaskResponse schema ');
  res.send({success: true, schema: ClientTaskResponse.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientTaskResponse default object');
  res.send({success: true, defaultObj: ClientTaskResponse.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new clientTaskResponse');
  exports.utilCreate(req.body, req.user, req.io, result => {
    res.send(result)
  })
}

// made this a util so we can use it in other controllers.
exports.utilCreate = (newClientTaskResponse, user, socket, cb) => {
  ClientTaskResponse.query().insert(newClientTaskResponse)
  .returning('*')
  .then(clientTaskResponse => {
    if(clientTaskResponse) {
      clientTasksCtrl.utilUpdateStatusOnResponse(user, socket, clientTaskResponse, result => {
        if(result.success) {
          cb({ success: true, clientTaskResponse })
        } else {
          // TODO: something needs to happen here. The clientTaskResponse exists but now our clientTask status is out of sync.
          cb({ success: false, message: result.error })
        }
      })
    } else {
      cb({ success: false, message: "Could not save ClientTaskResponse"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating clientTaskResponse');

  const clientTaskResponseId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientTaskResponse.query()
  .findById(clientTaskResponseId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(clientTaskResponse => {
    console.log("ClientTaskResponse", clientTaskResponse)
    res.send({success: true, clientTaskResponse})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting clientTaskResponse");
  
  // TODO: needs testing and updating
  const clientTaskResponseId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM clientTaskResponses WHERE id = ' + clientTaskResponseId + ';'

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
