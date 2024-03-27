/**
 * Sever-side controllers for ClientUser.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientUser
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientUser = require('./ClientUserModel');
const Client = require('../client/ClientModel');
const Firm = require('../firm/FirmModel');
const User = require('../user/UserModel');
const File = require('../file/FileModel');
const StaffClient = require('../staffClient/StaffClientModel');
const Address = require('../address/AddressModel');
const PhoneNumber = require('../phoneNumber/PhoneNumberModel');



// controllers
const usersController = require('../user/usersController');
const notificationsCtrl = require('../notification/notificationsController');
const emailUtil = require('../../global/utils/email');
const firmsController = require('../firm/firmsController');

const async = require('async');
const permissions = require('../../global/utils/permissions');
const logger = global.logger;
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const brandingName = require('../../global/brandingName.js').brandingName;
const COUNTRIES = require('../../global/constants').COUNTRIES;

exports.list = (req, res) => {
  ClientUser.query()
  .whereNot('status', 'deleted')
  .then(clientUsers => {
    res.send({success: true, clientUsers})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientUsers queried from the array of _id's passed in the query param
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
    // ClientUser.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientUsers) => {
    //     if(err || !clientUsers) {
    //       res.send({success: false, message: `Error querying for clientUsers by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientUsers.length == 0) {
    //       ClientUser.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientUsers) => {
    //         if(err || !clientUsers) {
    //           res.send({success: false, message: `Error querying for clientUsers by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientUsers});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientUsers});
    //     }
    // })
    ClientUser.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientUsers) => {
        if(err || !clientUsers) {
          res.send({success: false, message: `Error querying for clientUsers by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientUsers});
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
      res.send({ success: true, clientUsers: [] });
    } else {
      ClientUser.query().from('clientusers as c')
      .innerJoin('firms as f', 'f._id', 'c._firm')
      .leftJoin('subscriptions as s', 's._firm', 'f._id')
      .whereNot({ 's.status': 'canceled' })
      .where(builder => {
        // builder.whereNot(`c.status`, "deleted");
        Object.keys(query).map(item => {
          if (item && query[item]) {
            builder.where(`c.${item}`, query[item]);
          }
        })
      })
      .select('c.*')
      .groupBy(['f._id', 'c._id'])
      .asCallback((err, clientUsers) => {
        console.log(err)
        if(err || !clientUsers) {
          res.send({success: false, message: "Error retrieving Staff list"})
        } else {
          res.send({success: true, clientUsers})
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
    ClientUser.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientUsers) => {
      if(err || !clientUsers) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientUsers: clientUsers
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientUser.find(mongoQuery).exec((err, clientUsers) => {
      if(err || !clientUsers) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientUsers: clientUsers });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientUser by id');
  ClientUser.query().findById(req.params.id)
  .whereNot('status', 'deleted')
  .then(clientUser => {
    if(clientUser) {
      res.send({success: true, clientUser})
    } else {
      res.send({success: false, message: "ClientUser not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientUser schema ');
  res.send({success: true, schema: ClientUser.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientUser default object');
  res.send({success: true, defaultObj: ClientUser.defaultObject});
  // res.send({success: false})
}

exports.utilGetByClientId = (clientId, cb) => {
  console.log('clientId', clientId)
  if(clientId) {
    // build query
    let query = {
      _client: clientId
    }
    ClientUser.query()
    .where(query)
    .whereNot("status", "deleted")
    .asCallback((err, clientUsers) => {
      if(err) {
        cb(err, null)
      } else {
        console.log('clientUsers', clientUsers)
        cb(null, clientUsers);
      }
    });
  } else {
    cb('ERROR: No client id specified.', null)
  }
}

exports.create = (req, res) => {
  logger.info('creating new clientUser');
  console.log(req.body)
  // let clientUser = new ClientUser({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     clientUser[k] = req.body[k];
  //   }
  // }


  ClientUser.query().insert(req.body)
  .returning('*')
  .then(clientUser => {
    if(clientUser) {
      res.send({success: true, clientUser})
    } else {
      res.send({ success: false, message: "Could not save ClientUser"})
    }
  });
}

exports.bulkDisassociateFromClient = (req, res) => {
  const { clientUserIds } = req.body;

  async.map(clientUserIds, (clientUserId, callback) => {
    ClientUser.query()
      .findById(clientUserId)
      .update({ _client: "" })
      .returning('*')
      .then(clientUser => {
        if(clientUser) {
          callback(null, clientUser);
        } else {
          callback(null, null);
        }
      })
  }, (err, list) => {
    logger.info('success client bulk update');
    res.send({ success: true, data: list });
  });
}

exports.bulkUpdateStatus = (req, res) => {

  const { status, clientUserIds } = req.body;

  if (status === "deleted") {
    ClientUser.query().whereIn('_id', clientUserIds)
    .update({ status: "deleted" })
    .returning("*")
    .then(clientUsers => {
      const clientId = clientUsers && clientUsers.length && clientUsers[0] && clientUsers[0]._client;
      if (clientId) {

        Client.query().findById(clientId).then(client => {  

          if (client._primaryContact && clientUsers.some(item => item._user === client._primaryContact)) {
            Client.query().findById(clientId).update({ _primaryContact: null }).returning("*")
            .then(newClient => {
              ClientUser.query().whereIn('_id', clientUserIds)
              .delete()
              .returning("*")
              .then(result => {
                res.send({success: true, data: clientUsers, client: newClient });
              });
            });
          } else {
            ClientUser.query().whereIn('_id', clientUserIds)
            .delete()
            .returning("*")
            .then(result => {
              res.send({success: true, data: clientUsers });
            });
          }
        });
      } else {
        res.send({ success: false, message: "Client not found" });
      }
    });
  } else {
    async.map(clientUserIds, (clientUserId, callback) => {
      ClientUser.query()
        .findById(clientUserId)
        .update({ status: status })
        .returning('*')
        .then(clientUser => {
          if(clientUser) {
            callback(null, clientUser);
          } else {
            callback(null, null);
          }
        })
    }, (err, list) => {
      logger.info('success client bulk update', list);
      if (list) {
        if (status === "archived") {
          // check client object if this archived clientUsers is one of his current primary contact or primary contact is null
          Client.query()
            .findById(list[0]._client)
            // .whereIn("_primaryContact", clientUserIds)
            .then(client => {
  
              // true if client found
              if (client) {
  
                const iStrue = client._primaryContact ?
                  list.some(clientUser => clientUser._user === client._primaryContact) : true;
  
                if (iStrue) {
                  // check if the client found have other active clientUser
                  ClientUser.query()
                  .where({ _client: client._id, status: "active" })
                  .asCallback((err, otherClientUser) => {
  
                    // another active clientUser found, check if clientUser found is only one 
                    // if only one active clientUser found the set this as primary contact for this client
                    if (err) {
                      res.send({ success: true, data: list });
                    } else if (otherClientUser.length === 1) {
                      Client.query()
                        .findById(client._id)
                        .update({ _primaryContact: otherClientUser[0]._user })
                        .returning("*")
                        .then(json => {
                          res.send({success: true, data: list, client: json });
                        });
                    } else {
                      // if active clientUser empty, or found 2 or more count then set client primary contact is equal to null
                      Client.query()
                        .findById(client._id)
                        .update({ _primaryContact: null })
                        .returning("*")
                        .then(json => {
                          res.send({success: true, data: list, client: json });
                        });
                    }
                  });
                } else {
                  res.send({ success: true, data: list });
                }
              } else {
                res.send({ success: true, data: list });
              }
            })
        } else if (status === "active" && list.length === 1) {
  
          // find clients that this clientUser is his primary contact
          Client.query()
            .findById(list[0]._client)
            .where("_primaryContact", null)
            // .update({ _primaryContact: null })
            .then(client => {
  
              if (client) {
  
                // client found, check if the client found if have other one clientUser 
                ClientUser.query()
                  .where({ _client: client._id, status: "active" })
                  .asCallback((err, otherClientUser) => {
    
                    // another clientUser found, set as primary contact
                    if (err && !otherClientUser) {
                      res.send({success: true, clientUser});
                    } else if (otherClientUser.length === 1) {
                      Client.query()
                        .findById(client._id)
                        .update({ _primaryContact: otherClientUser[0]._user })
                        .returning("*")
                        .then(json => {
                          res.send({success: true, data: list, client: json});
                        });                  
                    } else {
                      res.send({success: true, data: list });
                    }
                  });
              } else {
                res.send({success: true, data: list });
              }
            })
        } else {
          res.send({ success: true, data: list });
        }
      } else {
        res.send({ success: true, data: list });
      }
    });
  }
}

exports.update = (req, res) => {
  logger.info('updating clientUser');

  const clientUserId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientUser.query()
  .findById(clientUserId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(clientUser => {

    // don't show as a primary contact from client object the archived clientUser
    if (clientUser.status === "archived" || clientUser.status === "deleted") {

      // delete clientUser
      if (clientUser.status === "deleted") {
        ClientUser.query().findById(clientUser._id).del();
      }
      
      // find clients that this clientUser is his primary contact
      Client.query()
        .findById(clientUser._client)
        .where("_primaryContact", clientUser._user)

        // .update({ _primaryContact: null })
        .then(client => {

          if (client) {

            // client found, check if the client found if have other one clientUser 
            ClientUser.query()
              .where({ _client: client._id, status: "active" })
              .asCallback((err, otherClientUser) => {
 
                // another clientUser found, set as primary contact
                if (err) {
                  res.send({success: true, clientUser});
                } else if (otherClientUser.length === 1) {
                  Client.query()
                    .findById(client._id)
                    .update({ _primaryContact: otherClientUser[0]._user })
                    .returning("*")
                    .then(json => {
                      res.send({success: true, clientUser, client: json});
                    });
                } else {
                  Client.query()
                    .findById(client._id)
                    .update({ _primaryContact: null })
                    .returning("*")
                    .then(json => {
                      res.send({success: true, clientUser, client: json});
                    });
                }
              });
          } else {
            res.send({success: true, clientUser});
          }
        })
    } else if (clientUser.status === "active") {
      // find clients that this clientUser is his primary contact
      Client.query()
        .findById(clientUser._client)
        .where("_primaryContact", null)
        // .update({ _primaryContact: null })
        .then(client => {

          if (client) {

            // client found, check if the client found if have other one clientUser 
            ClientUser.query()
              .where({ _client: client._id, status: "active" })
              .asCallback((err, otherClientUser) => {
 
                // another clientUser found, set as primary contact
                if (err && !otherClientUser) {
                  res.send({success: true, clientUser});
                } else if (otherClientUser.length === 1) {
                  let newClient = client;
                  newClient._primaryContact = otherClientUser[0]._user;
                  res.send({success: true, clientUser, client: newClient});
                } else {
                  let newClient = client;
                  newClient._primaryContact = null; // otherClientUser[0]._user;
                  res.send({success: true, clientUser, client: newClient});
                }
              });
          } else {
            res.send({success: true, clientUser});
          }
        })
    } else {
      res.send({success: true, clientUser});
    }
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting clientUser");
  
  // TODO: needs testing and updating
  const clientUserId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM clientUsers WHERE id = ' + clientUserId + ';'

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

exports.findByEmail = (req, res) => {
  console.log("client users find by email")
  /**
   * NOTES: this is intended to be used with the outlook plugin
   * using an email address (and the logged in user)
   * , find and return a matching client and client user
   * MIGHT BE MORE THAN ONE ASSOCIATED CLIENT
   * 
   * permissions will be very important here
   * 
   */

  User.query().findOne({ username: req.params.email })
  .asCallback((err, user) => {
    if(err || !user) {
      res.send({success: false, message: "Matching user not found"});
    } else {
      // is user a client? if so, does logged in user have permission?
      ClientUser.query()
      .where({_user: user._id})
      .where("status", "active")
      .asCallback((err, clientUsers) => {
        if(err || !clientUsers) {
          res.send({success: false, message: "User not associated with any Clients"})
        } else {
          let permissionClientUsers = [];

          async.each(clientUsers, (clientUser, cb) => {
            permissions.utilCheckClientPermission(req.user, clientUser._client, "access", permission => {
              if(permission) {
                permissionClientUsers.push(clientUser)
              }
              cb()
            })
          }, err => {
            if(permissionClientUsers.length == 0) {
              res.send({success: false, message: "User not associated with any Client permissions"})
            } else {
              // need to return at least the client info associated as well
              // , otherwise they won't be able to distinguish between them
              let populatedClientUsers = [];
              async.each(permissionClientUsers, (clientUser, cb) => {
                Client.query().findById(clientUser._client)
                .then(client => {
                  clientUser.client = client;
                  cb()
                })
              }, err => {
                res.send({success: true, clientUsers})
              })
            }
          })
        }
      })
    }
  })
}

