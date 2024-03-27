/**
 * Sever-side controllers for Staff.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Staff
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const Staff = require('./StaffModel');
const StaffClient = require('../staffClient/StaffClientModel');
const Firm = require('../firm/FirmModel');
const User = require('../user/UserModel');
const usersController = require('../user/usersController');
const firmsController = require('../firm/firmsController');
const emailUtil = require('../../global/utils/email');

const helpers = require('../../global/utils/helpers');

const config = require('../../config')[process.env.NODE_ENV];
const secrets = config.secrets[process.env.NODE_ENV];

const async = require('async');
const permissions = require('../../global/utils/permissions')
const assureSign = require('../../global/utils/assureSign')
const logger = global.logger;
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const { raw } = require('objection');

const safeUserFields = [
  '_id', 'username', 'firstname', 'lastname'
  , '_primaryAddress', '_primaryPhone', 'onBoarded', 'admin'
]

exports.list = (req, res) => {
  Staff.query()
  .asCallback((err, staff) => {
    if(err || !staff) {
      res.send({success: false, message: "Error retrieving Staff list"})
    } else {
      res.send({success: true, staff})
    }
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of staff queried from the array of _id's passed in the query param
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
    // Staff.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, staff) => {
    //     if(err || !staff) {
    //       res.send({success: false, message: `Error querying for staff by ${["_" + req.params.refKey]} list`, err});
    //     } else if(staff.length == 0) {
    //       Staff.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, staff) => {
    //         if(err || !staff) {
    //           res.send({success: false, message: `Error querying for staff by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, staff});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, staff});
    //     }
    // })
    Staff.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, staff) => {
        if(err || !staff) {
          res.send({success: false, message: `Error querying for staff by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, staff});
        }
    })
  }
}

exports.getLoggedInByFirm = (req, res) => {
  exports.utilGetLoggedInByFirm(req.user._id, req.params.firmId, result => {
    res.send(result)
  })
}

exports.getFirstStaffByFirm = (firmId, callback) => {
  Staff.query()
    .where({
      _firm: parseInt(firmId),
      status: 'active'
    })
    .first()
    .asCallback((err, staff) => {
      if(err || !staff) {
        logger.error('ERROR: Staff not found')
        logger.info(!!err ? err : '');
        callback({success: false, message: "Staff not found"})
      } else {
        logger.info('Logged in staff found.', staff)
        callback({success: true, staff})
      }
    })
}

// Made this a util since we now need to fetch the staff for every assuresign related action.
exports.utilGetLoggedInByFirm = (userId, firmId, callback) => {
  logger.info('Fetching logged in staff')
  Staff.query()
  .where({
    _user: parseInt(userId), _firm: parseInt(firmId)
  })
  .first()
  .then((staff) => {
    if(!staff) {
      logger.error('ERROR: Staff not found')
      callback({success: false, message: "Staff not found"})
    } else {
      logger.info('Logged in staff found.', staff)
      User.query()
        .findById(userId)
        .then(user => {
          callback({success: true, staff, user});
        })
    }
  })
  .catch(err => {
    callback({success: false, message: err.message});
  })
}

// Made this a util since we now need to fetch the staff for every assuresign related action.
exports.utilGetFirmIdOfLoggedInUser = (userId, callback) => {
  logger.info('Fetching firm id of the logged in staff');
  Staff.query()
  .where({
    _user: userId
  })
  .first()
  .asCallback((err, staff) => {
    if(err || !staff) {
      logger.error('ERROR: Staff not found');
      logger.info(err);
      callback({success: false, message: "Staff not found"});
    } else {
      logger.info('Logged in staff found.', staff);
      callback({success: true, firmId:staff._firm});
    }
  })
}

exports.utilGetByFirmId = (firmId, cb) => {
  if(firmId) {
    Staff.query()
    .where({
      _firm: parseInt(firmId)
    })
    .asCallback((err, staffs) => {
      if(err || !staffs) {
        logger.error('ERROR: Staff not found')
        logger.info(err)
        cb(err, null)
      } else {
        logger.info('Logged in staffs found.', staffs)
        cb(err, staffs)
      }
    })
  } else {
    cb('ERROR: No firm id specified.', null)
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

    Staff.query().from('staff as s')
    .innerJoin('firms as f', 'f._id', 's._firm')
    .leftJoin('subscriptions as sb', 'sb._firm', 'f._id')
    .whereNot({ 'sb.status': 'canceled' })
    .where(builder => {
      Object.keys(query).map(item => {
        if (item && query[item]) {
          builder.where(`s.${item}`, query[item]);
        }
      })
    })
    .select('s.*')
    .groupBy(['f._id', 's._id', 'sb._id'])
    .orderBy('f.name')
    .asCallback((err, staff) => {
      if(err || !staff) {
        res.send({success: false, message: "Error retrieving Staff list"})
      } else {
        staff = helpers.getUniqueArray(staff);
        res.send({success: true, staff})
      }
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
    Staff.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, staff) => {
      if(err || !staff) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , staff: staff
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Staff.find(mongoQuery).exec((err, staff) => {
      if(err || !staff) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, staff: staff });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get staff by id');
  Staff.query().findById(req.params.id)
  .asCallback((err, staff) => {
    if(err || !staff) {
      res.send({success: false, message: "Staff not found"})
    } else {
      res.send({success: true, staff})
    }
  })
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get staff schema ');
  res.send({success: true, schema: Staff.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get staff default object');
  res.send({success: true, defaultObj: Staff.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new staff');
  console.log(req.body)
  // let staff = new Staff({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     staff[k] = req.body[k];
  //   }
  // }


  Staff.query().insert(req.body)
  .returning('*')
  .asCallback((err, staff) => {
    if(err || !staff) {
      res.send({success: false, message: "Could not save Staff"})
    } else {
      res.send({success: true, staff})
    }
  })
}

exports.update = (req, res) => {
  logger.info('updating staff');

  const staffId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Staff.query()
  .findById(staffId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .asCallback((err, staff) => {
    if(err || !staff) {
      logger.error("ERROR: ")
      logger.info(err)
      res.send({success: false, message: "Could not save Staff"})
    } else {
      logger.info("Staff successfully updated", staff)
      res.send({success: true, staff})
    }
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting staff");
  
  // TODO: needs testing and updating

  /**
   * NOTE: By default Postgres will not allow us to delete staff
   * while there is a staffClient with a reference to it, it will
   * just throw an error. It can be done, but requires deleting
   * the staffClient(s) first. We'll have to define DELETE CASCADE
   * on the staffClient schema.
   * More here: https://knexjs.org/#Schema-foreign
   */

  const staffId = parseInt(req.params.id);
  Staff.query().findById(staffId)
  .then(staff => {
    if (!staff) {
      res.send({success: false, message: "Staff not found."});
    } else {
      permissions.utilCheckisStaffOwner(req.user, staff._firm, permission => {
        if(!permission) {
          logger.info('User does not have permission.')
          res.send({success: false, message: "You do not have permission to perform this action."})
        } else {
          StaffClient.query()
          .where('_staff', staffId)
          .delete()
          .asCallback((err, staffClient) => {
            if (err) {
              res.send({ success: false, message: err });
            } else {
              Staff.query()
              .findById(staffId)
              .delete()
              .asCallback((err, staff) => {
                if (err) {
                  res.send({ success: false, message: err })
                } else {
                  res.send({ success: true, message: 'Staff deleted successfully' })
                }
              })
            }
          });
        }
      });
    }
  });

  // let query = 'DELETE FROM staff WHERE id = ' + staffId + ';'

  // console.log(query);
  // db.query(query, (err, result) => {
  //   if(err) {
  //     console.log("ERROR")
  //     console.log(err);
  //     res.send({success: false, message: err});
  //   } else {
  //     res.send({success: true})
  //   }
  // })
}

