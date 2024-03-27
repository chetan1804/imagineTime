/**
 * Sever-side controllers for Notification.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Notification
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */
// get the appUrl for the current environment
let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

// import third-party libraries
let async = require('async');

const Client = require('../client/ClientModel');
const Firm = require('../firm/FirmModel');
const Notification = require('./NotificationModel');
const User = require('../user/UserModel');
const Staff = require("../staff/StaffModel");

const clientUsersCtrl = require('../clientUser/clientUsersController');
const staffClientsCtrl = require('../staffClient/staffClientsController')
const staffCtrl = require('../staff/staffController');
const firmsController = require('../firm/firmsController');

const brandingName = require('../../global/brandingName.js').brandingName;

let emailUtil = require('../../global/utils/email');

let logger = global.logger;

exports.list = (req, res) => {
  Notification.query()
  .then(notifications => {
    res.send({success: true, notifications})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of notifications queried from the array of _id's passed in the query param
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
    // Notification.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notifications) => {
    //     if(err || !notifications) {
    //       res.send({success: false, message: `Error querying for notifications by ${["_" + req.params.refKey]} list`, err});
    //     } else if(notifications.length == 0) {
    //       Notification.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notifications) => {
    //         if(err || !notifications) {
    //           res.send({success: false, message: `Error querying for notifications by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, notifications});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, notifications});
    //     }
    // })
    Notification.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notifications) => {
        if(err || !notifications) {
          res.send({success: false, message: `Error querying for notifications by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, notifications});
        }
    })
  }
}

exports.listMyNotifs = (req, res) => {
  if(req.user._id !== parseInt(req.params.id)) {
    res.send({success: false, message: "You do not have permission to view these API results"})
  } else {
    Notification.query()
    .where({_user: req.user._id})
    .orderBy('created_at', 'desc')
    .then(notifications => {
      res.send({success: true, notifications})
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
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1];
      }
    }
    Notification.query()
    .where(query)
    .orderBy('created_at', 'desc')
    .limit(1000)
    .then(notifications => {
      res.send({success: true, notifications})
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
    Notification.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, notifications) => {
      if(err || !notifications) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , notifications: notifications
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Notification.find(mongoQuery).exec((err, notifications) => {
      if(err || !notifications) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, notifications: notifications });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get notification by id');
  Notification.query().findById(req.params.id)
  .then(notification => {
    if(notification) {
      res.send({success: true, notification})
    } else {
      res.send({success: false, message: "Notification not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get notification schema ');
  res.send({success: true, schema: Notification.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get notification default object');
  res.send({success: true, defaultObj: Notification.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new notification');
  console.log(req.body)
  // let notification = new Notification({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     notification[k] = req.body[k];
  //   }
  // }


  Notification.query().insert(req.body)
  .returning('*')
  .then(notification => {
    if(notification) {
      res.send({success: true, notification})
    } else {
      res.send({ success: false, message: "Could not save Notification"})
    }
  });
}


exports.generateFromActivity = (activity, io, fromUserString = '%USER%') => {
  console.log("generating notification from (firm) activity")
  const shareLink = activity.shareLink;
  delete activity.shareLink;

  if(activity._client) {
    staffClientsCtrl.utilGetByClientId(activity._client, (err, staffClients) => {
      if(err) {
        logger.error('Error finding staffClients.', err)
      } else {
        logger.info('creating new notifications from activity');
        // create and send a notification to each staffClient.
  
        if(activity.sendEmail) {
          
          logger.info("Send an activity email");
          let toggleName = "";
          if (activity.text.includes("uploaded a file")) {
            toggleName = "sN_upload";
          } else if (activity.text.includes("started chatting in")) {
            toggleName = "sN_leaveComment";
          } else if (activity.text.includes("signed a document")) {
            toggleName = "sN_signingCompleted";
          } else if (activity.text.includes("sent a message") || activity.text.includes("replied to a post")) {
            toggleName = "sN_sendMessage";
          } else if (activity.text.includes("viewed a signature request")) {
            toggleName = "sN_viewSignatureRequest";
          }

          async.each(staffClients, (staffClient, cb) => {
            if(!staffClient.sendNotifs) {
                // This staff does not want notifications for this clientaar.
              logger.info('Notifications turned off for staffClientId: ', staffClient._id)
            } else if (!staffClient[toggleName]) {
              // This staff does not want notifications for this client.
              logger.info('Notifications turned off for staffClientId: ', staffClient._id)
            } else if(staffClient._user == activity._user) {
              // don't send a notification to the user who generated this activity
            } else if (shareLink && !shareLink.sN_signingCompleted && toggleName === "sN_signingCompleted" && staffClient._user === shareLink._createdBy) {
              // don't send a notification to the creator of the link. override client workspace settings
            } else if (shareLink && !shareLink.sN_viewSignatureRequest && toggleName === "sN_viewSignatureRequest" && staffClient._user === shareLink._createdBy) {
              // don't send a notification to the creator of the link. override client workspace settings
            } else {
  
              Staff.query().findById(staffClient._staff)
                .then(staff => {
                  if (staff && staff.status != "inactive") {
                    let newNotification = {};
                    newNotification._activity = activity._id;
                    newNotification._user = staffClient._user;
                    newNotification.content = activity.text.replace('%USER%', fromUserString); // customize output
                    newNotification.link = activity.link;
                    // console.log('newNotification', newNotification)
                    Notification.query().insert(newNotification)
                    .returning('*')
                    .then(notification => {
                      if(notification) {
                        io.to(notification._user).emit('receive_notification', notification)
                        if (toggleName === "sN_signingCompleted") {
                          Client.query().findById(activity._client)
                          .asCallback((err, client) =>  {
                            if (err && !client) {
                              exports.utilCheckAndSendNotifEmail(activity._firm, notification) 
                            } else {
                              // add client name in subject line
                              notification.subject = `${notification.content} / ${client.name}`;
                              exports.utilCheckAndSendNotifEmail(activity._firm, notification);
                            }
                          });
                        } else {
                          exports.utilCheckAndSendNotifEmail(activity._firm, notification);
                        }
                      } else {
                        logger.error('ERROR creating notification for user: ', staffClient._user)
                      }
                    }); 
                  }
                });
            }
            cb();
          }, err => {
            if(err) {
              logger.error('ERROR: One or more notifications failed. ', err)
            } else {
              logger.info(`All notifications successfully created for activity: ${activity._id}`)
            }
          });
        }
      }
    });
  } else {
    staffCtrl.utilGetByFirmId(activity._firm, (err, staffs) => {
      if(err) {
        logger.error('Error finding staffClients.', err)
      } else {
        async.each(staffs, (staff, cb) => {
          if(staff._user == activity._user) {
            // don't send a notification to the user who generated this activity
            cb();
          } else {
            logger.error("staffclient", staff);
            console.log("let me in");
  
            let newNotification = {};
            newNotification._activity = activity._id;
            newNotification._user = staff._user;
            newNotification.content = activity.text.replace('%USER%', fromUserString) // customize output
            newNotification.link = activity.link;
            // console.log('newNotification', newNotification)
            Notification.query().insert(newNotification)
            .returning('*')
            .then(notification => {
              if(notification) {
                logger.info(`Notification created with id: ${notification._id}`)
                io.to(notification._user).emit('receive_notification', notification)
                
                if(activity.sendEmail) {
                  logger.info("Send an activity email");
                  exports.utilCheckAndSendNotifEmail(activity._firm, notification)
                }
  
                cb();
              } else {
                logger.error('ERROR creating notification for user: ', staffClient._user)
                cb();
              }
            }); 
          }
        }, err => {
          if(err) {
            logger.error('ERROR: One or more notifications failed. ', err)
          } else {
            logger.info(`All notifications successfully created for activity: ${activity._id}`)
          }
        });
      }
    });
  }
}


exports.generateFromClientActivity = (clientActivity, io, fromUserString = '%USER%') => {
  console.log("generating notification from (client) activity")

  Client.query()
    .findById(clientActivity._client)
    .asCallback((err, client) => {

      if (err && !client) {
        logger.error('ERROR: Client not found. ', err);
      } else {

        let toggleName = "";
        if (clientActivity.text.includes("uploaded a file")) {
          toggleName = "sN_upload";
        } else if (clientActivity.text.includes("started chatting in")) {
          toggleName = "sN_leaveComment"
        } else if (clientActivity.text.includes("sent a message") || clientActivity.text.includes("replied to a post")) {
          toggleName = "sN_sendMessage";
        } else if (clientActivity.text.includes("commented")) {
          toggleName = "commented";
        }

        if (client && toggleName && (client[toggleName] || toggleName === "commented")) {
          clientUsersCtrl.utilGetByClientId(clientActivity._client, (err, clientUsers) => {
            logger.error('All clientUsers.', clientActivity._client, clientUsers)
            if(err) {
              logger.error('Error finding clientUsers.', err)
            } else {
              logger.info('creating new notifications from clientActivity');
              // create and send a notification to each clientUser.
              async.each(clientUsers, (clientUser, cb) => {
                /**
                 * TODO: Hit a util here to check this user's notification preferences.
                 * For now we're sending it anyway.
                 */
                if(clientUser._user == clientActivity._user || clientUser.status != "active") {
                  // don't send a notification to the user who generated this clientActivity
                } else {
                  
                  User.query().findById(clientUser._user).then(user => {
                    if (user && user.sendNotifEmails && (!user.firstLogin || clientUser.accessType !== "noinvitesent" && clientUser.accessType)) {
                      let newNotification = {}; 
                      newNotification._clientActivity = clientActivity._id;
                      newNotification._user = clientUser._user;
                      newNotification.content = clientActivity.text.replace('%USER%', fromUserString) // customize output
                      newNotification.link = clientActivity.link;
      
                      // console.log('newNotification', newNotification)
                      Notification.query().insert(newNotification)
                      .returning('*')
                      .then(notification => {
                        if(notification) {
                          logger.info(`Notification created with id: ${notification._id}`);
                          io.to(notification._user).emit('receive_notification', notification);
                          if(clientActivity.sendEmail) {
                            exports.utilCheckAndSendNotifEmail(clientActivity._firm, notification);
                          }
                        } else {
                          logger.error('ERROR creating notification for user: ', clientUser._user);
                        }
                      });
                    }
                  });
                }
                cb();
              }, err => {
                if(err) {
                  logger.error('ERROR: One or more notifications failed. ', err);
                } else {
                  logger.info(`All notifications successfully created for clientActivity: ${clientActivity._id}`)
                }
              });
            }
          });
        }
      }
    });
}

exports.sendNotifLinkCreator = (firmId, notification) => {
  logger.info("Checking user notification preferences");
  User.query()
  .select('username', 'sendNotifEmails')
  .findById(notification._user)
  .asCallback( (err, user) => {
    if(err || !user) {
      logger.error('ERROR ', err)
    } else {
      // get the firm so we can use the right domain.
      Firm.query()
      .findById(firmId)
      .asCallback(async (err, firm) => {
        if(err || !firm) {
          logger.error('ERROR ', err)
        } else {
          // set custom url, if applicable
          let firmUrl = appUrl;

          if(firm && firm.domain) {
            firmUrl = firm.domain;
          }
          let firmLogo;
          if(firm.logoUrl) {
            firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
          }
          logger.debug("creating notification email");

          const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';

          const subject = notification.content ? `${notification.content}` : `New Activity in ${brandingName.title}`;
          const fromInfo = await firmsController.getEmailFromInfo(firmId, notification._user);
          /*
          const fromInfo = {
            email: brandingName.email.noreply
            , name: brandingName.title
          }
          */
          let targets = [user.username];
          let link = `http://${firmUrl}${notification.link}`;
          let notifContent = `<h1 style="text-align: center;">${notification.content}</h1>`

          let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;

          const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
              <table class="mcnButtonContentContainer" style="margin-bottom: 16px; border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                  <tbody>
                      <tr>
                          <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                            <a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${title}</a>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </td>`
          const content = [
            { name: 'notifLink' , content: notifLink }
            , { name: 'notifContent', content: notifContent}
          ]
          // If there is a firm logo add it to the content array.
          if(firmLogo) {
            content.push({
              name: 'firmLogo', content: firmLogo
            })
          }
          emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
            logger.info(data);
          });
        }
      });
    }
  })
}

exports.generateFromActivityNoClient = (activity, io, fromUserString = '%USER%') => {

  let newNotification = {};
  newNotification._activity = activity._id;
  newNotification._user = activity._user;
  newNotification.content = fromUserString // customize output
  newNotification.link = activity.link;

  Notification.query().insert(newNotification)
  .returning('*')
  .then(notification => {
    if(notification) {
      logger.info(`Notification created with id: ${notification._id}`)
      io.to(notification._user).emit('receive_notification', notification)
      exports.sendNotifLinkCreator(activity._firm, notification)
    } else {
      logger.error('ERROR creating notification for user: ', activity._user)
    }
  }); 
}

exports.sendNotifLinkByUserId = (
  io
  , userIds
  , firmId
  , clientId
  , workspaceLink
  , portalLink
  , text
  , fromUserString
  , result 
) => {
  if (!clientId) {
    async.map(userIds, (userId, cb) => {
      let newNotification = {};
      newNotification._user = userId;
      newNotification.content = text.replace('%USER%', fromUserString); // customize output
      newNotification.link = workspaceLink;
      Notification.query().insert(newNotification)
        .returning('*')
        .then(notification => {
          console.log("notification", notification)
          if(notification) {
            io.to(notification._user).emit('receive_notification', notification)
            exports.sendNotifLinkCreator(firmId, notification);
          }
          cb();
        }); 
    }, () => {
      // result("end of sendNotifLinkByUserId");
    });
  }
}

exports.update = (req, res) => {
  logger.info('updating notification');

  const notificationId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Notification.query()
  .findById(notificationId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(notification => {
    // Send the updated notification to its user.
    req.io.to(notification._user).emit('receive_notification', notification)
    res.send({success: true, notification})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting notification");
  
  // TODO: needs testing and updating
  const notificationId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM notifications WHERE id = ' + notificationId + ';'

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

exports.utilCheckAndSendNotifEmail = (firmId, notification) => {
  logger.info("Checking user notification preferences");
  User.query()
  .select('username', 'sendNotifEmails')
  .findById(notification._user)
  .asCallback((err, user) => {

    console.log("notif user", user);
    if(err || !user) {
      logger.error('ERROR ', err)
    } else if(user.sendNotifEmails) {
      // get the firm so we can use the right domain.
      Firm.query()
      .findById(firmId)
      .asCallback(async (err, firm) => {
        if(err || !firm) {
          logger.error('ERROR ', err)
        } else {
          // set custom url, if applicable
          let firmUrl = appUrl;

          if(firm && firm.domain) {
            firmUrl = firm.domain;
          }
          let firmLogo;
          if(firm.logoUrl) {
            firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
          }
          logger.debug("creating notification email");
          console.log("notification.content", notification.content);
          const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
          const subject = notification.content;
          const fromInfo = await firmsController.getEmailFromInfo(firmId, notification._user);
          /*
          const fromInfo = {
            email: brandingName.email.noreply
            , name: brandingName.title
          }
          */
          let targets = [user.username];
          let link = `http://${firmUrl}${notification.link}`;
          let notifContent = `<h1 style="text-align: center;">${notification.content}</h1>`
          let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;

          const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
              <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
                  <tbody>
                      <tr>
                          <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                            <a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">View in ${title}</a>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </td>`
          const content = [
            { name: 'notifLink' , content: notifLink }
            , { name: 'notifContent', content: notifContent}
          ]
          // If there is a firm logo add it to the content array.
          if(firmLogo) {
            content.push({
              name: 'firmLogo', content: firmLogo
            })
          }
          emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
            logger.info(data);
          });
        }
      });
    } else {
      logger.info("User does not want emails. No email sent.")
    }
  })
}