exports.getListForPrintDriver = (req, res) => {
   /**
   * NOTES: not sure about the name for this function
   * this is intended to be used with the PRINT DRIVER plugin
   * from a user's login info, we should return a list of all
   * possible "places" they can upload a file to.
   * for ex, they might see:
   * [
   *    client: "flabs", clientId: 6, firmId: 2, user: "grant"
   * ]
   */
}

exports.invite = (req, res) => {
  const { firmId, invitations, personalNote } = req.body;
  logger.info('invite fired');
  permissions.utilCheckFirmPermission(req.user, firmId, 'admin', permission => {
    if(permission) {
      logger.info('user has permission, attempting invitations.')
      exports.utilInvite(invitations, personalNote, req.params.clientId, req.user, (err, data) => {
        if(err) {
          res.send({success: false, message: err});
        } else {
          res.send({success: true, data});
        }
      });
    } else {
      logger.info('user does NOT have permission.')
      res.send({success: false, message: "You do not have permisson to invite users to this client account."})
    }
  });
}

exports.bulkInviteCsv = (req, res) => {
  //TODO: This method should check permissions, parse incoming csv data and send it in a useable chunk to utilInvite.
  res.send({success: false, message: 'CSV bulk invites not implemented yet.'})
}

exports.inviteResetUser = (req, res) => {

  let { user } = req.body;
  const clientId = req.params.clientId;
  const sender = req.user;

  if (user) {

    logger.info('invite and reset password triggered');

    // check client
    Client.query().findById(parseInt(clientId))
      .asCallback((err, client) => {

        if (err || !client) {
          res.send({ success: false, message: 'Client not found' });
        } else {
          
          Firm.query().findById(parseInt(client._firm))
            .asCallback((err, firm) => {

              if (err || !firm) {
                res.send({ success: false, message: 'Firm not found' });
              } else {

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

                    exports.utilCreateAndInviteClientUser(client, user, firm, sender, note, passwordHex, true, result => {
                      logger.error('11ressss', result);
                    });
                    res.send( {success: true, user });
                  });
              }
            });
        }
      });
  }
}