exports.invite = (req, res) => {
  logger.info("Invite staff members by firm id", req.params.firmId);
  /**
   * NOTE:  This accepts an array of objects with the following shape: 
   *    {
   *      email: ''
   *      , fullName: '' // parsed below 
   *      , owner: false 
   *    }
   * 
   * Responds with an array of objects called "results" with the following shape:
   *    {
   *      email: '' // email from the request 
   *      , inviteSent: true // if successful Mandrill send
   *      , result: '' // matches Mandrill response unless there is an error along the way -- i.e. 'Could not create new user', 'Error saving staff', etc.
   *      , error: '' // database message 
   *    }
   */
  
  console.log(req.body);
  // TODO: add permissions check 

  // first things first -- find the firm 
  Firm.query().findById(req.params.firmId)
  .then(firm => {
    if(!firm) {
      res.send({success: false, message: "Firm not found"})
    } else {
      // next fetch all existing staff members 
      Staff.query()
      .where({
        _firm: req.params.firmId
      })
      .then(existingStaff => {
        if(!existingStaff) {
          logger.info("Problem finding existing staff");
          res.send({success: false, message: "Problem finding existingStaff"})
        } else {
          logger.info("Staff found, check users");
          console.log(existingStaff);
          // next find user objects for those existingStaff members 

          let stats = {
            existingStaff: 0
            , existingUsers: 0 
            , errors: 0 
            , successfulInvites: 0 
          }
          // NOTE:  async.reflect continues to iterate over the collection even if error is thrown -- https://github.com/caolan/async/issues/1110
          // async.each(req.body.invitations, async.reflect((nextInvite, invitationMapCb) => {
          
          // NOTE: Using map instead since we never actually throw the error.  
          async.map(req.body.invitations, (nextInvite, invitationMapCb) => {
            // check if bad email 
            logger.info("invite nextInvite");
            console.log(nextInvite);
            logger.debug('validate email')
            nextInvite.email = nextInvite.email.toLowerCase().trim()
            // regex checks for ____@____.__
            const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            const isValid = re.test(nextInvite.email);
            
            if(!isValid) {
              logger.error('bad email')
              stats.errors++;
              invitationMapCb(null, { email: nextInvite.email, inviteSent: false, result: "invalid email", error: null})
            } else {
              // email is valid check if username exists 
              logger.debug("email valid");
              User.query()
              .where({username: nextInvite.email})
              .first()
              .then(existingUser => {
                if(!existingUser) {
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
                  usersController.utilCheckAndSaveUser(userData, response => {
                    // logger.info("utilCheckAndSaveUser callback reponse");
                    // console.log(response);
                    if(!response.success) {
                      logger.error("Error after utilCheckandsaveuser");
                      stats.errors++;
                      invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new user', error: response.message})
                    } else {
                      logger.info("new user created. Create new Staff object");
                      exports.utilCreateAndInviteStaffMember(firm, response.user, nextInvite.owner, req.user, req.body.personalNote, passwordHex, false, (result) => {
                        // logger.debug("utilCreateAndInviteStaffMember callback hit")
                        // console.log(result);
                        if(!result.success) {
                          stats.errors++;
                          invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new staff member', error: result.message})
                        } else {
                          stats.successfulInvites++;
                          invitationMapCb(null, {email: nextInvite.email, inviteSent: true, result: 'Invitation sent!', error: null})
                        }
                      })
                    }
                  })
                } else {
                  // user with this username exits, let's see if they're already a existingStaff member 
                  logger.info("Detected existing username")
                  console.log(existingUser)
                  stats.existingUsers++;
                  async.detect(existingStaff, (staff, detectStaffCb2) => {
                    // check to see if user is an existing staff member 
                    detectStaffCb2(null, staff._user == existingUser._id) // exits on true 
                  }, (err3, detectedStaff) => {
                    if(err3) {
                      logger.error("error detecting staff members");
                      stats.errors++;
                      invitationMapCb(null, { email: nextInvite.email, inviteSent: false, result: 'Database error detecting staff', error: err3})
                    } else if(detectedStaff) {
                      // staff member exists, do nothing
                      logger.info("staff member already exists, do nothing");
                      stats.existingStaff++;
                      // invitationMapCb(null, {  email: nextInvite.email, inviteSent: false, result: `Staff member already exists with status of ${detectedStaff.status}`, error: null })
                      exports.utilCreateAndInviteStaffMember(firm, existingUser, nextInvite.owner, req.user, req.body.personalNote, null, true, (result) => {
                        if(!result.success) {
                          invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not sent the invite', error: result.message})
                        } else {
                          invitationMapCb(null, {email: nextInvite.email, inviteSent: true, result: 'Invitation sent!', error: null})
                        }
                      })
                    } else {
                      // user exists, but is not yet staff. create staff & send invite 
                      logger.info("user exists, but is not yet staff. create staff & send invite ")
                      exports.utilCreateAndInviteStaffMember(firm, existingUser, nextInvite.owner, req.user, req.body.personalNote, null, false, (result) => {
                        // logger.debug("utilCreateAndInviteStaffMember callback hit")
                        // console.log(result);
                        if(!result.success) {
                          stats.errors++;
                          invitationMapCb(null, {email: nextInvite.email, inviteSent: false, result: 'Could not create new staff member', error: result.message})
                        } else {
                          stats.successfulInvites++;
                          invitationMapCb(null, {email: nextInvite.email, inviteSent: true, result: 'Invitation sent!', error: null})
                        }
                      })
                    }
                  })
                }
              })
              .catch(err => {
                logger.error("Error detecting usernames")
                logger.error(err);
                stats.errors++;
                invitationMapCb(null, { email: nextInvite.email, inviteSent: false, result: 'Database error detecting user', error: err})
              })
            }
          }, (err1, results) => {
            if(err1) {
              logger.error(err1);
              res.send({success: false, nextInvite, message: 'async error - check logs'})
            } else {
              // all done with invites.  
              let data = {
                results 
                , stats
              }
              res.send({success: true, data});
            }
          })
        }
      })
      // .catch(err => {
      //   logger.error("Error finding existing staff members");
      //   res.send({success: false, message: err });
      // })
    }
  })
  .catch(err => {
    logger.error("Error finding Firm");
    res.send({success: false, message: err });
  });
}