exports.utilNotification = async (notification, callback) => {

  const { userlist, firm } = notification;
  let bottomContent = notification.bottomContent ? notification.bottomContent : '';
  let firmUrl = appUrl;

  if(firm && firm.domain) {
    firmUrl = firm.domain;
  }
  let firmLogo;
  if(firm.logoUrl) {
    firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
  }
  logger.debug("creating notification email");
  const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
  const subject = notification.subject || notification.content || `New Activity in ${brandingName.title}`;
  const fromInfo = await firmsController.getEmailFromInfo(firm._id, notification._user);
  /*
  const fromInfo = {
    email: brandingName.email.noreply
    , name: notification && notification.name || brandingName.title
  }*/
  let targets = userlist;
  let link = `http://${firmUrl}${notification.link}`;
  
  let notifContent = `<h1 style="text-align: center;"><span>${notification.content}</span><span style="font-weight: normal; font-size: 20px; text-decoration: none; color: #222">${!!notification.extra ? notification.extra : ''}</span></h1>`;

  // add comment 
  if (notification.note) {
    notifContent += `<p style="text-align: center;">${notification.note}</p>`;
  }

  let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;

  const notifLink = `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
      ${typeof(notification.link) === "string" || typeof(notification.link) != "object" ? 
      `<table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
        <tbody>
          <tr>
              <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                <a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">
                  ${notification.linkText ? notification.linkText : `View in ${title}`}
                </a>
              </td>
          </tr>
        </tbody>
      </table>${bottomContent}`
      : notification.link.map(objLink => {
        return `<table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
        <tbody>
          <tr>
              <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                <a class="mcnButton " title="View in ${title}" href=${`http://${firmUrl}${objLink.linkPath}`} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;">
                  ${objLink.linkText ? objLink.linkText : `View in ${title}`}
                </a>
              </td>
          </tr>
        </tbody>
      </table>${bottomContent}`
      })
    } 
  </td>`;

  
  const content = [
    { name: 'notifLink' , content: notifLink }
    , { name: 'notifContent', content: notifContent}
  ]
  // If there is a firm logo add it to the content array.
  if(firmLogo) {
    content.push({
      name: 'firmLogo', content: firmLogo
    })
  }
  emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
    callback(data);
  });
}

