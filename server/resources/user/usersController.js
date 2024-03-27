/**
 * The usersController handles all business logic for the User resource
 *
 * NOTE:  All "Update" logic should be limited to the logged in user or admin
 * protected in the API
 */

// get the appUrl for the current environment
let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

// get secrets if needed
// let secrets = require('../../config')[process.env.NODE_ENV].secrets;

let qrcode = require('qrcode');
let speakeasy = require('speakeasy')

const User = require('./UserModel');
const Firm = require('../firm/FirmModel');
const Staff = require('../staff/StaffModel');
const StaffClient = require('../staffClient/StaffClientModel');
const Client = require('../client/ClientModel');
const ClientUser = require('../clientUser/ClientUserModel');

// for admin global searching
const tagsCtrl = require('../tag/tagsController');
// const clientsCtrl = require('../client/clientsController');
const clientUsersCtrl = require('../clientUser/clientUsersController');
const firmsCtrl = require('../firm/firmsController');

const permissions = require('../../global/utils/permissions')
const async = require('async');
const emailUtil = require('../../global/utils/email');
const brandingName = require('../../global/brandingName.js').brandingName;
const paginate = require('../../global/utils/paginate');
const { raw } = require('objection');

// define "safe" user fields to return to the api
const safeUserFields = [
  '_id', 'username', 'firstname', 'lastname'
  , '_primaryAddress', '_primaryPhone', 'onBoarded', 'admin'
  , 'created_at', 'updated_at', 'sendNotifEmails'
  , 'sharedSecretPrompt', 'sharedSecretAnswer'
  , 'firstLogin' , 'MSUsername', 'MSUniqueId'
  , 'enable_2fa' , 'secret_2fa', 'qrcode_2fa'
]
 
let logger = global.logger;

exports.getLoggedInUser = (req, res) => {
  /**
   * Check if user is logged in and if so return the user object
   * Relies on existing "requireLogin" to populate the user
   * To be used for checking login status and refreshing user on mobile
   */
  res.send({success: true, user: req.user})
}

exports.utilSearch = (vectorQueryString, callback) => {
  // global ADMIN search
  User.query()
  .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}')`)
  .then(users => {
    callback({success: true, users})
  })
}

exports.objectSearch = (req, res) => {
  console.log("admin global text search")
  // this is much more limited than the client and firm searches
  // all an admin can really search for are users, firms, tags?

  // permissions: this route is admin protected

  console.log("QUERY", req.query.value);
  let vectorQueryString = req.query.value.replace(/ /g, " & ")
  console.log("VECTOR QUERY STRING", vectorQueryString)

  async.parallel({
    users: cb => {
      exports.utilSearch(vectorQueryString, userResult => {
        cb(null, userResult.users)
      })
    }
    , firms: cb => {
      firmsCtrl.utilSearch(vectorQueryString, firmsResult => {
        cb(null, firmsResult.firms)
      })
    }
    , tags: cb => {
      tagsCtrl.utilSearch(vectorQueryString, null, tagsResult => {
        cb(null, tagsResult.tags)
      })
    }
  }, (err, results) => {
    // console.log("END ASYNC", results)
    if(err) {
      console.log("ERROR IN ASYNC PARALLEL!", err);
    }
    res.send({success: true, ...results  });
  })
}


exports.list = (req, res) => {
  User.query()
  .select(...safeUserFields)
  .then(users => {
    res.send({ success: true, users });
  })
}