exports.utilInvite = (invitations, personalNote, clientId, sender, cb) => {
  //NOTE: if this method trigger from bulkInvite the clientuser insert will proceed if one of this (email, firstname, lastname) is not empty
  logger.info("Invite clientUsers by client id", clientId);
  /**
   * NOTE:  This accepts an array of objects with the following shape: 
   *    {
   *      email: ''
   *      , fullName: '' // parsed below 
   *    }
   * 
   * Responds with an array of objects called "results" with the following shape:
   *    {
   *      email: '' // email from the request 
   *      , inviteSent: true // if successful Mandrill send
   *      , result: '' // matches Mandrill response unless there is an error along the way -- i.e. 'Could not create new user', 'Error saving clientUser', etc.
   *      , error: '' // database message 
   *    }
   */

  const setPrimaryContact = (invite, user, client, callback) => {
    if (invite && user && client && invite.primary && user._id && client._id) {
      Client.query().findById(client._id)
      .update({ _primaryContact: user._id })
      .returning('*')
      .then(client => callback(client));
    } else {
      callback(false);
    }
  } 
  
  // first things first -- find the client.
  Client.query().findById(parseInt(clientId))
  .asCallback((err, client) => {
    if(err || !client) {
      cb("Client not found", null)
    } else {
      // Next find the firm since we'll probably need the firm info for the email.
      Firm.query().findById(client._firm)
      .asCallback((err, firm) => {
        if(err || !firm) {
          cb("Firm not found", null)
        } else {
          // next fetch all existing clientUsers 
          ClientUser.query()
          .where("_client", clientId)
          .whereNot("status", "deleted")
          .whereNot("status", "clientArchived")
          .asCallback((err, existingClientUser) => {
            if(err || !existingClientUser) {
              logger.info("Problem finding existing clientUser");
              cb("Problem finding existing clientUser", null)
            } else {
              logger.info("ClientUser found, check users");
              console.log(existingClientUser);
              // next find user objects for those existingClientUser members 

              let stats = {
                existingClientUser: 0
                , existingUsers: 0 
                , errors: 0 
                , successfulInvites: 0 
              }
              
              // NOTE: Using map since we never actually throw the error.
              async.map(invitations, (nextInvite, invitationMapCb) => {

                // checking: proceed if one of the field is not empty, this proceed is for bulkInvite
                const isNotEmpty = (
                  nextInvite.email
                  || nextInvite.firstname
                  || nextInvite.lastname
                )

                if (isNotEmpty) {

                  // check if bad email                 
                  // regex checks for ____@____.__
                  nextInvite.email = nextInvite.email.toLowerCase().trim()
                  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                  const isValid = re.test(nextInvite.email);

                  if(!isValid && !nextInvite.fromBulkInvite) {
                    logger.error('bad email')
                    stats.errors++;
                    invitationMapCb(null, { email: nextInvite.email, inviteSent: false, result: "invalid email", error: null})
                  } else {
                    // email is valid check if username exists 
                    logger.debug("email valid");
                    User.query()
                    .where({username: nextInvite.email})
                    .first()
                    .asCallback((err, existingUser) => {
                      if(err) {
                        logger.error("Error detecting usernames")
                        logger.error(err);
                        stats.errors++;
                        invitationMapCb(null, { email: nextInvite.email, inviteSent: false, result: 'Database error detecting user', error: err});
                      } else if(!existingUser) {
  
                        // user with this email does not exist, create new user and send invite
                        logger.info("User does not yet exist for " + nextInvite.email + ".  Create new user");
                        let passwordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);
                        let userData = {};
                        userData.username = nextInvite.email;
                        userData.firstname = nextInvite.firstname;
                        userData.lastname = nextInvite.lastname;
                        userData.password = passwordHex;
                        userData.firstLogin = true;
                        userData.resetPasswordHex = passwordHex;
                        userData.resetPasswordTime = new Date();
                        userData.fromBulkInvite = nextInvite.fromBulkInvite;
  
                        usersController.utilCheckAndSaveUser(userData, response => {
                          if(!response.success) {
                            logger.error("Error after utilCheckandsaveuser");
                            stats.errors++;
                            invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new user', error: response.message})
                          } else {

                            stats.user = response.user;

                            // add user to client without send invitation
                            if (nextInvite.uploadOnly) {
                              let newClientUser = {
                                _user: response.user._id 
                                , _client: client._id
                                , _firm: firm._id
                                , status: 'active'
                                , accessType: response.user.firstLogin ? "noinvitesent" : ""
                              }
                              exports.addClientUser(newClientUser, result => {
                                if (result.success) {
                                  //set as primary
                                  setPrimaryContact(nextInvite, response.user, client, response => {
                                    let message = result.message || 'New contact added';
                                    if (response) {
                                      message += ' and set as primary contact.';
                                    }
                                    invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: message });
                                  })
                                } else {
                                  invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new contact.', error: response.message});
                                }
                              });
                            } else {
                              logger.info("new user created. Create new contact object");
                              exports.utilCreateAndInviteClientUser(client, response.user, firm, sender, personalNote, passwordHex, false, (result) => {
                                if(!result.success) {
                                  stats.errors++;
                                  invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new contact', error: result.message})
                                } else {
                                  stats.successfulInvites++;
                                  // set as primary
                                  setPrimaryContact(nextInvite, response.user, client, response => {
                                    let message = result.message || 'Invite sent';
                                    if (response) {
                                      message += ' and set as primary contact.';
                                    }
                                    invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: message});
                                  });
                                  // add user so we can use it to set _primaryContact when creating and inviting clients.
                                  //invitationMapCb(null, {email: nextInvite.email, inviteSent: true, result: 'Invitation sent!', error: null, user: response.user, address: null, number: resNumber.number})
                                }
                              }); 
                            }
                          }
                        });
                      } else {
                        // user with this username exists, let's see if they're already a existingClientUser member 
                        logger.info("Detected existing username")
                        console.log(existingUser)
                        stats.user = existingUser;
                        stats.existingUsers++;
                        async.detect(existingClientUser, (clientUser, detectClientUserCb2) => {
                          // check to see if user is an existing clientUser 
                          console.log("detectClientUserCb2", clientUser, existingClientUser)

                          detectClientUserCb2(null, clientUser._user == existingUser._id) // exits on true 
                        }, (err3, detectedClientUser) => {
                          logger.error("detecting", detectedClientUser)
                          if(err3) {
                            logger.error("error detecting contact");
                            stats.errors++;
                            invitationMapCb(null, { email: nextInvite.email, inviteSent: false, result: 'Database error detecting clientUser', error: err3})
                          } else if(detectedClientUser) {

                            stats.existingClientUser++;
                            let resultText = detectedClientUser.status === "archived" ? "Contact already exists but archived." : "Contact already exists in Client itself."
                            // invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: resultText, error: null, user: existingUser});

                            // clientUser exists, do nothing
                            // logger.info("contact already exists, do nothing");

                            if (nextInvite.uploadOnly) {
                              setPrimaryContact(nextInvite, existingUser, client, response => {
                                let message = 'Contact user already exists in Client itself.';
                                if (response) {
                                  message += ' and set as primary contact.';
                                }
                                invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: message, error: null, user: existingUser});  
                              });
                            } else {

                              // update reset passwordTime 
                              existingUser.resetPasswordTime = new Date();
                              User.query()
                                .findById(existingUser._id)
                                .update(existingUser)
                                .returning("*")
                                .then(json => {

                                  // set custom url, if applicable
                                  let firmUrl = appUrl;
                                  if(firm && firm.domain) {
                                    firmUrl = firm.domain;
                                  }
                                  const passwordHex = json.resetPasswordHex;
                                  const personalNote = {
                                    url: `http://${firmUrl}/user/reset-password/${passwordHex}` 
                                  }

                                  existingUser._clientUser = detectedClientUser._id;
                                  exports.utilCreateAndInviteClientUser(client, existingUser, firm, sender, personalNote, null, true, (result) => {
                                    if(!result.success) {
                                      stats.errors++;
                                      invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new contact user', error: result.message})
                                    } else {
                                      stats.successfulInvites++;
                                      // set as primary
                                      setPrimaryContact(nextInvite, existingUser, client, response => {
                                        let message = 'Invitation sent!';
                                        if (response) {
                                          message += ' and set as primary contact.';
                                        }
                                        invitationMapCb(null, {email: nextInvite.email, inviteSent: true, result: message, error: null, user: existingUser});
                                      });
                                    }
                                  });    
                                });
                            }
                          } else {
                            if (nextInvite.uploadOnly) {
                              let newClientUser = {
                                _user: existingUser._id 
                                , _client: client._id
                                , _firm: firm._id
                                , status: 'active'
                                , accessType: existingUser.firstLogin ? "noinvitesent" : ""
                              }
                              exports.addClientUser(newClientUser, result => {
                                if (result.success) {
                                  // set as primary
                                  setPrimaryContact(nextInvite, existingUser, client, response => {
                                    let message = nextInvite.fromBulkInvite ? 'New client created and new contact added.' : 'Existing contact added.'
                                    if (response) {
                                      message += ' and set as primary contact.';
                                    }
                                    invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: message, error: null, user: existingUser});
                                  });
                                } else {
                                  invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not add existing contact.', error: null, user: existingUser});
                                }
                              });
                            } else {
                              // user exists, but is not yet clientUser. create clientUser & send invite 
                              logger.info("user exists, but is not yet contact. create contact & send invite ")
                              exports.utilCreateAndInviteClientUser(client, existingUser, firm, sender, personalNote, null, false, (result) => {
                                if(!result.success) {
                                  stats.errors++;
                                  invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new contact', error: result.message})
                                } else {
                                  stats.successfulInvites++;
                                  // set as primary
                                  setPrimaryContact(nextInvite, existingUser, client, response => {
                                    let message = 'Invitation sent!';
                                    if (response) {
                                      message += ' and set as primary contact.';
                                    }
                                    invitationMapCb(null, {email: nextInvite.email, inviteSent: true, result: message, error: null, user: existingUser})
                                  });
                                }
                              });
                            }
                          }
                        });
                      }
                    });
                  }
                } else {
                  invitationMapCb(true, { message: 'do nothing if firstname & lastname & email are empty!' });
                }
              }, (err1, results) => {
                if(err1) {
                  logger.error(err1);
                  cb('async error - check logs', null)
                } else {
                  // all done with invites.  
                  let data = {
                    results 
                    , stats
                  }
                  cb(null, data);
                }
              });                  
            }
          });
        }
      });
    }
  });
}