exports.signatureReminder = async (shareLink) => {
  if (shareLink && shareLink.firm && shareLink.quicktask && shareLink.quicktask.signingLinks && shareLink.quicktask.signingLinks.length) {
    const linkCreator = shareLink.linkcreator;
    const signers = shareLink.quicktask.signingLinks;
    const firm = shareLink.firm;
    const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
    const subject = `Reminder about your document from ${firm.name}.`;
    const fromInfo = await firmsController.getEmailFromInfo(firm._id, shareLink._createdBy);
    /*
    const fromInfo = {
      email: brandingName.email.noreply
      , name: brandingName.title + " Inc."
    }*/
    let firmUrl = appUrl;
    let firmLogo;
    if(firm && firm.domain) {
        firmUrl = firm.domain;
    }
    if(firm.logoUrl) {
        firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
    }
    let link = shareLink && shareLink.url;
    let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
    let notifLink = 
      `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
          <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;margin-bottom: 10px;" cellspacing="0" cellpadding="0" border="0">
              <tbody>
                  <tr>
                      <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                          <a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-decoration: none;color: #FFFFFF;">
                              View in ${title}
                          </a>
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
                    <a href=${link} target="_self">${link}</a>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
      </td>`;

    // notify creator
    if (linkCreator && linkCreator.username && !shareLink.dontNotifyTheCreator) { // dontNotifyTheCreator = this is always false or undefined in other callers except for cron-process.js
      const targets = [linkCreator.username];
      let notifContent = `<p><strong>Dear ${linkCreator.firstname} ${linkCreator.lastname},</strong></p>`;
      notifContent += '<br/>';
      notifContent += `<p><span>Your ${firm.name}. document has not yet been signed by all required parties.</span></p>`;

      const content = [
        { name: 'notifLink' , content: notifLink }
        , { name: 'notifContent', content: notifContent}
      ];
      if(firmLogo) {
        content.push({
          name: 'firmLogo', content: firmLogo
        })
      }
      emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
        console.log(data, firmUrl);
      });
    }

    if (!shareLink.dontNotifyTheSigner) { // dontNotifyTheSigner = this is always false or undefined in other callers except for cron-process.js
      signers.map(signer => {
        if (signer && signer.signatoryEmail && !signer.responseDate) {
          const targets = [signer.signatoryEmail];
      
          let notifContent = `<p><strong>Dear ${signer.signerName},</strong></p>`;
          notifContent += '<br/>';
          notifContent += `<p><span>Your ${firm.name}. document has not yet been signed by all required parties.</span></p>`;

          const content = [
              { name: 'notifLink' , content: notifLink }
              , { name: 'notifContent', content: notifContent}
          ];
          if(firmLogo) {
              content.push({
                name: 'firmLogo', content: firmLogo
              })
          }
          emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
              console.log(data, firmUrl);
          });
        }
      });
    }
  }
}

