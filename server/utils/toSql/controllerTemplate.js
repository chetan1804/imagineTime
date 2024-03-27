/**
 * Sever-side controllers for __PascalName__.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the __PascalName__
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const __PascalName__ = require('./__PascalName__Model');
let logger = global.logger;

exports.list = (req, res) => {
  __PascalName__.query()
  .then(__camelName__s => {
    res.send({success: true, __camelName__s})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of __camelName__s queried from the array of _id's passed in the query param
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
    // __PascalName__.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, __camelName__s) => {
    //     if(err || !__camelName__s) {
    //       res.send({success: false, message: `Error querying for __camelName__s by ${["_" + req.params.refKey]} list`, err});
    //     } else if(__camelName__s.length == 0) {
    //       __PascalName__.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, __camelName__s) => {
    //         if(err || !__camelName__s) {
    //           res.send({success: false, message: `Error querying for __camelName__s by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, __camelName__s});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, __camelName__s});
    //     }
    // })
    __PascalName__.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, __camelName__s) => {
        if(err || !__camelName__s) {
          res.send({success: false, message: `Error querying for __camelName__s by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, __camelName__s});
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
    __PascalName__.query()
    .where(query)
    .then(__camelName__s => {
      res.send({success: true, __camelName__s})
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
    __PascalName__.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, __camelName__s) => {
      if(err || !__camelName__s) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , __camelName__s: __camelName__s
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    __PascalName__.find(mongoQuery).exec((err, __camelName__s) => {
      if(err || !__camelName__s) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, __camelName__s: __camelName__s });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get __camelName__ by id');
  __PascalName__.query().findById(req.params.id)
  .then(__camelName__ => {
    if(__camelName__) {
      res.send({success: true, __camelName__})
    } else {
      res.send({success: false, message: "__PascalName__ not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get __camelName__ schema ');
  res.send({success: true, schema: __PascalName__.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get __camelName__ default object');
  res.send({success: true, defaultObj: __PascalName__.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new __camelName__');
  console.log(req.body)
  // let __camelName__ = new __PascalName__({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     __camelName__[k] = req.body[k];
  //   }
  // }


  __PascalName__.query().insert(req.body)
  .returning('*')
  .then(__camelName__ => {
    if(__camelName__) {
      res.send({success: true, __camelName__})
    } else {
      res.send({ success: false, message: "Could not save __PascalName__"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating __camelName__');

  const __camelName__Id = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  __PascalName__.query()
  .findById(__camelName__Id)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(__camelName__ => {
    console.log("__PascalName__", __camelName__)
    res.send({success: true, __camelName__})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting __camelName__");
  
  // TODO: needs testing and updating
  const __camelName__Id = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM __camelName__s WHERE id = ' + __camelName__Id + ';'

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