exports.addAddress = (address, callback) => {
  const arrCountries = Object.values(COUNTRIES);
  
  let foundCountry = arrCountries.find(data => data && data.name && address && address.country && (data.name.toLowerCase() === address.country.toLowerCase()));
  
  if(!(foundCountry && foundCountry.code)) {
    foundCountry = arrCountries.find(data => data && data.code && address && address.country && (data.code.toLowerCase() === address.country.toLowerCase()));
  }

  if(!address.street1 || !address.city || !address.state || !address.postal || !address.country || !(foundCountry && foundCountry.code)) {
    callback({success: false, message: "Address incomplete"});
  } else {
    address.country = foundCountry.code;
    Address.query()
    .insert(address)
    .returning('*')
    .asCallback((err, address) => {
      if(err || !address) {
        callback({ success: false, message: "Could not save address" })
      } else {
        logger.info("Creating address success!")
        callback({ success: true, address })
      }
    });
  }
}

exports.addPhoneNumber = (number, callback) => {
  if(!number.number || !number.type) {
    callback({success: false, message: "Phone number incomplete"})
  } else {
    PhoneNumber.query()
    .insert(number)
    .returning('*')
    .asCallback((err, number) => {
      if(err || !number) {
        callback({ success: false, message: "Could not save phone number" })
      } else {
        logger.info("Creating phone number success!")
        callback({ success: true, number })
      }
    });
  }
}