exports.requestFileReminder = async (shareLink) => {
  if (shareLink && shareLink.firm && shareLink.quicktask) {
    const signers = shareLink.sentTo;
    const firm = shareLink.firm;
    const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
    const subject = `Reminder about the file requested by ${firm.name}.`;
    const fromInfo = await firmsController.getEmailFromInfo(firm._id, shareLink._createdBy);
    let firmUrl = appUrl;
    let firmLogo;

    if(firm && firm.domain) {
        firmUrl = firm.domain;
    }
    if(firm.logoUrl) {
        firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
    }
    let link = shareLink && shareLink.url;
    let notifLink = 
      `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
          <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
              <tbody>
                  <tr>
                      <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                          <a class="mcnButton " title="View in ImagineShare" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-decoration: none;color: #FFFFFF;">
                              View File Request
                          </a>
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
                    <a href=${link} target="_self">${link}</a>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
      </td>`;

    signers.map(signer => {
      if (signer && signer.email) {
        const targets = [signer.email];
        
        let notifContent = `<p><strong>Good day,</strong></p>`;
        notifContent += '<br/>';
        notifContent += `<p><span>${firm.name} requested files.</span></p>`;

        const content = [
            { name: 'notifLink' , content: notifLink }
            , { name: 'notifContent', content: notifContent}
        ];
        if(firmLogo) {
            content.push({
              name: 'firmLogo', content: firmLogo
            })
        }
        emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
            console.log(data, firmUrl);
        });
      }
    });
  }
}

