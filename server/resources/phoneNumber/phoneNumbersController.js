/**
 * Sever-side controllers for PhoneNumber.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the PhoneNumber
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const PhoneNumber = require('./PhoneNumberModel');
let logger = global.logger;
const permissions = require('../../global/utils/permissions');
const Firm = require('../firm/FirmModel');
const ClientUser = require('../clientUser/ClientUserModel');
const usersController = require('../user/usersController');

exports.list = (req, res) => {
  PhoneNumber.query()
  .then(phoneNumbers => {
    res.send({success: true, phoneNumbers})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of phoneNumbers queried from the array of _id's passed in the query param
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
    // PhoneNumber.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, phoneNumbers) => {
    //     if(err || !phoneNumbers) {
    //       res.send({success: false, message: `Error querying for phoneNumbers by ${["_" + req.params.refKey]} list`, err});
    //     } else if(phoneNumbers.length == 0) {
    //       PhoneNumber.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, phoneNumbers) => {
    //         if(err || !phoneNumbers) {
    //           res.send({success: false, message: `Error querying for phoneNumbers by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, phoneNumbers});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, phoneNumbers});
    //     }
    // })
    PhoneNumber.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, phoneNumbers) => {
        if(err || !phoneNumbers) {
          res.send({success: false, message: `Error querying for phoneNumbers by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, phoneNumbers});
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

    if (Object.values(query).every(item => !item || item === 'undefined' || item === 'null') || Object.keys(query).length === 0) {
      res.send({ success: true, phoneNumbers: [] });
    } else {
      if (query && query._staff) {
        req.params.staffId = query._staff;
        exports.listByStaff(req, res);
      } else {
        PhoneNumber.query()
        .where(query)
        .then(phoneNumbers => {
          res.send({success: true, phoneNumbers})
        })
      }
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
    PhoneNumber.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, phoneNumbers) => {
      if(err || !phoneNumbers) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , phoneNumbers: phoneNumbers
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    PhoneNumber.find(mongoQuery).exec((err, phoneNumbers) => {
      if(err || !phoneNumbers) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, phoneNumbers: phoneNumbers });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get phoneNumber by id');
  PhoneNumber.query().findById(req.params.id)
  .then(phoneNumber => {
    if(phoneNumber) {
      res.send({success: true, phoneNumber})
    } else {
      res.send({success: false, message: "PhoneNumber not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get phoneNumber schema ');
  res.send({success: true, schema: PhoneNumber.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get phoneNumber default object');
  res.send({success: true, defaultObj: PhoneNumber.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new phoneNumber');
  console.log(req.body)
  // let phoneNumber = new PhoneNumber({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     phoneNumber[k] = req.body[k];
  //   }
  // }


  PhoneNumber.query().insert(req.body)
  .returning('*')
  .then(phoneNumber => {
    if(phoneNumber) {
      res.send({success: true, phoneNumber})
    } else {
      res.send({ success: false, message: "Could not save PhoneNumber"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating phoneNumber');

  const phoneNumberId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  PhoneNumber.query()
  .findById(phoneNumberId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(phoneNumber => {
    console.log("PhoneNumber", phoneNumber)
    res.send({success: true, phoneNumber})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting phoneNumber");
  
  // TODO: needs testing and updating
  const phoneNumberId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM phoneNumbers WHERE id = ' + phoneNumberId + ';'

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

exports.getListByClientIds = (req, res) => {
  const {
    clientIds
  } = req.body;

  PhoneNumber.query()
  .whereIn('_client', clientIds)
  .asCallback((err, phoneNumbers) => {
    if (!err && phoneNumbers) {
      res.send({ success: true, phoneNumbers });
    } else {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: err || "Problem finding phoneNumbers"});
    }
  });
}


exports.getListByIds = (req, res) => {
  const {
    ids
  } = req.body;

  PhoneNumber.query()
  .whereIn('_id', ids)
  .asCallback((err, phoneNumbers) => {
    if (!err && phoneNumbers) {
      res.send({ success: true, phoneNumbers });
    } else {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: err || "Problem finding phoneNumbers"});
    }
  });
}

exports.listByFirm = (req, res) => {
  const firmId = req.params.firmId;
  Firm.query().findById(firmId)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Could not find matching Firm"})
    } else {
      permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'access', permission => {
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this Firm"})
        } else {
          logger.info('user does have permission.')
          ClientUser.query()
          .where({_firm: req.params.firmId})
          .where(builder => {
            builder.whereNot({ status: "deleted" });
            builder.whereNot({ status: "clientArchived" });
          })
          .then(clientUsers => {
            logger.info('clientUsers found');
            // console.log(clientUsers);
            const userIds = clientUsers.map(cu => cu._user);
            PhoneNumber.query()
            .whereIn('_user', userIds)
            .then(phoneNumbers => {
              res.send({ success: true, phoneNumbers });
            })
          })
        }
      });
    }
  });
}

exports.listByStaff = (req, res) => {
  if (!req.params.staffId || req.params.staffId === "null") {
    res.send({ success: true, phoneNumbers: [] });
  } else {
    usersController.getListByStaff(req, res, result => {
      if (result && result.success && result.users && result.users.length) {
        const userIds = result.users.map(cu => cu._id);
        PhoneNumber.query()
        .whereIn('_user', userIds)
        .then(phoneNumbers => {
          res.send({ success: true, phoneNumbers });
        });
      } else {
        res.send(result);
      }
    });
  }
}