exports.addClientUser = (newClientUser, callback) => {
  ClientUser.query().insert(newClientUser)
  .returning('*')
  .asCallback((err, clientUser) => {
    if(err || !clientUser) {
      console.log("error saving client user")
      console.log(err);
      callback({ success: false, message: "Could not save contact user"})
    } else {
      callback({ success: true, clientUser });
    }
  });
}

exports.utilCreateAndInviteClientUser = async (client, user, firm, sender, note, tempPassword, resend, callback) => {

  const resetUrl = note && typeof(note) === 'object' ? note.url ? note.url : null : null;
  note = note && typeof(note) === 'object' ? note.url ? null : note : note;

  let newClientUser = {
    _user: user._id 
    , _client: client._id
    , _firm: firm._id
    , status: 'active'
    , accessType: "invitesent"
  }

  const template = !appUrl.includes('lexshare.io') ? 'portal-client-invitation-2' : 'portal-client-lexshare-invitation-2';

  console.log('appUrl', appUrl);
  console.log('selected template', template);

  const subject = `${sender.firstname} ${sender.lastname} invited you to the client portal for ${client.name}`
  const targets = [user.username];
  const fromInfo = await firmsController.getEmailFromInfo(firm._id, sender._id);
  /*
  const fromInfo = {
    email: sender.username 
    , name: `${sender.firstname} ${sender.lastname} | ${firm.name}`
  }
  */

  // set custom url, if applicable
  let firmUrl = appUrl;

  if(firm && firm.domain) {
    firmUrl = firm.domain;
  }

  let personalNote = note ? 
    `<!--[if gte mso 9]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="100%">
      <![endif]-->
        <tbody class="mcnBoxedTextBlockOuter">
          <tr>
            <td valign="top" class="mcnBoxedTextBlockInner">          
            <!--[if gte mso 9]>
              <td align="center" valign="top" ">
            <![endif]-->
              <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width:100%;" class="mcnBoxedTextContentContainer">
                <tbody>
                  <tr>
                    <td style="padding-top:9px; padding-left:18px; padding-bottom:9px; padding-right:18px;">
                      <table border="0" cellspacing="0" class="mcnTextContentContainer" width="100%" style="min-width: 100% !important;background-color: #FFD56A;border: 2px solid #F9B915;">
                        <tbody>
                          <tr>
                            <td valign="top" class="mcnTextContent" style="padding: 18px;color: #000000;font-family: Helvetica;font-size: 14px;font-weight: normal;text-align: left;">
                              ${note}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            <!--[if gte mso 9]>
              </td>
            <![endif]-->        
            <!--[if gte mso 9]>
                </tr>
              </table>
            <![endif]-->
          </td>
        </tr>
      </tbody>`
    : 
    null 
  ;
  const addedNote = note ? `<span>${sender.firstname} added a note</span>` : null;
  let firmLogo;
  if(firm.logoUrl) {
      firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
  }

  let inviteLink;
  let passwordContent;
  let rawLink;
  if(tempPassword) {
    // if tempPassword has a value then this is a new user.
    inviteLink = `<a class="mcnButton " title="Join us in ${brandingName.title}" href="http://${firmUrl}/user/login?client=${client._id}" target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Click here to view the portal</a>`
    passwordContent = `<span>Your temporary password is: <strong>${tempPassword}</strong></span>`
    if (resetUrl) {
      passwordContent += `<br/>`;
      passwordContent += `<span>Reset password: <a href="${resetUrl}">${resetUrl}</a></span>`;
    }    
    rawLink = `<a href="http://${firmUrl}/user/login?client=${client._id}" target="_blank">http://${firmUrl}/user/login?client=${client._id}</a>`
  } else {
    // This is an existing user.
    inviteLink = `<a class="mcnButton " title="Join us in ${brandingName.title}" href="http://${firmUrl}/portal/${client._id}/dashboard" target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Click here to view the portal</a>`
    passwordContent = `<span>You can log in with your existing ${brandingName.title} account.</span>`;

    if (resetUrl) {
      passwordContent += `<br/>`;
      passwordContent += `<span>Reset password: <a href="${resetUrl}">${resetUrl}</a></span>`;
    }
    rawLink = `<a href="http://${firmUrl}/portal/${client._id}/dashboard" target="_blank">http://${firmUrl}/portal/${client._id}/dashboard</a>`
  }
  const content = [
    { name: 'senderFullName' , content: sender.firstname + " " + sender.lastname + " " }
    , { name: 'senderEmail' , content: sender.username }
    , { name: 'inviteLink', content: inviteLink }
    , { name: 'personalNote', content: personalNote }
    , { name: 'addedNote', content: addedNote }
    , { name: 'clientName', content: client.name }
    , { name: 'password', content: passwordContent }
    , { name: 'rawLink', content: rawLink }
    , { name: 'firmLogo', content: firmLogo }
  ]

  let html = `<h1> ${sender.firstname} ${sender.lastname.replace(' ', '')} has shared client portal access to the ${client.name} account with you.</h1>`;
  if(note) {
    html += `<p>${sender.firstname} added a note:</p>`;
    html += `<p><b>${note}</b></p>`;
  }
  html += `<p>To view, click <a href="http://${firmUrl}">here</a>.</p>`;
  html += '<br>'
  html += `<p>${brandingName.title}’s Client Portal software makes it easy for accountants and their clients to securely send, receive, and organize their business files online.</p>`;


  let text = ` ${sender.firstname} ${sender.lastname.replace(' ', '')} has shared client portal access to the ${client.name} account with you.`;
  if(note) {
    text += `${sender.firstname} added a note:`;
    text += `${note}`;
  }
  text += `To view, click here: http://${firmUrl}.`;
  text += `${brandingName.title}’s Client Portal software makes it easy for accountants and their clients to securely send, receive, and organize their business files online.`;

  if(!resend) {
    ClientUser.query().insert(newClientUser)
    .returning('*')
    .asCallback((err, clientUser) => {
      if(err || !clientUser) {
        console.log("error saving client user")
        console.log(err);
        callback({ success: false, message: "Could not save contact user"})
      } else {
        logger.error('new contact', clientUser);
        emailUtil.sendEmailTemplate(targets, subject, template, content, html, text, fromInfo, data => {
          callback(data);
        });
      }
    });
  } else {
    if (user && user._clientUser) {
      ClientUser.query().findById(user._clientUser).update({ accessType: "invitesent" })
      .returning('*')
      .asCallback((err, clientUser) => {
        if(err || !clientUser) {
          console.log("error saving client user")
          console.log(err);
          callback({ success: false, message: "Could not save contact user"})
        } else {
          logger.error('new contact', clientUser);
          emailUtil.sendEmailTemplate(targets, subject, template, content, html, text, fromInfo, data => {
            callback(data);
          });
        }
      });
    } else {
      emailUtil.sendEmailTemplate(targets, subject, template, content, html, text, fromInfo, data => {
        callback(data);
      });
    }
  }
}