exports.requestTaskReminder = async (requestTask) => {
  if (requestTask && requestTask.firm && requestTask.assignee && requestTask.assignee.length) {
    const usernameList = requestTask.assignee.filter(item => item && item.username).map(item => item.username);
    const firm = requestTask.firm;
    const template = brandingName.title == "LexShare" ? 'notification-email-lexshare' : 'notification-email';
    const subject = `Reminder about your request task from ${firm.name}.`;
    const fromInfo = await firmsController.getEmailFromInfo(firm._id, requestTask._createdBy);
    let firmUrl = appUrl;
    let firmLogo;

    if(firm && firm.domain) {
        firmUrl = firm.domain;
    }
    if(firm.logoUrl) {
        firmLogo = `<img alt="" src="http://${firmUrl}/api/firms/logo/${firm._id}/${firm.logoUrl}" style="max-width:800px; padding-bottom: 0; display: inline !important; vertical-align: bottom;" class="mcnImage" width="564" align="left"/>`
    }
    let link = requestTask && requestTask.url;
    let notifLink = 
      `<td style="padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;" class="mcnButtonBlockInner" valign="top" align="center">
          <table class="mcnButtonContentContainer" style="border-collapse: separate !important;border-radius: 50px;background-color: #0EBAC5;" cellspacing="0" cellpadding="0" border="0">
              <tbody>
                  <tr>
                      <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                          <a class="mcnButton " title="View in ImagineShare" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-decoration: none;color: #FFFFFF;">
                              View Request Task
                          </a>
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
                    <a href=${link} target="_self">${link}</a>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
      </td>`;


    const targets = usernameList;
      
    let notifContent = `<p><strong>Good day,</strong></p>`;
    notifContent += '<br/>';
    notifContent += `<p><span>Your ${firm.name}. request task has not yet been completed by all required parties.</span></p>`;

    const content = [
        { name: 'notifLink' , content: notifLink }
        , { name: 'notifContent', content: notifContent}
    ];
    if(firmLogo) {
        content.push({
          name: 'firmLogo', content: firmLogo
        })
    }
    emailUtil.sendEmailTemplate(targets, subject, template, content, null, null, fromInfo, data => {
        console.log(data, firmUrl);
    });
  }
}