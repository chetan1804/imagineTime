/**
 * Sever-side controllers for ClientPostReply.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientPostReply
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientPostReply = require('./ClientPostReplyModel');
const ClientWorkflow = require('../clientWorkflow/ClientWorkflowModel');

let activitiesCtrl = require('../activity/activitiesController')
let logger = global.logger;

exports.utilCheckAndGenerateActivity = (user, io, finalObj, callback = () => {}) => {
  activitiesCtrl.utilCreateFromResource(
    user._id, finalObj._firm, finalObj._client
    , `%USER% replied to a post`
    , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/messages`
    , false, true
    , `%USER% replied to a post`
    , `/portal/${finalObj._client}/client-posts`
    , false, true
    , io
    , result => callback(result) 
  )
}

exports.utilSearch = (vectorQueryString, firmId = null, clientId = null, callback) => {
  
}

exports.list = (req, res) => {
  ClientPostReply.query()
  .then(clientPostReplies => {
    res.send({success: true, clientPostReplies})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientPostReplies queried from the array of _id's passed in the query param
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
    // ClientPostReply.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientPostReplies) => {
    //     if(err || !clientPostReplies) {
    //       res.send({success: false, message: `Error querying for clientPostReplies by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientPostReplies.length == 0) {
    //       ClientPostReply.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientPostReplies) => {
    //         if(err || !clientPostReplies) {
    //           res.send({success: false, message: `Error querying for clientPostReplies by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientPostReplies});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientPostReplies});
    //     }
    // })
    ClientPostReply.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientPostReplies) => {
        if(err || !clientPostReplies) {
          res.send({success: false, message: `Error querying for clientPostReplies by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientPostReplies});
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
    ClientPostReply.query()
    .where(query)
    .then(clientPostReplies => {
      res.send({success: true, clientPostReplies})
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
    ClientPostReply.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientPostReplies) => {
      if(err || !clientPostReplies) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientPostReplies: clientPostReplies
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientPostReply.find(mongoQuery).exec((err, clientPostReplies) => {
      if(err || !clientPostReplies) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientPostReplies: clientPostReplies });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get task by id');
  ClientPostReply.query().findById(req.params.id)
  .then(task => {
    if(task) {
      res.send({success: true, task})
    } else {
      res.send({success: false, message: "ClientPostReply not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get task schema ');
  res.send({success: true, schema: ClientPostReply.jsonSchema});
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
  res.send({success: true, defaultObj: ClientPostReply.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new task');
  let clientPostReply = req.body;
  clientPostReply._createdBy = req.user._id;
  ClientPostReply.query().insert(clientPostReply)
  .returning('*')
  .then(clientPostReply => {
    if(clientPostReply) {
      /**
       * TODO: Hit a util here that generates an activity and a clientActivity.
       */
      exports.utilCheckAndGenerateActivity(req.user, req.io, clientPostReply);
      res.send({success: true, clientPostReply})
    } else {
      res.send({ success: false, message: "Could not save ClientPostReply"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating task');

  const clientPostReplyId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientPostReply.query()
  .findById(clientPostReplyId)
  .then(oldClientPostReply => {

    ClientPostReply.query()
    .findById(clientPostReplyId)
    .update(req.body) //valiation? errors?? 
    .returning('*') // doesn't do this automatically on an update
    .then(clientPostReply => {
      
      exports.utilCheckAndGenerateActivity(req.user, req.io, oldClientPostReply, clientPostReply)
      
      console.log("clientPostReply", clientPostReply)
      res.send({success: true, clientPostReply})
    })
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting task");
  // TODO: needs testing and updating
  const clientPostReplyId = parseInt(req.params.id) // has to be an int

  ClientPostReply.query()
  .findById(clientPostReplyId)
  .del()
  .returning('*')
  .then(clientPostReply => {
    console.log("clientPostReply deleted: ", clientPostReply)
    res.send({success: true, clientPostReply})
  })
  .catch(err => {
    logger.error(err)
    res.send({success: false, message: err})
  });
}
