/**
 * Sever-side controllers for Address.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Address
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const Address = require('./AddressModel');
let logger = global.logger;
const usersController = require('../user/usersController');
const { raw } = require('objection');
const _ = require('lodash');
const Client = require('../client/ClientModel');

exports.list = (req, res) => {
  Address.query()
  .then(addresses => {
    res.send({success: true, addresses})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of addresses queried from the array of _id's passed in the query param
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
    // Address.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, addresses) => {
    //     if(err || !addresses) {
    //       res.send({success: false, message: `Error querying for addresses by ${["_" + req.params.refKey]} list`, err});
    //     } else if(addresses.length == 0) {
    //       Address.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, addresses) => {
    //         if(err || !addresses) {
    //           res.send({success: false, message: `Error querying for addresses by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, addresses});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, addresses});
    //     }
    // })
    Address.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, addresses) => {
        if(err || !addresses) {
          res.send({success: false, message: `Error querying for addresses by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, addresses});
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
      res.send({ success: true, addresses: [] });
      return;
    }

    if (query && query._staff) {
      req.params.staffId = query._staff;
      exports.listByStaff(req, res);
    } else if (query && query._client) {

      Client.query().findById(query._client)
      .then(client => {
        if (client && client._id) {
          const createColumnCompleteAddress = 'concat(city, \' \', country, \' \', postal, \' \', state, \' \', street1, \' \', street2, \' \', _client) as completeaddress';
          Address.query()
          .where(query)
          .select('*', raw(createColumnCompleteAddress))
          .then(addresses => {
            if (!addresses || (addresses && addresses.length === 1)) {
                res.send({success: true, addresses })
            } else {
                const uniqAddress = _.uniqBy(addresses, 'completeaddress');
                const uniqObjAddress = _.keyBy(uniqAddress, '_id');
                const allObjAddress = _.keyBy(addresses, '_id');
                const newAddresses = [];
                const uniqAddressIds = [];

                if (uniqAddress && uniqAddress.length === addresses.length) {
                  addresses = addresses.map(item => {
                    delete item.completeaddress;
                    return item;
                  });
                  res.send({success: true, addresses });
                } else {
                  
                  Object.keys(uniqObjAddress).map(item => {
                    if (client._primaryAddress && allObjAddress && allObjAddress[client._primaryAddress] 
                      && allObjAddress[client._primaryAddress].completeaddress === uniqObjAddress[item].completeaddress) {
                        uniqObjAddress[item] = allObjAddress[client._primaryAddress];
                    }
                    delete uniqObjAddress[item].completeaddress;
                    uniqAddressIds.push(uniqObjAddress[item]._id);
                    newAddresses.push(uniqObjAddress[item]);
                  });

                  Address.query()
                  .where(query)
                  .whereNotIn('_id', uniqAddressIds)
                  .update({ _client: null }).returning('*')
                  .then(json => {
                    res.send({success: true, addresses: newAddresses });
                  })
                }
            }
          });
        } else {
          res.send({success: true, addresses: [] })
        }
      });
    } else {
      if (query && query._staff) {
        req.params.staffId = query._staff;
        exports.listByStaff(req, res);
      } else if (query && query._client) {
  
        Client.query().findById(query._client)
        .then(client => {
          if (client && client._id) {
            const createColumnCompleteAddress = 'concat(city, \' \', country, \' \', postal, \' \', state, \' \', street1, \' \', street2, \' \', _client) as completeaddress';
            Address.query()
            .where(query)
            .select('*', raw(createColumnCompleteAddress))
            .then(addresses => {
              if (!addresses || (addresses && addresses.length === 1)) {
                  res.send({success: true, addresses })
              } else {
                  const uniqAddress = _.uniqBy(addresses, 'completeaddress');
                  const uniqObjAddress = _.keyBy(uniqAddress, '_id');
                  const allObjAddress = _.keyBy(addresses, '_id');
                  const newAddresses = [];
                  const uniqAddressIds = [];
  
                  if (uniqAddress && uniqAddress.length === addresses.length) {
                    addresses = addresses.map(item => {
                      delete item.completeaddress;
                      return item;
                    });
                    res.send({success: true, addresses });
                  } else {
                    
                    Object.keys(uniqObjAddress).map(item => {
                      if (client._primaryAddress && allObjAddress && allObjAddress[client._primaryAddress] 
                        && allObjAddress[client._primaryAddress].completeaddress === uniqObjAddress[item].completeaddress) {
                          uniqObjAddress[item] = allObjAddress[client._primaryAddress];
                      }
                      delete uniqObjAddress[item].completeaddress;
                      uniqAddressIds.push(uniqObjAddress[item]._id);
                      newAddresses.push(uniqObjAddress[item]);
                    });
  
                    Address.query()
                    .where(query)
                    .whereNotIn('_id', uniqAddressIds)
                    .update({ _client: null }).returning('*')
                    .then(json => {
                      res.send({success: true, addresses: newAddresses });
                    })
                  }
              }
            });
          } else {
            res.send({success: true, addresses: [] })
          }
        });
      } else {
        Address.query()
          .where(query)
          .then(addresses => {
            res.send({success: true, addresses})
          });
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
    Address.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, addresses) => {
      if(err || !addresses) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , addresses: addresses
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Address.find(mongoQuery).exec((err, addresses) => {
      if(err || !addresses) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, addresses: addresses });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get address by id');
  Address.query().findById(req.params.id)
  .then(address => {
    if(address) {
      res.send({success: true, address})
    } else {
      res.send({success: false, message: "Address not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get address schema ');
  res.send({success: true, schema: Address.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get address default object');
  res.send({success: true, defaultObj: Address.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new address');
  console.log(req.body)
  // let address = new Address({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     address[k] = req.body[k];
  //   }
  // }


  Address.query().insert(req.body)
  .returning('*')
  .then(address => {
    if(address) {
      res.send({success: true, address})
    } else {
      res.send({ success: false, message: "Could not save Address"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating address');

  const addressId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Address.query()
  .findById(addressId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(address => {
    console.log("Address", address)
    res.send({success: true, address})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting address");
  
  // TODO: needs testing and updating
  const addressId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM addresses WHERE id = ' + addressId + ';'

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

  Address.query()
  .whereIn('_client', clientIds)
  .asCallback((err, addresses) => {
    if (addresses) {
      res.send({ success: true, addresses });
    } else {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: err || "Problem finding addresses"});
    }
  });
}

exports.getListByIds = (req, res) => {
  const {
    ids
  } = req.body;

  Address.query()
  .whereIn('_id', ids)
  .asCallback((err, addresses) => {
    if (addresses) {
      res.send({ success: true, addresses });
    } else {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: err || "Problem finding addresses"});
    }
  });
}

exports.listByStaff = (req, res) => {
  usersController.getListByStaff(req, res, result => {
    if (result && result.success && result.users && result.users.length) {
      const userIds = result.users.map(cu => cu._id);
      Address.query()
      .whereIn('_user', userIds)
      .then(addresses => {
        res.send({ success: true, addresses });
      });
    } else {
      res.send(result);
    }
  });
}