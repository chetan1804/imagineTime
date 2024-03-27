/**
 * Sever-side controllers for StaffClient.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the StaffClient
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const StaffClient = require('./StaffClientModel');
let logger = global.logger;

const permissions = require('../../global/utils/permissions.js');
const Staff = require('../staff/StaffModel');
const async = require('async');

exports.list = (req, res) => {
  StaffClient.query()
  .then(staffClients => {
    res.send({success: true, staffClients})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of staffClients queried from the array of _id's passed in the query param
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
    // StaffClient.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, staffClients) => {
    //     if(err || !staffClients) {
    //       res.send({success: false, message: `Error querying for staffClients by ${["_" + req.params.refKey]} list`, err});
    //     } else if(staffClients.length == 0) {
    //       StaffClient.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, staffClients) => {
    //         if(err || !staffClients) {
    //           res.send({success: false, message: `Error querying for staffClients by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, staffClients});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, staffClients});
    //     }
    // })
    StaffClient.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, staffClients) => {
        if(err || !staffClients) {
          res.send({success: false, message: `Error querying for staffClients by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, staffClients});
        }
    })
  }
}

exports.listByRefs = (req, res) => {
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   * TODO: server side pagination
   */
  /**
   * NOTE: To restrict access to inactive staff, this method has been updated to allow querying by 
   * values on the associated staff object. Currently this is only being used to search staffClients
   * by staff.status === 'active', but could be used to search for staffClients by any key on staff.
   * 
   */

  // build query
  let query = {};
  const refKey = req.params.refKey
  if(!refKey.includes('~')) {
    // because we are doing a join, the query fields have to be prefaced by their resource name.
    query[`staffclients.${refKey}`] = req.params.refId === 'null' ? null : req.params.refId
    // NOTE: In theory we could add more joins to this and allow queries by properties of other associated models.
    // For now we only have a join relation for staff.
  } else {
    /**
     * The query includes a tilde (~). This is a special field that allows us to do 
     * custom overrides, which can be sub queries or additional permission checks.
     * Limit this special type of query by checking specifically for allowed fields.
     * Currently we only allow staffClients to be queried by staff.status. If somebody
     * tries to search by staff.somethingElse it will be ignored.
     */
    if(refKey.includes('~staff.status')) {
      // The presence of "~staff" means we are querying by values on the staff model.
      // Checking for "~staff" explicitly in order to ignore invalid criteria.
      const newRefKey = refKey.substring(refKey.indexOf("~") + 1); // get rid of the "~"
      // In the current use case newRefKey === 'staff.status' and refId === 'active'
      query[`${newRefKey}`] = req.params.refId === 'null' ? null : req.params.refId;
    }
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
        const nextRefKey = nextParams.split("/")[i];
        if(!nextRefKey.includes('~')) {
          query[`staffclients.${nextRefKey}`] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
        } else {
          // custom overrides. See notes for refKey above for more info.
          if(nextRefKey.includes('~staff.status')) {
            const newRefKey = nextRefKey.substring(nextRefKey.indexOf("~") + 1);
            query[`${newRefKey}`] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
          }
        }
      }
    }

    if (Object.values(query).every(item => !item || item === 'undefined' || item === 'null') || Object.keys(query).length === 0) {
      res.send({ success: true, staffClients: [] });
    } else {
      StaffClient.query()
      // .debug(true)
      .where(query)
      /**
       * NOTE: This joinRelation does not populate staff on the returned staffClient objects.
       * it just allows us to query staffClients by properties on their associated staff object.
       */
      .joinRelation('staff')
      .asCallback((err, staffClients) => {
        if(err || !staffClients) {
          logger.error("ERROR: ")
          logger.info(err)
          res.send({success: false, message: err || "Problem finding staffClients"})
        } else {
          res.send({success: true, staffClients})
        }
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
    StaffClient.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, staffClients) => {
      if(err || !staffClients) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , staffClients: staffClients
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    StaffClient.find(mongoQuery).exec((err, staffClients) => {
      if(err || !staffClients) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, staffClients: staffClients });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get staffClient by id');
  StaffClient.query().findById(req.params.id)
  .then(staffClient => {
    if(staffClient) {
      res.send({success: true, staffClient})
    } else {
      res.send({success: false, message: "StaffClient not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get staffClient schema ');
  res.send({success: true, schema: StaffClient.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get staffClient default object');
  res.send({success: true, defaultObj: StaffClient.defaultObject});
  // res.send({success: false})
}

exports.utilGetByFirmAndUser = (userId, firmId, callback) => {
  StaffClient.query()
  .where({
    _user: userId
    , _firm: firmId
  })
  .asCallback((err, staffClients) => {
    if(err) {
      callback({success: true, err});
    } else {
      callback({success: true, staffClients});
    }
  });
}

exports.utilGetByClientId = (clientId, cb) => {
  console.log('clientId', clientId)
  if(clientId) {
    // build query
    let query = {
      _client: clientId
    }
    StaffClient.query()
    .where(query)
    .asCallback((err, staffClients) => {
      if(err) {
        cb(err, null)
      } else {
        console.log('staffClients', staffClients)
        cb(null, staffClients);
      }
    })
  } else {
    cb('ERROR: No client id specified.', null)
  }
}

exports.create = (req, res) => {
  logger.info('creating new staffClient');
  console.log(req.body)
  // let staffClient = new StaffClient({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     staffClient[k] = req.body[k];
  //   }
  // }


  StaffClient.query().insert(req.body)
  .returning('*')
  .then(staffClient => {
    if(staffClient) {
      res.send({success: true, staffClient})
    } else {
      res.send({ success: false, message: "Could not save StaffClient"})
    }
  });
}

exports.multipleCreate = (req, res) => {
  logger.info('Creating new staffclient');

  let progress = 0;

  const { client, _firm, _user, _staff } = req.body;
  async.map(client, (currentClient, mapCallBack) => {

    const insertData = {
      _client: currentClient
      , _firm
      , _user
      , _staff
    }

    StaffClient.query()
      .where(insertData)
      .first()
      .then(existingUser => {
        if (!existingUser) {
          StaffClient.query().insert(insertData)
          .returning('*')
          .then(staffClient => {
            if (staffClient) {
              mapCallBack(null, staffClient);
            } else {
              mapCallBack(null, { message: "Could not save StaffClient" });
            }
            progress++;
            const progressResult = (100/client.length) * progress;
            req.io.to(req.user._id).emit('add_status', staffClient, parseInt(progressResult));
          })
        } else {
          mapCallBack(null, null);
        }
      })
  }, (err, callBack) => {
    // remove null
    callBack = callBack.filter(newStaffClient => newStaffClient);
    if (callBack) {
      res.send({ success: true, data: callBack });
    } else {
      res.send({ success: false, message: "Could not save StaffClient" });
    }
  });   
}

exports.update = (req, res) => {
  logger.info('updating staffClient');

  const staffClientId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  StaffClient.query()
  .findById(staffClientId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(staffClient => {
    res.send({success: true, staffClient});
  })
}

exports.delete = (req, res) => {
  deleteStaff(req.user, req.params.id, req.user._firm, result => {
    res.send(result);
  })
}

exports.bulkDelete = (req, res) => {
  const staffIds = req.body;

  const { firmId } = req.params;

  async.map(staffIds,
    (staffId, callback) => {
      deleteStaff(req.user, staffId, firmId ? firmId : null, result => {
        if(result.success) {
          return callback(null, {id: staffId, message: '' });
        }
        else {
          return callback(null, {id: staffId, message: result.message});
        }
      });
    },
    (err, list) => {
      if(err) {
        res.send({ success: false, message: err });
      }
      else {
        let errors = list.filter(item => {
          return (!!item.message);
        });
        res.send({ success: (!errors || errors.length < 1), data: list });
        return;
      }
    }
  );
}

const deleteStaff = (user, staffId, firmId, callback) => {;
  StaffClient.query()
  .findById(staffId)
  .then(selectedStaff => {
     // do firm "admin" level permission check.
     permissions.utilCheckFirmPermission(user, selectedStaff._firm ? selectedStaff._firm : firmId ? firmId : null, "admin", permission => {
      if(!permission) {
        return callback({success: false, message: 'You do not have permission to perform this action.'})
      } else { 
        StaffClient.query()
        .findById(selectedStaff._id)
        .del()
        .returning('*')
        .then(staff => {
          return callback({success: true, staff})
        })
        .catch(err => {
          logger.error(err)
          return callback({success: false, message: err})
        });
      }
    });
  })
  .catch(err => {
    logger.error(err)
    return callback({success: false, message: err})
  });
}

exports.inviteStaffClient = (data, cb) => {
  if (data._user && data._firm && data._staff && data._client) {
    StaffClient.query()
    .where(data)
    .first()
    .then(existingStaffClient => {
      if (!existingStaffClient) {
        StaffClient.query().insert(data)
        .returning('*')
        .asCallback((err, staffClient) => {
          if (!err && staffClient) {
            cb({ success: true, staffClient });
          } else {
            cb({ success: false });
          }
        });
      } else {
        cb({ success: false, existingStaffClient: existingStaffClient });
      }
    });
  } else {
    cb({ success: false });
  }
}

exports.getListByClientIds = (req, res) => {

  // build query
  const {
    clientIds
  } = req.body;
  
  StaffClient.query().from('staffclients as a')
  .innerJoin('staff as b', 'a._staff', 'b._id')
  .whereIn('a._client', clientIds)
  .where({ 'b.status': 'active' })
  .groupBy('a._id')
  .asCallback((err, staffClients) => {
    if(err || !staffClients) {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: err || "Problem finding staffClients"});
    } else {
      res.send({success: true, staffClients });
    }
  });
}

exports.assignMultipleStaff = (req, res) => {
  const {
    clientIds
    , selectedStaffs
    , firmId
    , staffNotification
  } = req.body;

  console.log('hello world')
  if (clientIds && clientIds.length && selectedStaffs && selectedStaffs.length) {
    let socketId = req.user && req.user._id
    req.io.to(socketId).emit('assgined_staff_progress', { message: 'Authorizing', percent: 3 });
    permissions.utilCheckisStaffOwner(req.user, firmId, ownerpermissions => {
      if (ownerpermissions) {
        const newStaffClients = [];
        req.io.to(socketId).emit('assgined_staff_progress', { message: 'Preparing', percent: 9 });
        async.mapSeries(clientIds, (clientId, clientCB) => {
          exports.prepareStaffClientRecords(selectedStaffs, firmId, clientId, staffNotification, result => {
            newStaffClients.push(...result);
            clientCB();
          });
        }, (err, z) => {
          if (err) {
            res.send({ success: false, message: err });
          } else {
            req.io.to(socketId).emit('assgined_staff_progress', { message: 'Finalizing', percent: 85 });

            
            StaffClient.query().insert(newStaffClients).returning('*')
            .asCallback((err, staffClients) => {
              console.log('staffClients', staffClients);
              if (err && !staffClients) {
                res.send({ success: false, message: err || 'Error while saving new staffs' });
              } else {
                req.io.to(socketId).emit('assgined_staff_progress', { message: 'Fetching', percent: 92 });
                res.send({ success: true, staffClients });
              }
            });
          }
        });
      } else {
        res.send({success: false, message: 'You do not have permission to perform this action.'});
      }
    });
  } else {
    res.send({ success: false, message: 'Could not save StaffClients' })
  }
}

exports.prepareStaffClientRecords = (selectedStaffs, firmId, clientId, staffNotification, callback) => {
  if (selectedStaffs && selectedStaffs.length) {
    let newStaffClients = [];
    StaffClient.query().where({
      _firm: firmId
      , _client: clientId
    }).then(currentAssigned => {
  
      let newStaff = selectedStaffs;
      if (currentAssigned && currentAssigned.length) {
        currentAssigned = currentAssigned.map(item => item._staff);
        newStaff = selectedStaffs.filter(item => currentAssigned.indexOf(item._id) === -1);
      }
      async.mapSeries(newStaff, (staff, cb) => {
        let detail = { 
          _firm: firmId
          , _user: staff._user
          , _staff: staff._id
          , _client: clientId
          , ...staffNotification
        };
        newStaffClients.push(detail);
        cb();
      }, (errr) => {
        if (errr) {
          callback(newStaffClients);
        } else {
          callback(newStaffClients);
        }
      });
    });
  } else {
    callback([]);
  }
};

exports.bulkNotificationUpdate = (req, res) => {
  const { clientIds, firmId, staffNotification } = req.body;

  permissions.utilCheckFirmPermission(req.user, firmId, 'access', permission => {
    if(permission) {
      logger.info('user has permission, attempting invitations.')
        // Even small imports of 30 or so clients will likely timeout.
        // Return now and let them continue working while this runs in the background.

      console.log(clientIds)
      StaffClient.query().where({ _firm: firmId }).whereIn("_client", clientIds).update(staffNotification).returning("*")
      .asCallback((err, staffClients) => {

        if (err && !staffClients) {
          console.log("err", err);
          res.send({ success: false, message: "Failed assigned staffs update" });
        } else {
          res.send({ success: true, data: staffClients });
        }
      });
    } else {
      logger.info('user does NOT have permission.')
      res.send({success: false, message: "You do not have permisson to invite users to this client account."})
    }
  });
}