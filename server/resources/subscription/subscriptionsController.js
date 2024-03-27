/**
 * Sever-side controllers for Subscription.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Subscription
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const Subscription = require('./SubscriptionModel');
let logger = global.logger;

exports.list = (req, res) => {
  Subscription.query()
  .then(subscriptions => {
    res.send({success: true, subscriptions})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of subscriptions queried from the array of _id's passed in the query param
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
    // Subscription.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, subscriptions) => {
    //     if(err || !subscriptions) {
    //       res.send({success: false, message: `Error querying for subscriptions by ${["_" + req.params.refKey]} list`, err});
    //     } else if(subscriptions.length == 0) {
    //       Subscription.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, subscriptions) => {
    //         if(err || !subscriptions) {
    //           res.send({success: false, message: `Error querying for subscriptions by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, subscriptions});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, subscriptions});
    //     }
    // })
    Subscription.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, subscriptions) => {
        if(err || !subscriptions) {
          res.send({success: false, message: `Error querying for subscriptions by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, subscriptions});
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
    Subscription.query()
    .where(query)
    .then(subscriptions => {
      res.send({success: true, subscriptions})
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
    Subscription.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, subscriptions) => {
      if(err || !subscriptions) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , subscriptions: subscriptions
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Subscription.find(mongoQuery).exec((err, subscriptions) => {
      if(err || !subscriptions) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, subscriptions: subscriptions });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get subscription by id');
  Subscription.query().findById(req.params.id)
  .then(subscription => {
    if(subscription) {
      res.send({success: true, subscription})
    } else {
      res.send({success: false, message: "Subscription not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get subscription schema ');
  res.send({success: true, schema: Subscription.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get subscription default object');
  res.send({success: true, defaultObj: Subscription.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new subscription');
  console.log(req.body)
  // let subscription = new Subscription({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     subscription[k] = req.body[k];
  //   }
  // }


  Subscription.query().insert(req.body)
  .returning('*')
  .then(subscription => {
    if(subscription) {
      res.send({success: true, subscription})
    } else {
      res.send({ success: false, message: "Could not save Subscription"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating subscription');

  const subscriptionId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Subscription.query()
  .findById(subscriptionId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(subscription => {
    console.log("Subscription", subscription)
    res.send({success: true, subscription})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting subscription");
  
  // TODO: needs testing and updating
  const subscriptionId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM subscriptions WHERE id = ' + subscriptionId + ';'

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