exports.getLoggedInByClient = (req, res) => {
  exports.utilGetLoggedInByClient(req.user._id, req.params.clientId, result => {
    res.send(result)
  })
}

exports.utilGetLoggedInByClient = (userId, clientId, callback) => {
  logger.info('Fetching logged in clientUser');
  ClientUser.query()
  .where({
    _user: parseInt(userId), _client: parseInt(clientId)
  })
  .whereNot("status", "deleted")
  .first()
  .asCallback((err, clientUser) => {
    if(err || !clientUser) {
      logger.error('ERROR: ClientUser not found');
      logger.info(err);
      callback({success: false, message: 'Client User not found'});
    } else {
      logger.info('Logged in client user found', clientUser);
      callback({success: true, clientUser});
    }
  })
}

exports.uploadNotification = (type, sender, file) => {
  
  const { _client, _firm } = file;

  if (sender && _client && _firm) {
    Firm.query().findById(parseInt(_firm))
      .asCallback((err, firm) => {

        if (err && !firm) {
          logger.error('FIRM not found');
        } else {

          Client.query().findById(_client)
          .then(client => {

            if (!client) {
              logger.error('CLIENT not found');
            } else {

              // get clientUser list 
              ClientUser.query()
                .where({ _client: _client, status: "active" })
                .asCallback((err, clientUsers) => {
                  if(err) {
                    cb(err, null)
                  } else {
                    // check clientUser username
                    async.map(clientUsers, (nextUser, callBack) => {
                      User.query()
                        .select('username')
                        .where({ _id: nextUser._user, sendNotifEmails: true })
                        .first()
                        .asCallback((err, user) => {

                          if (user) {
                            let username = user.username;

                            // check if bad email
                            username = username.toLowerCase().trim();
                            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            const isValid = re.test(username);
      
                            // NOTE: since we never actually throw the error. 
                            // only valid email will proceed to the process
                            callBack(null, isValid ? username : null);
                          } else {
                            callBack(null, null);
                          }
                      });
                    }, (err1, clientUserList) => {
                      clientUserList = clientUserList.filter(user => user && user !== sender.username);

                      // notification default details: default details is type = new upload
                      let notification = {
                        sender: sender
                        , link: `/portal/${_client}/files/${file._id}`
                        , content: `${sender.firstname} ${sender.lastname} uploaded a file`
                        , subject: `${sender.firstname} ${sender.lastname} uploaded a file`
                        , name: `${sender.firstname} ${sender.lastname} | ${firm && firm.name}`
                        , userlist: clientUserList
                        , firm: firm
                      }
                      
                      notification.subject += ` | ${client.name}`;
                      if (type === 'new comment') {
                        notification.content = `${sender.firstname} ${sender.lastname} started chatting in ${file.filename}`;
                        notification.subject = `${sender.firstname} ${sender.lastname} started chatting in ${file.filename}`;
                        notification.name = null;
                      }

                      notificationsCtrl.utilNotification(notification, cb => {

                        // if type == "new comment" then notify staffClient if the sender is a clientUser
                        if (cb.success && type === 'new comment' && file.isClientUser) {
                          
                          StaffClient.query()
                            .where({ _client: _client, sendNotifs: true })
                            .asCallback((err, staffClient) => {
                              
                              if (!err && staffClient) {
                                async.map(staffClient, (nextUser, callBack) => {
                        
                                  User.query().findById(nextUser._user)
                                  .asCallback((err, user) => {
                        
                                    if (user) {
                                      let username = user.username;
              
                                      // check if bad email
                                      username = username.toLowerCase().trim();
                                      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                      const isValid = re.test(username);
                
                                      // NOTE: since we never actually throw the error. 
                                      // only valid email will proceed to the process
                                      callBack(null, isValid ? username : null);
                                    } else {
                                      callBack(null, null);
                                    }                                
                                  });
                                }, (err, staffClientList) => {
                                  staffClientList = staffClientList.filter(user => user && user !== sender.username);
                                  
                                  // change details for staffclient
                                  notification.link = `/firm/${_firm}/workspaces/${_client}/files/${file._id}`;
                                  notification.userlist = staffClientList;

                                  notificationsCtrl.utilNotification(notification, callback => {
                                    if (callback) {
                                      logger.info(callback);
                                    }
                                  });
                                });          
                              }
                            });
                        }                    
                      });
                    });
                  }
                });
            }
          });
        }
      });
  }
}