exports.inviteResetUser = (req, res) => {
  logger.info("Invite staff members with reset password", req.params.firmId);

  let { user } = req.body;
  const firmId = req.params.firmId;
  const sender = req.user;

  if (user) {
    Firm.query().findById(parseInt(firmId))
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

            exports.utilCreateAndInviteStaffMember(firm, user, user.owner, sender, note, passwordHex, true, result => {
              logger.error('11ressss', result);
            });
            res.send( {success: true, user });
          });
      }
    });
  } 
}

exports.utilCreateAndInviteStaffMember = async (firm, user, isOwner = false, sender, note, tempPassword, resend, callback) => {
  logger.info("utilCreateAndInviteStaffMember fired");

  let brandingName = appUrl.includes('lexshare.io') ? 'LexShare' : 'ImagineTime'

  const resetUrl = typeof(note) === 'object' ? note.url ? note.url : null : null;
  note = typeof(note) === 'object' ? note.url ? null : note : note;

  // Initialize first the email template
  const template =  !appUrl.includes('lexshare.io') ? 'portal-staff-invitation' : 'portal-staff-lexshare-invitation';
  const subject = `${sender.firstname} ${sender.lastname} invited you to ${brandingName} (${firm.name})`
  const targets = [user.username];
  const fromInfo = await firmsController.getEmailFromInfo(firm._id, sender._id);

  // set custom url, if applicable
  let firmUrl = appUrl;

  if(firm && firm.domain) {
    firmUrl = firm.domain;
  }


  let personalNote = note ? 
    `<table border="0" cellpadding="0" cellspacing="0" width="100%" class="mcnBoxedTextBlock" style="min-width:100%;">
      <!--[if gte mso 9]>
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
      </tbody>
    </table>`
    : 
    null 
  ;
  const addedNote = note ? `${sender.firstname} added a note` : null;
  const inviteLink = `<a class="mcnButton " title="Join us in ${brandingName}" href="http://${firmUrl}/user/login?firm=${firm._id}" target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">Join us in ${brandingName}</a>`
  let password = '';

  if (resetUrl) {

    // if tempPassword has a value then this is a new user.
    password = `<span>Your temporary password is: <strong>${tempPassword}</strong></span>`;
    password += `<br/>`;
    password += `<span>Reset password: <a href="${resetUrl}">${resetUrl}</a><br/><br/></span>`;
  } else {
    password = tempPassword ? `<span mc:edit="password">Your temporary password is: <b>${tempPassword}</b><br/><br/></span>` : null;
  }   

  const content = [
    { name: 'senderFirstName' , content: sender.firstname }
    , { name: 'senderLastName' , content: sender.lastname }
    , { name: 'senderEmail' , content: sender.username }
    , { name: 'inviteLink', content: inviteLink }
    , { name: 'personalNote', content: personalNote }
    , { name: 'addedNote', content: addedNote }
    , { name: 'firmName', content: firm.name }
    , { name: 'password', content: password }
  ]

  let html = `<h1> ${sender.firstname} invited you to join ${firm.name} on ${brandingName}!</h1>`;
  if(note) {
    html += `<p>${sender.firstname} added a note:</p>`;
    html += `<p><b>${note}</b></p>`;
  }
  html += `<p>${brandingName} empowers teams to manage work, share tasks, track time & due dates, and generate insightful reports.</p>`;
  html += `<p>It's really straightforward and easy to use! To join ${sender.firstname}, click <a href="http://${firmUrl}">here</a>.</p>`;


  let text = ` ${sender.firstname} invited you to join ${firm.name} on ImagineTime!`;
  if(note) {
    text += `${sender.firstname} added a note:`;
    text += `${note}`;
  }
  text += `${brandingName} empowers teams to manage work, share tasks, track time & due dates, and generate insightful reports.`;
  text += `It's really straightforward and easy to use! To join ${sender.firstname}, click here: http://${firmUrl}.`;

  // Check if it is a resend or a new invite
  if(!resend) {
    let newStaff = {
      _user: user._id 
      , _firm: firm._id
      , status: 'active'
      , owner: isOwner
    }
    Staff.query().insert(newStaff)
    .returning('*')
    .then(staff => {
      if(!staff) {
        callback({ success: false, message: "Could not save Staff"})
      } else {
   
        emailUtil.sendEmailTemplate(targets, subject, template, content, html, text, fromInfo, data => {
          callback(data);
        })
      }
    })
    .catch(err => {
      callback({ success: false, message: err})
    });
  } else {
    emailUtil.sendEmailTemplate(targets, subject, template, content, html, text, fromInfo, data => {
      callback(data);
    })
  }

}