exports.paginatedList = (req, res) => {
  User.query()
  .select(...safeUserFields)
  .then(userList => {
    // get page from params or default to first page
    const page = parseInt(req.params.page);
    // get per page
    const pageSize = parseInt(req.params.per);
    const totalPages = Math.ceil(userList.length / pageSize);
    const pager = paginate(userList.length, page, pageSize, totalPages);
    // get page of items from items array
    const users = userList.slice(pager.startIndex, pager.endIndex + 1);

    // return pager object and current page of items
    res.send({ success: true, pager, users, userList });
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of users queried from the array of _id's passed in the query param
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
    User.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, users) => {
        if(err || !users) {
          res.send({success: false, message: `Error querying for users by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, users});
        }
    })
  }
}

exports.listByNonClientUser = (req, res) => {
  console.log("non client users")
  Staff.query()
    .then(staffUsers => {
      let userIds = staffUsers.map(su => su._user);

      console.log("userIds", userIds);
      User.query()
      .select(["_id", "username"])
      .whereIn('_id', userIds) // needs testing
      .then(users => {
        let emails = users.map(user => user.username);
        User.query()
          .select(["_id", "username"])
          .where({admin: true})
          .then(users => {
            emails = emails.concat(users.map(user => user.username));

            emails = emails.filter(el => { return el != ''});
            //remove duplicates

            emails = emails.filter((x, i, a) => a.indexOf(x) == i);
            console.log("emails", emails);
            res.send({success: true, count: emails.length, emails: emails})
          })
      })
    })
}

exports.listByClient = (req, res) => {
  exports.utilListByClient(req.user, req.params.clientId, result => {
    res.send(result)
  }, req);
}

exports.listByClientArchivedUser = (req, res) => {
  const clientId = req.params.clientId;
  const user = req.user;
  logger.info('Find all clientUsers associated with this clientId:', clientId);

  if(!clientId || clientId == "null") res.send({success: false, message: "You do not have permission to access this Client" })

  Client.query().findById(clientId)
  .then(client => {
    if(req.firm && req.firm._id == client._firm) {
      ClientUser.query()
      .where({_client: clientId, status: "archived"})
      .then(clientUsers => {
        logger.info('clientUsers found');
        // console.log(clientUsers);
        let userIds = clientUsers.map(cu => cu._user);
        if(!clientUsers || !clientUsers.length > 0) {
          res.send({success: true, users: []});
        } else {
          User.query()
          .select(...safeUserFields)
          .whereIn('_id', userIds) // needs testing
          .then(users => {
            res.send({success: true, users});
          })
        }
      })
    } else {
      permissions.utilCheckClientPermission(user, clientId, "client", permission => {
        console.log("client permission check", permission)
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this Client"})
        } else {
          ClientUser.query()
          .where({_client: clientId, status: "archived"})
          .then(clientUsers => {
            logger.info('clientUsers found');
            // console.log(clientUsers);
            let userIds = clientUsers.map(cu => cu._user);
            if(!clientUsers || !clientUsers.length > 0) {
              res.send({success: true, users: []});
            } else {
              User.query()
              .select(...safeUserFields)
              .whereIn('_id', userIds) // needs testing
              .then(users => {
                res.send({success: true, users});
              })
            }
          })
        }
      })
    }

  })
}

exports.utilListByClient = (user, clientId, callback, req = {}) => {

  logger.info('Find all clientUsers associated with this clientId:', clientId);

  if(!clientId || clientId == "null") callback({success: false, message: "You do not have permission to access this Client" })

  Client.query().findById(clientId)
  .then(client => {
    if(req.firm && req.firm._id == client._firm) {
      ClientUser.query()
      .where({_client: clientId, status: "active"})
      .then(clientUsers => {
        logger.info('clientUsers found');
        // console.log(clientUsers);
        let userIds = clientUsers.map(cu => cu._user);
        if(!clientUsers || !clientUsers.length > 0) {
          callback({success: true, users: []});
        } else {
          User.query()
          .select(...safeUserFields)
          .whereIn('_id', userIds) // needs testing
          .then(users => {
            callback({success: true, users});
          })
        }
      })
    } else {
      permissions.utilCheckClientPermission(user, clientId, "client", permission => {
        console.log("client permission check", permission)
        if(!permission) {
          callback({success: false, message: "You do not have permission to access this Client"})
        } else {
          ClientUser.query()
          .where({_client: clientId, status: "active"})
          .then(clientUsers => {
            logger.info('clientUsers found');
            // console.log(clientUsers);
            let userIds = clientUsers.map(cu => cu._user);
            if(!clientUsers || !clientUsers.length > 0) {
              callback({success: true, users: []});
            } else {
              User.query()
              .select(...safeUserFields)
              .whereIn('_id', userIds) // needs testing
              .then(users => {
                callback({success: true, users});
              })
            }
          })
        }
      })
    }

  })
}

exports.listByStaff = (req, res) => {
  exports.getListByStaff(req, res, result => {
    res.send(result);
  });
}

exports.getListByStaff = (req, res, callback) => {
  logger.info('Find all client users (contacts) associated with this staff member:', req.params.staffId);
  Staff.query().from('staff as s')
  .innerJoin('firms as f', 'f._id', 's._firm')
  .leftJoin('subscriptions as sb', 'sb._firm', 'f._id')
  .whereNot({ 'sb.status': 'canceled' })
  .where({ 's._id': req.params.staffId })
  .select('s.*')
  .groupBy(['f._id', 's._id', 'sb._id'])
  .first()
  .asCallback((err, staff) => {
    if(err || !staff) {
      callback({success: false, message: "Error finding staff"});
    } else {
      permissions.utilCheckFirmPermission(req.user, staff._firm || null, "access", permission => {
        if(!permission) {
          logger.error("user does NOT have permission.")
          callback({success: false, message: "You do not have permisson to access this."})
        } else {
          logger.info("User had permission. Proceed with staff checks")  
          if(staff.owner || req.user.admin) {
            logger.info("Staff user is owner, fetch all")
            // staff is owner, fetch all clientUsers 
            ClientUser.query()
            .where({_firm: staff._firm})
            // .whereNot({ status: "deleted" })
            .where(builder => {
              builder.whereNot({ status: "deleted" });
              builder.whereNot({ status: "clientArchived" });
            })
            .then(clientUsers => {
              logger.info('clientUsers found');
              // console.log(clientUsers);
              let userIds = clientUsers.map(cu => cu._user);
              if(!clientUsers || !clientUsers.length > 0) {
                callback({success: true, users: []});
              } else {
                User.query()
                .select(...safeUserFields)
                .whereIn('_id', userIds) // needs testing
                .orderBy('firstname')
                .then(users => {
                  callback({success: true, users});
                })
              }
            })
          } else {
            logger.info("Staff user is NOT owner, fetch assigned")
            // staff is NOT owner, only fetch the client users associated with assigned accounts 
            StaffClient.query() 
            .where({ _staff: req.params.staffId })
            .asCallback((err, staffClients) => {
              if(err) {
                callback({success: false, message: 'Error finding staffClients'})
              } else {
                logger.info('staffClients found');
                console.log(staffClients);
                let clientIds = staffClients.map(sc => sc._client);
                ClientUser.query()
                .whereIn('_client', clientIds)
                .where(builder => {
                  builder.whereNot({ status: "deleted" });
                  builder.whereNot({ status: "clientArchived" });
                })
                .asCallback((err2, clientUsers) => {
                  if(err2) {
                    callback({success: false, message: "Error finding clientUsers"});
                  } else {
                    logger.info('client users found, now find users');
                    let userIds = clientUsers.map(cu => cu._user);
                    if(!clientUsers || !clientUsers.length > 0) {
                      callback({success: true, users: []});
                    } else {
                      User.query()
                      .select(...safeUserFields)
                      .whereIn('_id', userIds) // needs testing
                      .orderBy('firstname')
                      .asCallback((err, users) => {
                        if(err) {
                          callback({success: false, message: "trouble fetching users"});
                        } else {
                          logger.info('success');
                          callback({success: true, users});
                        }
                      })
                    }
                  }
                })
              }
            })
          }
        }
      })
    }
  })
}

exports.listByFirm = (req, res) => {
  logger.info('Find all clientUsers (contacts) associated with this firmID:', req.params.firmId);

  Firm.query().findById(req.params.firmId)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Could not find matching Firm"})
    } else {
      if(req.firm && req.firm._id == req.params.firmId) {
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
          let userIds = clientUsers.map(cu => cu._user);
          if(!clientUsers || !clientUsers.length > 0) {
            res.send({success: true, users: []});
          } else {
            User.query()
            .select(...safeUserFields)
            .whereIn('_id', userIds) // needs testing
            .then(users => {
              res.send({success: true, users});
            })
          }
        })
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
              let userIds = clientUsers.map(cu => cu._user);
              if(!clientUsers || !clientUsers.length > 0) {
                res.send({success: true, users: []});
              } else {
                User.query()
                .select(...safeUserFields)
                .whereIn('_id', userIds) // needs testing
                .then(users => {
                  res.send({success: true, users});
                })
              }
            })
          }
        });
      }

    }
  })
}

exports.listByFirmStaff = (req, res) => {
  logger.info('Find all staff users associated with this firmId:', req.params.firmId);

  Firm.query().from('firms as f')
  .leftJoin('subscriptions as s', 's._firm', 'f._id')
  .where({ 'f._id': req.params.firmId})
  .whereNot({ 's.status': 'canceled' })
  .select('f.*')
  .groupBy(['f._id', 's._id'])
  .first()
  .asCallback((err, firm) => {
    if(err || !firm) {
      res.send({success: false, message: "Could not find matching Firm"})
    } else {

      if(req.firm && req.firm._id && req.firm._id == firm._id) {
        Staff.query()
        .where({_firm: req.params.firmId})
        .then(staff => {
          logger.info('staff found');
          // console.log(staff);
          let userIds = staff.map(s => s._user);
          if(!staff || !staff.length > 0) {
            res.send({success: true, users: []});
          } else {
            User.query()
            .select(...safeUserFields)
            .whereIn('_id', userIds) // needs testing
            .then(users => {
              res.send({success: true, users});
            })
          }
        })
      } else {
        permissions.utilCheckFirmPermission(req.user, req.params.firmId, 'client', permission => {
          if(!permission) {
            res.send({success: false, message: "You do not have permission to access this Firm"});
          } else {
            Staff.query()
            .where({_firm: req.params.firmId})
            .then(staff => {
              logger.info('staff found');
              // console.log(staff);
              let userIds = staff.map(s => s._user);
              if(!staff || !staff.length > 0) {
                res.send({success: true, users: []});
              } else {
                User.query()
                .select(...safeUserFields)
                .whereIn('_id', userIds) // needs testing
                .then(users => {
                  res.send({success: true, users});
                })
              }
            })
          }
        })
      }
    }
  })
}

exports.listByClientStaff = (req, res) => {
  // exports.utilCheckClientPermission = (user, clientId, level="access", callback) => {
  logger.info('Find all staff users associated with this clientId:', req.params.clientId);
  permissions.utilCheckClientPermission(req.user, req.params.clientId, "client", permission => {
    if(!permission) {
      res.send({success: false, message: "You do not have permission to access this Firm"});
    } else {
      StaffClient.query()
      .where({ _client: req.params.clientId })
      .then(staffClient => {
        logger.info('staffClient found');
        // console.log(staff);
        const staffIds = staffClient.map(s => s._staff);
        if (staffIds && staffIds.length) {
          Staff.query()
            .whereIn('_id', staffIds)
            .where({ status: "active" })
            .then(staff => {
              let userIds = staff.map(s => s._user);
              if(userIds && userIds.length) {
                User.query()
                .select(...safeUserFields)
                .whereIn('_id', userIds) // needs testing
                .then(users => {
                  res.send({success: true, users});
                });
              } else {
                res.send({success: true, users: []});
              }
            })
        } else {
          res.send({success: true, users: []});
        }
      })
    }
  })
}

exports.listByRefs = (req, res) => {
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   * TODO: server side pagination
   */

  /**
   * TODO: Add permissions checks here.  will have to find firmId somehow...
   */
  // build query
  let query = {
    [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
  }
  // test for optional additional parameters
  const nextParams = req.params['0'];
  if(nextParams.split("/").length % 2 == 0) {
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }
    User.query()
    .select(...safeUserFields)
    .where(query)
    .then(users => {
      res.send({success: true, users})
    })
  }
}

exports.getById = (req, res) => {
  /**
   * TODO: Add permissions checks here.  will have to find firmId somehow...
   */
  User.query()
  .select(...safeUserFields)
  .findById(req.params.id)
  .then(user => {
    if(user) {
      res.send({success: true, user})
    } else {
      res.send({success: false, message: "User not found"});
    }
  })
}

exports.utilCheckAndSaveUser = (userData, callback) => {
  logger.info("checking and saving user");
  /**
   * NOTE: We need both register and create for yote admin to function.
   * This util method handles most of the creation stuff
   */

  // if request from bulk, avoid checking validation
  if (userData.fromBulkInvite) {
    delete userData.fromBulkInvite;
    if (userData.username === '') {
      const time = Math.floor(Math.random() * 100 + parseInt(new Date().getTime()));
      userData.username = `hideme.ricblyz+${time}@gmail.com`;
    }
  } else {

    // Remove case senstivity and trim whitespase on the username
    userData.username = userData.username.toLowerCase().trim();

    // regex checks for ____@____.__
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isValid = re.test(userData.username);
    
    if (!isValid) {
      logger.debug("invalid email");
      callback({ success: false, message: "Invalid email address." });
      return;
    }

    // check password for length
    if(userData.password.length <= 6) {
      logger.debug("password too short");
      callback({ success: false, message: "Password not long enough. Min 6 characters." });
      return;
    }
  }

  // perform additional checks
  userData.password_salt = User.createPasswordSalt();
  userData.password_hash = User.hashPassword(userData.password_salt, userData.password);

  // now delete raw password field
  delete userData.password;
  delete userData.password2;
  delete userData.roles; // this is changed to admin boolean

  User.query().insert(userData)
  .asCallback((err, user) => {
    if(err || !user) {
      callback({success: false, message: "Could not create user"});
    } else {
      callback({success: true, user})
    }
  });
}

exports.create = (req, res) => {
  let userData = req.body;
  exports.utilCheckAndSaveUser(userData, function(result) {
    res.send(result);
  });
}

exports.register = (req, res, next) => {
  let userData = req.body;
  userData.admin = false; // don't let registering user set their own roles
  user.firstLogin = true;
  exports.utilCheckAndSaveUser(userData, function(result) {
    if(!result.success) {
      res.send(result);
    } else {
      req.login(result.user, function(err) {
        if(err) {
          logger.error("ERROR LOGGING IN NEW USER");
          logger.error(err);
          return next(err);
        } else {
          // check if this is coming from mobile & requires a token in response
          if(req.param("withToken")) {
            logger.info("create api token for mobile user");
            result.user.createToken(function(err, token) {
              if(err || !token) {
                res.send({ success: false, message: "unable to generate user API token" });
              } else {
                res.send({ success: true, user: result.user, token });
              }
            });
          } else {
            logger.info("NEWLY REGISTERED USER LOGGING IN");
            logger.warn(req.user.username);
            res.send({ success:true, user: result.user });
          }
        }
      });
    }
  });

}

exports.update = (req, res) => {
  console.log("admin update user");
  /**
   * NOTE: this is intended to be things an "admin" user can update about any
   * user in the system.
   * i.e. (user roles/permissions, etc.)
   */

  // find user
  User.query().findById(req.params.userId)
  .then(user => {
    if(!user) {
      res.send({success: false, message: "Unable to locate user account"});
    } else {
      // set things
      user.username = req.body.username;
      user.firstname = req.body.firstname;
      user.lastname = req.body.lastname;
      user._primaryAddress = req.body._primaryAddress;
      user._primaryPhone = req.body._primaryPhone;
      user.onBoarded = req.body.onBoarded;
      user.enable_2fa = req.body.enable_2fa;

      // admin only fields
      user.admin = req.body.admin;

      // console.log("USER", user)

      User.query()
      .findById(req.params.userId)
      .update(user)
      .returning(safeUserFields)
      .then(user => {
        res.send({success: true, user})
      })
      .catch(err => {
        res.status(500)
        res.send({success: false, message: 'Email already exists.'});
      })
    
    }
  })
  .catch(err => {
    res.status(500)
    res.send({success: false, message: 'User not found.'});
  })

  // const userId = parseInt(req.params.id) // has to be an int
  
}

exports.updateProfile = (req, res) => {
  /**
   * NOTE: this is intended to be things the user updates about themselves
   * i.e. (billing info, profile picture, account status, etc.)
   *
   * NOTE: Also, this is separate from password updates, which has its own method
   */

  // find user
  User.query().findById(req.user._id)
  .then(user => {
    if(!user) {
      res.send({success: false, message: "Unable to locate user account"});
    } else {
      let enable_2fa = user.enable_2fa;

      // set things
      user.username = req.body.username;
      user.firstname = req.body.firstname;
      user.lastname = req.body.lastname;
      user._primaryAddress = req.body._primaryAddress;
      user._primaryPhone = req.body._primaryPhone;
      user.sendNotifEmails = req.body.sendNotifEmails;
      user.sharedSecretPrompt = req.body.sharedSecretPrompt;
      user.sharedSecretAnswer = req.body.sharedSecretAnswer; 
      user.MSUsername = req.body.MSUsername;
      user.MSUniqueId = user.MSUsername ? req.body.MSUniqueId : '';
      user.enable_2fa = req.body.enable_2fa
      // set onBoarded if ready.
      if(
        !user.onBoarded
        && user._primaryAddress
        && user._primaryPhone
      ) {
        user.onBoarded = true
        // NOTE: We probably want this to be type date with a default of null.
        // user.onBoarded = new Date();
      }

      console.log('this is enable_2fa', enable_2fa);

      if(req.body.action &&
        req.body.action == 'generate_qrcode') {
          const tempSecret = speakeasy.generateSecret({
            name: `Imaginetime ${user._id} Key`,
            length: 20
          });

          qrcode.toDataURL(tempSecret.otpauth_url, function(err, data) {
            user.qrcode_2fa = tempSecret.otpauth_url;
            user.secret_2fa = tempSecret.base32;

            User.query()
              .findById(user._id)
              .update(user)
              .returning('*')
              .then((updatedUser) => {
                updatedUser.qrcode_data = data;
                res.send({success: true, user: updatedUser});
              })
          });
      } else {
        if(req.body.MSUsername) {
          User.query()
            .where({
              MSUsername: req.body.MSUsername
            })
            .whereNot({
              _id: req.user._id
            })
            .then((users) => {
              console.log('users', users);
              if(users.length > 0) {
                res.send({success: false, message: 'Microsoft Account is already connected'})
              } else {
                if(req.body.enable_2fa && enable_2fa != req.body.enable_2fa) {
                  const verified = speakeasy.totp.verify({
                    secret: user.secret_2fa,
                    token: req.body.token,
                    encoding: "base32"
                  });
  
                  if(verified) {
                    User.query()
                    .findById(req.user._id)
                    .update(user)
                    .returning(safeUserFields)
                    .then(async user => {
                      if(user.secret_2fa && user.qrcode_2fa) {
                        user.qrcode_data = await qrcode.toDataURL(user.qrcode_2fa).then(data => {return data;});
                      }
                      res.send({success: true, user})
                    })
                  } else {
                    res.send({ success: false, message: 'Invalid Security Code' });
                  }
                } else {
                  // update the fields
                  User.query()
                  .findById(req.user._id)
                  .update(user)
                  .returning(safeUserFields)
                  .then(async user => {
                    if(user.secret_2fa && user.qrcode_2fa) {
                      user.qrcode_data = await qrcode.toDataURL(user.qrcode_2fa).then(data => {return data;});
                    }
                    res.send({success: true, user})
                  })
                }
              }
            })
        } else {
  
          if(req.body.enable_2fa && enable_2fa != req.body.enable_2fa) {
            const verified = speakeasy.totp.verify({
              secret: user.secret_2fa,
              token: req.body.token,
              encoding: "base32"
            });
  
            if(verified) {
              User.query()
              .findById(req.user._id)
              .update(user)
              .returning(safeUserFields)
              .then(async user => {
                if(user.secret_2fa && user.qrcode_2fa) {
                  user.qrcode_data = await qrcode.toDataURL(user.qrcode_2fa).then(data => {return data;});
                }
                res.send({success: true, user})
              })
            } else {
              res.send({ success: false, message: 'Invalid Security Code' });
            }
          } else {
            // update the fields
            User.query()
            .findById(req.user._id)
            .update(user)
            .returning(safeUserFields)
            .then(async user => {
              if(user.secret_2fa && user.qrcode_2fa) {
                user.qrcode_data = await qrcode.toDataURL(user.qrcode_2fa).then(data => {return data;});
              }
              res.send({success: true, user})
            })
          }
        }
      }
    }
  })
}

exports.updateSecretQuestion = (req, res) => {
  /**
   * NOTE: only for updating a user's secret question/answer 
   */
  User.query().findById(req.params.reqUserId)
  .then(reqUser => {
    if(!reqUser) {
      res.send({success: false, message: "Not a user"}); 
    } else {
      permissions.utilCheckFirmPermission(reqUser, req.params.firmId, "access", permission => {
        // check if requesting user is firm admin or user that is being updated
        if(permission || reqUser._id == req.body._id) {
          User.query().findById(req.body._id)
          .then(user => {
            if(!user) {
              res.send({success: false, message: "Unable to locate user account"});
            } else {
              // set new secret question and answer
              user.sharedSecretPrompt = req.body.sharedSecretPrompt;
              user.sharedSecretAnswer = req.body.sharedSecretAnswer; 

              User.query()
              .findById(req.body._id)
              .update(user)
              .returning(safeUserFields)
              .then(user => {
                res.send({success: true, user})
              })
            }
          }) 
        }
      });
    }
  })
}

exports.changePassword = (req, res) => {
  // res.send({success: false, message: "Not implemented for Postgres yet"});
  // return;
  /**
   * 
   * This is a special method that allows the user to change their password from
   * within the client
   */
  logger.debug("change password");

  // validate new password
  if(req.body.newPass !== req.body.newPassConfirm) {
    res.send({ success: false, message: "New passwords do not match" });
  } else if(req.body.newPass == "") {
    res.send({ success: false, message: "Invalid New Password" });
  } else {
    User.query()
    .findById(req.user._id)
    .then(user => {
      if(!user) {
        res.send({success: false, message: "User not found"});
      } else {
        if(user.onboarded) {
          logger.debug("checking old password...");

          if(User.hashPassword(user.password_salt, req.body.oldPass) == user.password_hash) {
            // old password is correct. Now change it.
            logger.debug("password matches.");
            const newSalt = User.createPasswordSalt();
            const newHash = User.hashPassword(newSalt, req.body.newPass);
            user.password_salt = newSalt;
            user.password_hash = newHash;

            User.query()
            .findById(req.user._id)
            .update(user)
            .returning(safeUserFields)
            .then(user => {
              res.send({success: true, user})
            })
          } else {
            res.send({ success: false, message: "Old Password Incorrect" });
          }
        } else {
          logger.debug("first time onboarding user"); 
          const newSalt = User.createPasswordSalt();
          const newHash = User.hashPassword(newSalt, req.body.newPass);
          user.password_salt = newSalt;
          user.password_hash = newHash;

          User.query()
          .findById(req.user._id)
          .update(user)
          .returning(safeUserFields)
          .then(user => {
            res.send({success: true, user})
          })
        }

      }
    })
  }
}

/**
 * Determines and returns the 'FromInfo' to be used to send forgot password
 * email to the given user.
 * @param {object} user 
 * @return FromInfo object containing 'name' and 'replyTo' attributes based on
 * the following critieria:
 * If the user is only a client portal user and not a staff or global admin, the
 * 'FromInfo' of the newest firm, by database id for which it is an active client
 * portal user, is returned.
 * Otherwise, 
 */
async function getFromEmailInfo(user) {
  let fromInfo = {
    name: brandingName.title
    , replyTo: null
  }

  // if user is global admin (i.e. user.owner), use the imagine time branding as 'FromName'.
  if(!user.owner) {
    let staffs = await Staff.query()
    .where('_user', user._id)
    .where('status', 'active')
    .columns(['_id', '_firm'])
    .limit(1);

    let clientPortalUsers = await ClientUser.query()
    .where('_user', user._id)
    .where('status', 'active')
    .columns(['_id', '_firm'])
    .orderBy('_firm', 'desc')
    .limit(1);

    // if the user is not an active staff member and is an active client
    // portal user, use the firm name of the newest of the firms the
    // client portal user belongs to,  as 'FromName'.
    if(!!clientPortalUsers && !!clientPortalUsers.length && (!staffs || !staffs.length)) {
      fromInfo = await firmsCtrl.getEmailFromInfo(clientPortalUsers[0]._firm, null);
      //logger.debug('User is client portal user for firm[id:', clientPortalUsers[0]._firm, ']. FromInfo is [', fromInfo, ']');
      return fromInfo;
    }
    // if the user is an active staff member, use the imagine time branding as 'FromName'.
  }
  //logger.debug('User is', (user.admin ? 'admin.' : 'a staff.'), 'FromInfo is [', fromInfo, ']');
  return fromInfo;
}

exports.requestPasswordReset = function(req, res) {
  /**
   * Let the user request that a password reset link is sent to their email/username
   */

  // how to set the custom url's here? this can come from anywhere for any user, so no way to grab firm object
  // plan is to just send them a link to the same place that they requested it from
  
  // (logic from firmsController check domain)
  let domain = req.hostname; // doesnt include port
  // usually, we want to ignore the port. but for dev we need to keep it for the checks, sinces its nonstandard
  const fullhost = req.headers.host; // includes port
  if(fullhost.includes('localhost') || fullhost.includes('127.0.0.1')) {
    domain = fullhost;
  }
  
  logger.debug("user requested password reset for " + req.body.email);
  if(req.body.email && req.body.email == "" && req.body.email.trim()) {
    res.send({ success: false, message: "Email needed to reset password." });
  } else {
    req.body.email = req.body.email.trim().toLowerCase();
  }

  User.query()
  .findOne({username: req.body.email})
  .then(user => {
    if(!user) {
      logger.debug("fail: no user with that email found");
      res.send({ success: false, message: "No user with that email found. Please register." });
    } else {
      user.resetPasswordTime = new Date();
      user.resetPasswordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);
      user.firstLogin = false;

      User.query()
      .findById(user._id)
      .update(user)
      .returning('*')
      .then(async user => {

        if(req.body.isFirstLogin) {
          res.send({ success: true, message: "", data: {hex: user.resetPasswordHex} });
        } else {
          const clientUsers = await ClientUser.query()
            .where({_user: user._id})
            .then((clientUsers) => {
              return clientUsers;
            });

          let hasNoInviteSent = false;

          if(clientUsers.length <= 0) {
            hasNoInviteSent = user.firstLogin ? true : false;
          } else {
            hasNoInviteSent = clientUsers.every(cu => user.firstLogin && cu.accessType == 'noinvitesent');
          }

          if(hasNoInviteSent) {
            res.send({ success: false, message: 'Unable to forgot password: Initial invite was not sent'});
            return;
          }

          // send user an email with their reset link.
          logger.debug("creating password reset email");
          logger.info(user.resetPasswordHex);
          
          // start
          const fromInfo = await getFromEmailInfo(user);

          const template = 'notification-email';
          const subject = 'Your Password for ImagineTime';
          const targets = [user.username];
          const resetUrl = `http://${domain}/user/reset-password/${user.resetPasswordHex}`;
          const notifContent =  `<span>
                                    <span><h4 style="line-height: 150%">You have requested a password reset for your ImagineTime account.</h4></span>
                                    <br/>
                                    <p style="font-size:14px">You reset link will be active for 24 hours.</p>
                                    <p style="font-size:14px">If you believe you received this email by mistake, please contact ImagineTime at <a href='mailto:${brandingName.email.support}'>${brandingName.email.support}</a></p>
                                    <br/>
                                    <span style="font-size:14px">To Reset ImagineTime Password, Click this button:</span>
                                </span>`;

          const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="left">
                                <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                                    <tbody>
                                        <tr>
                                            <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                                              <a class="mcnButton " title="Reset ImagineTime Password" href=${resetUrl} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Reset ImagineTime Password</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table class="m_-6296418028554224545mcnTextContentContainer" style="min-width:100%!important;background-color:#ebebeb;margin-top: 20px;" width="100%" cellspacing="0" border="0">
                                  <tbody>
                                    <tr>
                                      <td class="m_-6296418028554224545mcnTextContent" style="padding:18px;color:#000000;font-family:Helvetica;font-size:12px;font-weight:normal;text-align:left" valign="top">
                                        Trouble with the link above? You can copy and paste the following URL into your web browser:<br>
                                        <span>
                                          <a href=${resetUrl} target="_self">${resetUrl}</a>
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>                              
                            </td>`
          const content = [
            { name: 'notifLink' , content: notifLink }
            , { name: 'notifContent', content: notifContent}
            , { name: 'firmLogo', content: '' } 
          ]

          emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
            res.send({ success: data.success, message: data.message });
          });   
        }     
      })
    }
  })

}

exports.checkResetRequest = (req, res) => {
  // use the utility method to check for valid reset request
  exports.utilCheckResetRequest(req.params.resetHex, result => {
    if(result.success) {
      res.send({ success: true }); // DONT send user id back
    } else {
      res.send({ success: false, message: "Invalid or Expired Token" });
    }
  });
}

exports.utilCheckResetRequest = function(resetHex, callback) {
  /**
   * This checks that the user is using a valid password reset request.
   * Token must be a matching hex and no older than 24 hours.
   */
  console.log("resetHex", resetHex)
  User.query()
  .findOne({ resetPasswordHex: resetHex })
  .then(user => {
    console.log("user", user);
    if(!user) {
      callback({success: false, message: "1 Invalid or Expired Reset Token" });
    } else {
      let nowDate = new Date();
      let cutoffDate = new Date(user.resetPasswordTime);
      let validHours = 24;
      cutoffDate.setHours((cutoffDate.getHours() + validHours));
      if(nowDate < cutoffDate) {
        callback({ success: true, userId: user._id });
      } else {
        callback({ success: false, message: "2 Invalid or Expired Reset Token" });
      }
    }
  })
}

exports.resetPassword = (req, res) => {
  // before reseting the password, use the utility check to ensure a valid request
  exports.utilCheckResetRequest(req.body.resetHex, result => {
    if(result.success) {
      if(!req.body.newPass || req.body.newPass.length < 6) {
        logger.warn("needs to use a better password");
        res.send({ success: false, message: "Password requirements not met: Must be at least 6 characters long." }); //bare minimum
      } else {
        User.query()
        .findById(result.userId)
        .then(user => {
          if(!user) {
            res.send({success: false, message: "Could not retrieve User"});
          } else {
            logger.debug("resetting user password");
            const newSalt = User.createPasswordSalt();
            const newHash = User.hashPassword(newSalt, req.body.newPass);
            user.password_salt = newSalt;
            user.password_hash = newHash;
            user.firstLogin = false;
            user.resetPasswordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);

            User.query()
            .findById(user._id)
            .update(user)
            .returning(safeUserFields)
            .then(user => {
              res.send({success: true, user})
            })
          }
        })
      }
    } else {
      res.send(result);
    }
  });
}

exports.delete = function(req, res) {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  logger.debug("deleting user " + req.param('userId'));

  User.findById(req.param('userId')).remove(function(err) {
    logger.debug("done removing?");
    logger.debug(err);
    if(err) {
      res.send({ success: false, message: err });
    } else {
      res.send({ success: true, message: "Deleted user."});
    }
  });
}

exports.inviteResetPassword = (req, user, client, firm, callBack) => {
  const sender = req.user;

  let passwordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);                
  user.resetPasswordHex = passwordHex;
  user.resetPasswordTime = new Date();   

  // perform additional checks
  user.password_salt = User.createPasswordSalt();
  user.password_hash = User.hashPassword(user.password_salt, passwordHex);

  // change password to hex type
  User.query().findById(user._id)
  .update(user)
  .then(json => {

    console.log("updated user", user);

    // (logic from firmsController check domain)
    let domain = req.hostname; // doesnt include port

    // usually, we want to ignore the port. but for dev we need to keep it for the checks, sinces its nonstandard
    const fullhost = req.headers.host; // includes port
    if(fullhost.includes('localhost') || fullhost.includes('127.0.0.1')) {
      domain = fullhost;
    }

    let note = {
      url: `http://${domain}/user/reset-password/${user.resetPasswordHex}`
    }

    clientUsersCtrl.utilCreateAndInviteClientUser(client, user, firm, sender, note, passwordHex, true, result => {
      callBack(result);
    });
  });
}

exports.msAuthentication = (req, res) => {
  console.log('ms authenticated');

  const htmlContent = `
    <p>
      Microsoft Account is authenticated
    </p>
    <script>
      setTimeout(function() {
        window.close();
      }, 5000)
    </script>
  `
  res.setHeader('Content-type','text/html');
  res.send(htmlContent);
}

exports.searchV2 = (req, res) => {
  const searchPageNumber = ((req.body.searchPageNumber || 1) - 1) * req.body.searchPerPage;
  const searchPerPage = req.body.searchPerPage;
  const searchSortName = req.body.searchSortName;
  const searchSortAsc = req.body.searchSortAsc;
  let searchText = req.body.searchText;
  searchText = searchText || '';
  searchText = searchText && searchText.trim();
  searchText = searchText && searchText.toLowerCase();

  User.query()
  .select(...safeUserFields, raw('concat(firstname,  \' \', lastname) as name'))
  .orderBy(searchSortName, searchSortAsc)
  .select('*')
  .whereRaw('concat(LOWER(firstname),  \' \', LOWER(lastname),  \' \', LOWER(username)) LIKE ?', `%${searchText}%`)
  .then(userList => {

    const totalPages = Math.ceil(userList.length / searchPerPage);
    const pager = paginate(userList.length, searchPageNumber, searchPerPage, totalPages);

    // get page of items from items array
    const users = userList.slice(pager.startIndex, pager.endIndex + 1);

    // return pager object and current page of items
    res.send({ success: true, pager, users });
  })

}