exports.updateClientUserStatus = (req, res) => {
  logger.info('updating clientUser');

  const clientUserId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientUser.query()
  .findById(clientUserId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(clientUser => {

    // archived process
    if (clientUser.status === "archived" || clientUser.status === "deleted") {

      // check client object if this archived clientUser is his current primary contact
      Client.query()
        .findById(clientUser._client)
        // .where("_primaryContact", clientUser._user)
        .then(client => {

          // true if client found
          if (client) {
            if (client._primaryContact === clientUser._user || !client._primaryContact) {
                // check if the client found, have other active clientUser 
                ClientUser.query()
                .where({ _client: client._id, status: "active" })
                .asCallback((err, otherClientUser) => {

                  // another active clientUser found, check if clientUser found is only one 
                  // if only one active clientUser found the set this as primary contact for this client
                  if (err) {
                    res.send({success: true, clientUser});
                  } else if (otherClientUser.length === 1) {
                    Client.query()
                      .findById(client._id)
                      .update({ _primaryContact: otherClientUser[0]._user })
                      .returning("*")
                      .then(json => {
                        res.send({success: true, clientUser, client: json});
                      });
                  } else {
                    // if active clientUser empty, or found 2 or more count then set client primary contact is equal to null
                    Client.query()
                      .findById(client._id)
                      .update({ _primaryContact: null })
                      .returning("*")
                      .then(json => {
                        res.send({success: true, clientUser, client: json });
                      });
                  }
                });              
            } else {
              res.send({success: true, clientUser});
            }
          } else {
            res.send({success: true, clientUser});
          }
        })
    } else if (clientUser.status === "active") {

      // find clients that for this clientUser with primary contact is equal to null
      Client.query()
        .findById(clientUser._client)
        .where("_primaryContact", null)
        // .update({ _primaryContact: null })
        .then(client => {

          if (client) {

            // client found, check if the client have only one active clientUser 
            ClientUser.query()
              .where({ _client: client._id, status: "active" })
              .asCallback((err, otherClientUser) => {
 
                // if active clientUser is only one set to client as primary contact
                if (err && !otherClientUser) {
                  res.send({success: true, clientUser});
                } else if (otherClientUser.length === 1) {
                  Client.query()
                    .findById(client._id)
                    .update({ _primaryContact: otherClientUser[0]._user })
                    .returning("*")
                    .then(json => {
                      res.send({success: true, clientUser, client: json});
                    });                  
                } else {
                  res.send({success: true, clientUser});
                }
              });
          } else {
            res.send({success: true, clientUser});
          }
        })
    } else {
      res.send({success: true, clientUser});
    }
  })
}

exports.resendInvite = (req, res) => {

  const { clientId, firmId, invitations } = req.body;

  logger.info('invite fired');
  permissions.utilCheckFirmPermission(req.user, firmId, 'admin', permission => {
    if(permission) {
      logger.info('user has permission, attempting invitations.')
      
      Firm.query().findById(firmId).then(firm => {
        if (clientId) {

          Client.query().findById(clientId).then(client => {
            async.map(invitations, (user, callback) => {
              console.log("user:", user)
              if (user && user.firstLogin) {

                ClientUser.query().findById(user._clientUser).where({ status: "active" }).update({ accessType: "invitesent" })
                  .returning("*").asCallback((err, clientUser) => {
                    if (!err && clientUser) {
                      delete user._clientUser;
                      usersController.inviteResetPassword(req, user, client, firm, response => {
                        console.log("invite reset password:", response);
                        callback(null, user);
                      });
                    } else {
                      callback();
                    }
                  });
              } else {
                exports.utilCreateAndInviteClientUser(client, user, firm, req.user, '', null, true, response => {
                  console.log("resend invite:", response);
                  callback(null, user);
                })
              }
            }, (err, result) => {
              res.send({ success: true, result });
            });
          });
        } else {
          const sender = req.user;

          // (logic from firmsController check domain)
          let domain = req.hostname; // doesnt include port
                      
          // usually, we want to ignore the port. but for dev we need to keep it for the checks, sinces its nonstandard
          const fullhost = req.headers.host; // includes port
          if(fullhost.includes('localhost') || fullhost.includes('127.0.0.1')) {
            domain = fullhost;
          }

          async.map(invitations, (user, callback) => {
            if (user) {
              ClientUser.query().where({ _firm: firmId, _user: user._id, status: "active" }).update({ accessType: "invitesent" })
              .returning("*").asCallback((err, clientUsers) => {

                if (!err && clientUsers && clientUsers.length) {
                  const clientIds = clientUsers.map(item => item._client);

                  Client.query().whereIn("_id", clientIds).where({ status: "visible" }).then(clients => {
                    if (clients && clients.length) {
                      if (user.firstLogin) {
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
                      
                          let note = {
                            url: `http://${domain}/user/reset-password/${user.resetPasswordHex}`
                          }
                          
                          clients.map(client => {
                            exports.utilCreateAndInviteClientUser(client, user, firm, sender, note, passwordHex, true, response => {
                              console.log("response: ", response);
                              console.log("resend invite:", client);
                            });
                            return client;
                          });

                          callback(null, user);
                        });
                      } else {
                        clients.map(client => {
                          exports.utilCreateAndInviteClientUser(client, user, firm, req.user, '', null, true, response => {
                            console.log("response: ", response);
                            console.log("resend invite:", client);
                          })
                          return client;
                        });
                        callback(null, user);
                      }
                    } else {
                      callback(null, user);
                    }
                  });
                } else {
                  callback(null, user);
                }
              });
            } else {
              callback(null, user);
            }
          }, (err, result) => {
            res.send({ success: true, result });
          });
        }
      });
    } else {
      logger.info('user does NOT have permission.')
      res.send({success: false, message: "You do not have permisson to invite users to this client account."})
    }
  });
}