exports.createApiUser = (req, res) => {
  /**
   * NOTE: We've found out from AssureSign that only admin level users on the parent level account are
   * allowed to create api users via the api. This means that we'll need to use some admin account credentials
   * instead of the loggedInStaff account credentials for this specific set of calls.
   * 
   * This will mean that, according to AssureSign, all api users will be created by the same account. We'll save
   * a reference of the logged in user's id on staff._eSigGrantedBy.
   * id.
   */
  logger.info('Begin create api user.')
  const staffId = parseInt(req.params.id)

  const eSigEmail = req.body.eSigEmail;

  const { reAddUser } = req.body;

  console.log('eSigEmail', eSigEmail);

  Staff.query().findById(staffId)
  .asCallback((err, staff) => {
    if(err || !staff) {
      res.send({success: false, message: "Staff not found"})
    } else {

      const originalStaff = {...staff};

      if(staff.eSigEmail != eSigEmail) {
        staff.apiUsername = '';
        staff.apiKey = '';
      }

      if(!!reAddUser) {
        staff.apiUsername = '';
        staff.apiKey = '';
        staff.contextUsername = '';
      }

      // make sure this user doesn't already have api credentials. If they do stop here.
      if(staff.apiUsername && staff.apiKey) {
        res.send({success: false, message: "This user already has e-signature credentials", staff: originalStaff})
      } else {
        logger.info('checking permission')
        // check permissons. Only a firm owner should be able to grant e-signature credentials.
        permissions.utilCheckFirmPermission(req.user, staff._firm, 'admin', permission => {
          if(!permission) {
            logger.info('User does not have permission.')
            res.send({success: false, message: "You do not have permission to perform this action."})
          } else {
            logger.info('user has permission. Attempting to create api user.')
            // Now fetch the user and firm using the staff object.
            User.query().findById(staff._user)
            .asCallback((err, user) => {
              if(err || !user) {
                logger.error('ERROR: Could not find user.')
                logger.info(err)
                res.send({success: false, message: 'Could not find user', staff: originalStaff})
              } else {
                // have the user object. Now fetch the firm.
                Firm.query().findById(staff._firm)
                .asCallback((err, firm) => {
                  if(err || !firm) {
                    logger.error('ERROR: Could not find firm.')
                    logger.info(err)
                    res.send({success: false, message: 'Could not find firm.', staff: originalStaff})
                  } else if(!firm.eSigAccess) {
                    res.send({success: false, message: 'Your firm does not have e-signature access.', staff: originalStaff})
                  } else {
                    // have the user and firm objects.
                    // first get the auth token using the admin credentials in the secrets file.
                    assureSign.getAuthToken(firm, secrets.assureSignAdmin, result => {
                      if(!result.success) {
                        res.send({...result, staff: originalStaff})
                      } else {
                        const authToken = result.token;
                        // Now create the new api user using the admin credentials in the secrets file.
                        
                        if(eSigEmail) {
                          user.username = eSigEmail;
                        }

                        assureSign.createApiUserCredentials(firm, user, secrets.assureSignAdmin, authToken, result => {
                          if(!result.success) {
                            console.log('this is where the error!!!');
                            console.log('result', result);
                            res.send({...result, staff: originalStaff})
                          } else {
                            // api user created. Now save the credentials on the staff object.
                            staff.apiUsername = result.credentials.apiUsername
                            staff.apiKey = result.credentials.apiKey
                            // contextUsername is always the same as the ImagineTime username.
                            staff.contextUsername = !!eSigEmail ? eSigEmail : user.username
                            staff.eSigEmail = eSigEmail ? eSigEmail : ''
                            staff.eSigAccess = true
                            staff._eSigGrantedBy = req.user._id
                            Staff.query()
                            .findById(staffId)
                            .update(staff) //valiation? errors??
                            .returning('*') // doesn't do this automatically on an update
                            .asCallback((err, staff) => {
                              if(err || !staff) {
                                logger.error("ERROR: ")
                                logger.info(err)
                                res.send({success: false, message: "Could not save api credentials for Staff", staff: originalStaff})
                              } else {
                                logger.info("Staff successfully updated", staff)
                                res.send({success: true, staff})
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  });
}

exports.bulkInvite = (req, res) => {

  const { firmId, newStaffs, uploadOnly } = req.body;
  const socket = req.io;
  const sender = req.user;

  // first things - find firm
  Firm.query().findById(parseInt(firmId))
    .then(firm => {
      if (!firm) {
        res.send({ success: false, message: "Firm not found" });
      } else {
        
        // next fetch all existing staff members
        Staff.query().where({ _firm: firm._id })
        .then(existingStaff => {
          if (!existingStaff) {
            res.send({success: false, message: "Problem finding existingStaff"});
          } else {
            logger.info("Staffs found, check users");

            let staffsAttempted = 0;
            let stats = {
              existingStaff: 0
              , existingUsers: 0 
              , errors: 0 
              , successfulInvites: 0 
            }
            // NOTE:  async.reflect continues to iterate over the collection even if error is thrown -- https://github.com/caolan/async/issues/1110
            // async.each(req.body.invitations, async.reflect((nextInvite, invitationMapCb) => {

            // NOTE: Using map instead since we never actually throw the error.
            async.map(newStaffs, (nextInvite, invitationCallBack) => {

              const progressPercent = (100/parseInt(newStaffs.length)) * staffsAttempted;
              socket.to(sender._id).emit('upload_status', Math.floor(progressPercent));
              staffsAttempted++;
      
              nextInvite.email = nextInvite.email.toLowerCase();

              // regex checks for ____@____.__
              const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
              const isValid = re.test(nextInvite.email);

              if (!isValid) {
                logger.error("bad email");
                stats.errors++;
                invitationCallBack(null, { email: nextInvite.email, inviteSent: false, result: "invalid email", error: null});
              } else {

                // email is valid check if username exists 
                logger.debug("email valid");

                User.query()
                  .where({ username: nextInvite.email })
                  .first()
                  .then(existingUser => {

                    let callBackDetail = {
                      email: nextInvite.email
                      , firstname: nextInvite.firstname
                      , lastname: nextInvite.lastname
                      , owner: nextInvite.owner
                      , result: ""
                      , error: ""
                      , inviteSent: false
                    }

                    if (!existingUser) {

                      // user with this email does not exist, create new user
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
                      usersController.utilCheckAndSaveUser(userData, response => {
                        // logger.info("utilCheckAndSaveUser callback reponse");
                        // console.log(response);
                        if(!response.success) {
                          logger.error("Error after utilCheckandsaveuser");
                          stats.errors++;
                          callBackDetail["inviteSent"] = false;
                          callBackDetail["result"] = "Could not create new user.";
                          callBackDetail["error"] = response.message;
                          invitationCallBack(null, callBackDetail);
                        } else {

                          if (uploadOnly) {
                            let newStaff = {
                              _user: response.user._id 
                              , _firm: firm._id
                              , status: 'active'
                              , owner: nextInvite.owner
                            }
                            Staff.query().insert(newStaff)
                            .returning('*')
                            .then(staff => {
                              if(!staff) {
                                stats.errors++;
                                callBackDetail["inviteSent"] = false;
                                callBackDetail["result"] = "Could not create new user.";
                                callBackDetail["error"] = staff;
                                invitationCallBack(null, callBackDetail);
                              } else {
                                callBackDetail["inviteSent"] = true;
                                callBackDetail["result"] = "Created staff member.";
                                callBackDetail["error"] = null;
                                invitationCallBack(null, callBackDetail);
                              }
                            })
                            .catch(err => {
                              stats.errors++;
                              callBackDetail["inviteSent"] = false;
                              callBackDetail["result"] = "Could not create new staff member.";
                              callBackDetail["error"] = staff;
                              invitationCallBack(null, callBackDetail);
                            });
                          } else {
                            logger.info("new user created. Create new Staff object and sent invite");
                            exports.utilCreateAndInviteStaffMember(firm, response.user, nextInvite.owner, req.user, "", passwordHex, false, (result) => {
                              if(!result.success) {
                                stats.errors++;
                                callBackDetail["inviteSent"] = false;
                                callBackDetail["result"] = "Could not create new staff member.";
                                callBackDetail["error"] = result.message;
                                invitationCallBack(null, callBackDetail);
                              } else {
                                stats.successfulInvites++;
                                callBackDetail["inviteSent"] = true;
                                callBackDetail["result"] = "Created success and Invitation sent.";
                                callBackDetail["error"] = null;
                                invitationCallBack(null, callBackDetail);
                              }
                            });
                          }
                        }
                      })
                    } else {
                      // user with this username exits, let's see if they're already a existingStaff member 
                      logger.info("Detected existing username")
                      stats.existingUsers++;
                      async.detect(existingStaff, (staff, detectStaffCb2) => {
                        // check to see if user is an existing staff member 
                        detectStaffCb2(null, staff._user == existingUser._id) // exits on true 
                      }, (err3, detectedStaff) => {
                        if(err3) {
                          logger.error("error detecting staff members");
                          stats.errors++;
                          callBackDetail["inviteSent"] = false;
                          callBackDetail["result"] = "Database error detecting staff.";
                          callBackDetail["error"] = err3;
                          invitationCallBack(null, callBackDetail);
                        } else if(detectedStaff) {
                          // staff member exists
                          logger.info("staff member already exists, do nothing");
                          stats.existingStaff++;
                          // invitationMapCb(null, {  email: nextInvite.email, inviteSent: false, result: `Staff member already exists with status of ${detectedStaff.status}`, error: null })
                          if (uploadOnly) {
                            // do nothing
                            callBackDetail["inviteSent"] = false;
                            callBackDetail["result"] = "Staff member already exists.";
                            callBackDetail["error"] = null;
                            invitationCallBack(null, callBackDetail);
                          } else {
                            exports.utilCreateAndInviteStaffMember(firm, existingUser, nextInvite.owner, req.user, "", null, true, (result) => {
                              if(!result.success) {
                                stats.errors++;
                                callBackDetail["inviteSent"] = false;
                                callBackDetail["result"] = "Staff member already exists.";
                                callBackDetail["error"] = null;
                                invitationCallBack(null, callBackDetail);
                              } else {
                                stats.successfulInvites++;
                                callBackDetail["inviteSent"] = true;
                                callBackDetail["result"] = "Staff member already exists. Resend Invite";
                                callBackDetail["error"] = null;
                                invitationCallBack(null, callBackDetail);
                              }
                            });
                          }
                        } else {
                          // user exists, but is not yet staff. create staff & send invite 
                          logger.info("user exists, but is not yet staff. create staff & send invite ");
                          if (uploadOnly) {
                            let newStaff = {
                              _user: existingUser._id 
                              , _firm: firm._id
                              , status: 'active'
                              , owner: nextInvite.owner
                            }
                            Staff.query().insert(newStaff)
                            .returning('*')
                            .then(staff => {
                              if(!staff) {
                                stats.errors++;
                                callBackDetail["inviteSent"] = false;
                                callBackDetail["result"] = "Could not create new staff member.";
                                callBackDetail["error"] = staff;
                                invitationCallBack(null, callBackDetail);
                              } else {
                                callBackDetail["inviteSent"] = false;
                                callBackDetail["result"] = "Created success.";
                                callBackDetail["error"] = null;
                                invitationCallBack(null, callBackDetail);
                              }
                            })
                            .catch(err => {
                              stats.errors++;
                              callBackDetail["inviteSent"] = false;
                              callBackDetail["result"] = "Could not create new staff member.";
                              callBackDetail["error"] = staff;
                              invitationCallBack(null, callBackDetail);
                            });
                          } else {
                            logger.info("new user created. Create new Staff object and sent invite");
                            exports.utilCreateAndInviteStaffMember(firm, existingUser, nextInvite.owner, req.user, "", passwordHex, false, (result) => {
                              if(!result.success) {
                                stats.errors++;
                                callBackDetail["inviteSent"] = false;
                                callBackDetail["result"] = "Could not create new staff member.";
                                callBackDetail["error"] = result.message;
                                invitationCallBack(null, callBackDetail);
                              } else {
                                stats.successfulInvites++;
                                callBackDetail["inviteSent"] = true;
                                callBackDetail["result"] = "Invitation sent.";
                                callBackDetail["error"] = null;
                                invitationCallBack(null, callBackDetail);
                              }
                            });
                          }
                        }
                      })                      
                    }
                  });
              }
            }, (err1, results) => {
              if (err1) {
                logger.error(err1);
                res.send({ success: false, nextInvite, message: "async error - check logs" });
              } else {
                // all done with invites.  
                let data = {
                  results 
                  , stats
                }
                res.send({success: true, staffs: data });
              }
            });
          }
        })
      }
    })
}