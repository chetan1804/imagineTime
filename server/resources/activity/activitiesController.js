/**
 * Sever-side controllers for Activity.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Activity
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

 // import third-party libraries
let async = require('async');
const DateTime = require('luxon').DateTime;

const Activity = require('./ActivityModel');
const ClientActivity = require('../clientActivity/ClientActivityModel');
const User = require('../user/UserModel');
const StaffClient = require('../staffClient/StaffClientModel');
const Client = require('../client/ClientModel');
const Firm = require('../firm/FirmModel');
const Notification = require('../notification/NotificationModel');
const Staff = require('../staff/StaffModel');
const ShareLink = require('../shareLink/ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');

const clientUsersCtrl = require('../clientUser/clientUsersController');
const notifsCtrl = require('../notification/notificationsController');
const staffClientCtrl = require('../staffClient/staffClientsController');
const brandingName = require('../../global/brandingName.js').brandingName;
const { raw } = require('objection');
const _ = require('lodash');
const File = require('../file/FileModel');
let logger = global.logger;
let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

exports.list = (req, res) => {
  Activity.query()
  .then(activities => {
    res.send({success: true, activities})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of activities queried from the array of _id's passed in the query param
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
    // Activity.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, activities) => {
    //     if(err || !activities) {
    //       res.send({success: false, message: `Error querying for activities by ${["_" + req.params.refKey]} list`, err});
    //     } else if(activities.length == 0) {
    //       Activity.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, activities) => {
    //         if(err || !activities) {
    //           res.send({success: false, message: `Error querying for activities by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, activities});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, activities});
    //     }
    // })
    Activity.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, activities) => {
        if(err || !activities) {
          res.send({success: false, message: `Error querying for activities by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, activities});
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
      res.send({ success: true, activities: [] });
    } else {
      Activity.query()
      .where(query)
      // Changing the default sort order to avoid sorting this list on the front end every time it's fetched.
      .orderBy('_id', 'asc')
      .select('*', raw('concat(text,  \' \', link) as dummy'))
      // .groupBy('dummy')
      .then(activities => {
        // res.send({success: true, activities});
        // because of the mistake in the past. activity logs were saved twice and the uploader's name was not saved when he was not loggedIn
        const uniqueActivities = activities && activities.length ? _.uniqBy(activities, 'dummy') : [];
        async.map(uniqueActivities, (activity, cb) => {
          const link = activity.link;
          const fileId = link && link.substring(link.lastIndexOf('/') + 1);
          if (fileId && !isNaN(fileId) && activity.text.indexOf('%USER%') > -1 && !activity._user && activity.text.indexOf('uploaded') > -1 ) {
            File.query().findById(fileId).select('uploadName')
              .then(file => {
                  if (file && file.uploadName) {
                      activity.text = activity.text.replace('%USER%', file.uploadName)
                  }
                  cb(null, activity);
              })
          } else if(fileId && !isNaN(fileId) && activity.text.indexOf('%USER%') > -1 && !activity._user && activity.text.indexOf('requested a signature') > -1) { 
            const quickTaskId = fileId;
            QuickTask.query()
              .innerJoin('users', 'users._id', 'quicktasks._createdBy')
              .where({'quicktasks._id': quickTaskId})
              .select('users._id', 'users.firstname', 'users.lastname')
              .groupBy('quicktasks._id', 'users._id')
              .first()
              .then(user => {
                if(user && user._id && user.firstname && user.lastname) {
                  const fullname = user.firstname + " " + user.lastname;
                  activity.text = activity.text.replace('%USER%', fullname);
                }
                cb(null, activity);
              })
          } else{
              cb(null, activity);
          }
        }, (err, activities) => {
            if (!err) {
              res.send({success: true, activities});
            }
        })
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
    Activity.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, activities) => {
      if(err || !activities) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , activities: activities
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Activity.find(mongoQuery).exec((err, activities) => {
      if(err || !activities) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, activities: activities });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get activity by id');
  Activity.query().findById(req.params.id)
  .then(activity => {
    if(activity) {
      res.send({success: true, activity})
    } else {
      res.send({success: false, message: "Activity not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get activity schema ');
  res.send({success: true, schema: Activity.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get activity default object');
  res.send({success: true, defaultObj: Activity.defaultObject});
  // res.send({success: false})
}

exports.utilCreateFromResource = (
  userId
  , firmId
  , clientId
  , firmText
  , firmLink
  , isFirmReminder
  , sendFirmEmail
  , clientText = ""
  , clientLink = ""
  , isClientReminder = false
  , sendClientEmail = false //optional
  , io // needed so we can fire off notifications
  , type = ""
  , callback = () => {}
  ) => {
  console.log("utilCreateFromResource");
  if(!firmId /*|| !clientId*/) {
    callback({success: false, message: "Missing required fields to create an activity"})
    return;
  }
  /**
   * basically, we are going to delegate IF and WHEN to create an activity object to 
   * each of the individual resources that might generate it.
   * for example, tasks controller will have a utilCheckAndGenerateActivity function
   * (or something) that is called after a task updates, which will decide whether
   * an activity should be created, and then kick off this function
   * 
   * I also think we should delegate what the messages say, because I can't think of
   * anywhere else that that could happen. but it feels a little cluttered. one future
   * possibility is 
   * 
   * once that happens, this will create the actual activity and clientActivity if 
   * needed, and then kick of the notifiations util to generate those
   */

  let newActivity = {
    _user: userId
    , _firm: firmId
    , _client: clientId
    , text: firmText
    , link: firmLink
    , isReminder: isFirmReminder
    // , sendEmail: sendFirmEmail
    // NOTE: Currently sending emails for everything. We might want to add some more granularity
    // by uncommenting the above and setting it in all of the controllers that call this util.
    , sendEmail: true
  }

  Activity.query()
  .insert(newActivity)
  .returning('*')
  .then(activity => {
    console.log("saved activity, find users and send notifications")

    User.query().findById(newActivity._user)
    .skipUndefined() // userId could be undefined. This keeps it from throwing an error in that case.
    .then(user => {
      // If userId was undefined then "user" will be the first user in the db. Kinda gross, but we'll check for it below.
      // for the activities display, we will need to query users to display this
      // however, since notifications are single user (and there might be a lot of them)
      // lets just generate the "from" string here
      let fromUserString = "";
      // Add userId to these checks. If it's not there then we don't want to use the user info returned above because it is just the first user in the db.
      if(user && user._id === userId && user.firstname && user.lastname) {
        fromUserString = `${user.firstname} ${user.lastname}`
      } else if(user && user._id === userId) {
        fromUserString = user.username;
      } else {
        // This means userId was undefined. Use placeholder info.
        fromUserString = "A user";
      }
      // console.log("FROM USER STRING", fromUserString)

      // don't notify staffClient if the sender are also staffClient
      if (sendFirmEmail) {
        notifsCtrl.generateFromActivity(activity, io, fromUserString);
      }
      // no need to wait for this before firing off clientActivity (if needed)

      if(clientText && clientText.length > 0 && clientLink && clientLink.length > 0 && clientId) {
        // the caller of this function determines whether we want to create a client activity or not
        let newClientActivity = {
          _user: userId
          , _firm: firmId
          , _client: clientId
          , text: clientText
          , link: clientLink
          , isReminder: isClientReminder
          , sendEmail: sendClientEmail
          // TODO: We'll want to look at everywhere this util is called and make sure we are setting sendClientEmail.
          // I changed it so we'd have a way to not send emails when a signature request happens from outlook. - Wes
        }

        ClientActivity.query()
        .insert(newClientActivity)
        .returning('*')
        .then(clientActivity => {
          callback({success: true, activity, clientActivity})

          notifsCtrl.generateFromClientActivity(clientActivity, io, fromUserString);
        })
      } else {
        // these callbacks are mostly for future proofing; it's unlikely they will actually be used
        
        if(type == "signature" && !clientId) {
          console.log("sinagure activity", activity);
          // if (selectedStaff) {
          //   activity._user = selectedStaff._id;
          // }
          notifsCtrl.generateFromActivityNoClient(activity, io, firmText);
        }
        callback({success: true, activity})
      }
    });

  })
}

exports.createOnClientFileUpload = (req, res) => {
  if(!req.body.files) {
    logger.error('No files in request. Activity not created.')
    if (!req.body.nocallback) {
      res.send({success: false, message: 'No files found in request.'})
    }
  } else {
    const files = req.body.files;
    const file = files && files.length && files[0];
    Firm.query()
      .findById(file._firm)
      .then(firm => {

        let firmUrl = appUrl;
        if(firm && firm.domain) {
          firmUrl = firm.domain;
        }

        let workspaceLink;
        let portalLink;
        let fileId;
        let linkText;
        let bottomContent;
        let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
        linkText = `View in ${title}`;

        let fileList = '';
        files.forEach(item => {
          let link = `http://${firmUrl}`;
          if (item && item._client) {
            if (item._folder) {
              link += `/firm/${item._firm}/workspaces/${item._client}/files/${item._folder}/folder/${item._id}`;
            } else {
              link += `/firm/${item._firm}/workspaces/${item._client}/files/${item._id}`;
            }
          }    
          fileList += `<p style=""><a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;">${item.filename}</a></p>`;
        });
        bottomContent = `<table class="mcnButtonContentContainer" cellspacing="0" cellpadding="0" border="0">
          <tbody>
            <tr>
                <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                  ${fileList}
                </td>
            </tr>
          </tbody>
        </table>`;

        if (files && files.length > 1) {
          fileId = '?fIds=' + files.map(f => f._id).toString();
        } else {
          fileId = '/' + files[0]._id;
        }
        
        if (file && file._client) {
          portalLink = `/portal/${file._client}/files${fileId}`;
          if (file._folder) {
            workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files/${file._folder}/folder${fileId}`;
            if (files && files.length > 1) {
              portalLink = `/portal/${file._client}/files/folder/${file._folder}${fileId}`;
            }
          } else {
            workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files${fileId}`;
          }
        }

        exports.utilCreateUploadNotification(
          req.user // user id
          , file._firm // firm id
          , file._client // client id
          , workspaceLink // link for notification
          , portalLink // link for notification
          , req.body.files 
          , req.io
          , result => {
            if (!req.body.nocallback) {
              res.send(result)
            }
          }
          , false
          , firm
          , null // creator
          , req.body.uploadEmailAddress 
          , req.body.uploadCompanyName
          , false // fromMangobilling  
          , req.body.shareLink
          , linkText
          , bottomContent
        )
      });
  }
}

exports.createOnStaffFileUpload = (req, res) => {
  if(!req.body.files) {
    logger.error('No files in request. Activity not created.');
    if (!req.body.nocallback) {
      res.send({success: false, message: 'No files found in request.'})
    }
  } else if(req.body.files.filter(file => file.status != "hidden").length > 0) {
    logger.info('Client visibile files uploaded, create activity.'); 
    const files = req.body.files;
    const file = files && files.length && files[0];
    Firm.query()
      .findById(file._firm) 
      .then(firm => {

        let firmUrl = appUrl;
        if(firm && firm.domain) {
          firmUrl = firm.domain;
        }

        let workspaceLink;
        let portalLink;
        let fileId;
        let linkText;
        let bottomContent;
        let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
        linkText = `View in ${title}`;

        let fileList = '';
        files.forEach(item => {
          let link = `http://${firmUrl}`;
          if (item && item._client) {
            link += `/portal/${item._client}/files/${item._id}`;
          }    
          fileList += `<p style=""><a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;">${item.filename}</a></p>`;
        });
        bottomContent = `<table class="mcnButtonContentContainer" cellspacing="0" cellpadding="0" border="0">
          <tbody>
            <tr>
                <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                  ${fileList}
                </td>
            </tr>
          </tbody>
        </table>`;
        
        if (files && files.length > 1) {
          fileId = '?fIds=' + files.map(f => f._id).toString();
        } else {
          fileId = '/' + files[0]._id;
        }
        
        if (file && file._client) {
          if (file._folder) {
            workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files/${file._folder}/folder${fileId}`;
            portalLink = `/portal/${file._client}/files/folder/${file._folder}${fileId}`;
          } else {
            workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files${fileId}`;
            portalLink = `/portal/${file._client}/files${fileId}`;
          }
        }

        exports.utilCreateUploadNotification(
          req.user // user id
          , file._firm // firm id
          , file._client // client id
          , workspaceLink // link for notification
          , portalLink // link for notification
          , req.body.files 
          , req.io
          , result => {
            if (!req.body.nocallback) {
              res.send(result)
            }
          } 
          , true
          , firm
          , null // creator
          , req.body.uploadEmailAddress 
          , req.body.uploadCompanyName  
          , !!req.body.fromMangobilling 
          , null // shareLink
          , linkText
          , bottomContent
        )
      });
  } else {
    logger.info('No client visible files uploaded so no activity will be generated.'); 
    if (!req.body.nocallback) {
      res.send({ success: true, message: 'No client visible files uploaded so no activity will be generated.'})
    }
  }
}

exports.utilCreatePrivateNoteNotification = (
  user
  , file
  , io
  , firmLink
  , firmText
) => {
  let fromUserString = "";

  if(user && user.firstname && user.lastname) {
    fromUserString = `${user.firstname} ${user.lastname}`
  } else if(user && user._id) {
    fromUserString = user.username;
  } else {
    // This means userId was undefined. Use placeholder info.
    fromUserString = "A user";
  }
  
  let newActivity = {
    _user: user._id
    , _firm: file._firm
    , _client: file._client
    , text: firmText
    , link: firmLink
    , isReminder: true
    , sendEmail: true
  }

  Activity.query()
    .insert(newActivity)
    .returning('*')
    .then(activity => {

      notifsCtrl.generateFromActivity(activity, io, fromUserString);
    })
}

exports.utilCreateUploadNotification = (
  user
  , _firm
  , _client
  , workspaceLink
  , portalLink
  , files
  , io
  , callback
  , isStaff
  , firm
  , creator
  , uploadEmailAddress = ''
  , uploadCompanyName = ''
  , fromMangobilling = false
  , shareLink
  , linkText
  , bottomContent = ''
) => {
 
  let fromUserString = "";
  user = user || {};
  // Add userId to these checks. If it's not there then we don't want to use the user info returned above because it is just the first user in the db.
  if(user && user.firstname && user.lastname) {
    fromUserString = `${user.firstname} ${user.lastname}`
  } else if(user && user._id) {
    fromUserString = user.username;
  } else if (files[0].uploadName) {
    fromUserString = `(${files[0].uploadName})`;
  } else {
    // This means userId was undefined. Use placeholder info.
    fromUserString = !fromMangobilling ? "A user" : "A user (mangobilling)";
  }

  console.log('uploadEmailAdress', uploadEmailAddress);
  console.log('uploadCompanyName', uploadCompanyName);
  console.log('bottomContent', bottomContent)

  let otherContent = '';

  if(uploadEmailAddress)
    otherContent += `<br/> 
      <a href="mailto:${uploadEmailAddress}" 
        target="_blank"
        style="text-decoration: none !important; color: #222;">
        ${uploadEmailAddress}
      </a>`;

  // if(uploadCompanyName)
  //   otherContent += `<br/> ${uploadCompanyName}`
  
  console.log('debug1')
  if (_client) {

    console.log('debug2')
    const activityLog = {
      isReminder: true
      , link: workspaceLink
      , sendEmail: true
      , text: files.length > 1 ? `%USER% uploaded ${files.length} files` : `%USER% uploaded a file`
      , _client
      , _firm
      , _user: user ? user._id : null
    }

    if (fromUserString && !(user && user._id)) {
      activityLog.text = activityLog.text.replace('%USER%', fromUserString);
    }

    Activity.query()
      .insert(activityLog)
      .returning("*")
      .then(activity => {

        console.log('debug3')
        Client.query()
          .findById(_client)
          .then(client => {

            console.log('debug4')
            if (client) {

              activityLog.link = portalLink;
              ClientActivity.query()
                .insert(activityLog)
                .returning("*")
                .then(clientActivity => {

                  if (isStaff) {
                    console.log('debug6')
                    if (client.sN_upload) {
                      console.log('debug7')
                      clientUsersCtrl.utilGetByClientId(client._id, (err, clientUsers) => {
                        logger.info('creating new notifications from clientActivity', clientUsers);
                        // create and send a notification to each clientUser.
                        async.each(clientUsers, (clientUser, cb) => {
                          /**
                           * TODO: Hit a util here to check this user's notification preferences.
                           * For now we're sending it anyway.
                           */
                  
                          if(clientUser._user == user && user._id || clientUser.status != "active") {
                            // don't send a notification to the user who generated this clientActivity
                            cb();
                          } else {

                            User.query().findById(clientUser._user).then(resUser => {

                              if (resUser && resUser.sendNotifEmails && (!resUser.firstLogin || clientUser.accessType !== "noinvitesent" && clientUser.accessType)) {

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
                                    logger.info(`Notification created with id: ${notification._id}`)
                                    io.to(notification._user).emit('receive_notification', notification);
        
                                    // send email notification
                                    const sendNotification = {
                                      sender: brandingName.email.noreply
                                      , link: portalLink
                                      , content: files.length > 1 ? `${fromUserString} uploaded ${files.length} files` : `${fromUserString} uploaded a file`
                                      , subject: files.length > 1 ? `${fromUserString} uploaded ${files.length} files` : `${fromUserString} uploaded a file`
                                      , name: `${fromUserString} | ${firm && firm.name}`
                                      , userlist: [resUser.username]
                                      , firm
                                      , extra: otherContent
                                      , linkText
                                      , bottomContent
                                    }
                                    sendNotification.subject += ` | ${client.name}`;
                                    notifsCtrl.utilNotification(sendNotification, notifCallback => {
                                      // callback("sent success", notifCallback);
                                      logger.info("result: ", notifCallback);
                                    });
                                    cb();
                                  } else {
                                    logger.error('ERROR creating notification for user: ', clientUser._user)
                                    cb();
                                  }
                                });
                              } 
                            });
                          }
                        }, err => {
                          if(err) {
                            logger.error('ERROR: One or more notifications failed. ', err);
                            callback({ success: false, message: 'ERROR: One or more notifications failed.'});
                          } else {
                            logger.info(`All notifications successfully created for activity: ${clientActivity._id}`)
                            callback({ success: true, message: 'All notifications successfully created for activity'});
                          }
  
                        });
                      });
                    }
                  } else {

                    staffClientCtrl.utilGetByClientId(client._id, (err, staffUsers) => {
                      logger.info('creating new notifications from clientActivity 1');
                      // notify creator of request link 

                      if (staffUsers && shareLink && !shareLink.sN_upload) {
                        staffUsers = staffUsers.filter(item => item._user != shareLink._createdBy);
                      } else if (shareLink && shareLink.sN_upload && shareLink._createdBy && staffUsers) {
                        if (!staffUsers.some(sc => sc._user === shareLink._createdBy)) {
                          staffUsers.push({
                            _staff: null
                            , _user: shareLink._createdBy
                            , sN_upload: true
                            , sendNotifs: true
                          })
                        } else {
                          staffUsers = staffUsers.map(item => {
                            if (item && item._user === shareLink._createdBy) {
                              item.sN_upload = true;
                            }
                            return item;
                          });
                        }
                      } else if (creator && staffUsers && !staffUsers.some(sc => sc._user === creator)) {
                        staffUsers.unshift({
                          _staff: null
                          , _user: creator
                          , sN_upload: true
                          , sendNotifs: true
                        });
                      }

                      console.log("staffUser 1", staffUsers);

                      // create and send a notification to each clientUser.
                      async.each(staffUsers, (staffUser, cb) => {
                        /**
                         * TODO: Hit a util here to check this user's notification preferences.
                         * For now we're sending it anyway.
                         */
                        if (!staffUser) {
                          cb();
                        } else if (staffUser._user === user._id) {
                          // don't send a notification to the user who generated this clientActivity
                          cb();
                        } else if (staffUser.sN_upload && staffUser.sendNotifs) {
                          Staff.query()
                          .where({ _id: staffUser._staff }) // cannot use findById because some time _staff is null
                          .first()
                          .then(staff => {

                            if (staff && staff.status === "active" || !staffUser._staff) {
                              User.query()
                                .findById(staffUser._user)
                                .then(resUser => {

                                  if (resUser && resUser.sendNotifEmails) {
                                    let newNotification = {};
                                    newNotification._activity = activity._id;
                                    newNotification._user = staffUser._user;
                                    newNotification.content = activity.text.replace('%USER%', fromUserString) // customize output
                                    newNotification.link = activity.link;

                                    Notification.query().insert(newNotification)
                                      .returning("*")
                                      .then(notification => {
                                        if (notification) {
                                          io.to(notification._user).emit('receive_notification', notification);
                                          const sendNotification = {
                                            sender: brandingName.email.noreply
                                            , link: workspaceLink
                                            , content: files.length > 1 ? `${fromUserString} uploaded ${files.length} files` : `${fromUserString} uploaded a file`
                                            , subject: files.length > 1 ? `${fromUserString} uploaded ${files.length} files` : `${fromUserString} uploaded a file`
                                            , name: `${fromUserString} | ${firm && firm.name}`
                                            , userlist: [resUser.username]
                                            , firm
                                            , extra: otherContent
                                            , linkText
                                            , bottomContent
                                          }
                                          sendNotification.subject += ` | ${client.name}`;
                                          notifsCtrl.utilNotification(sendNotification, notifCallback => {
                                            //callback("sent success", notifCallback);
                                            cb();
                                            logger.info("result: ", notifCallback);
                                          });
                                        } else {
                                          cb();
                                        }
                                      });
                                  } else {
                                    cb();
                                  }
                                });
                              
                            } else {
                              // no notification
                              cb();
                            }
                          });
                        } else {
                          cb();
                        }
                      }, err => {
                        console.log("err", err);
                        console.log('async done');
                        if(err) {
                          logger.error('ERROR: One or more notifications failed. ', err);
                          callback({ success: false, message: 'ERROR: One or more notifications failed.'});
                        } else {
                          logger.info(`All notifications successfully created for activity: ${activity._id}`)
                          callback({ success: true, message: 'All notifications successfully created for activity'});
                        }
                      });
                    });
                  }
                })
            } else {
              // 
              callback({ success: true, message: 'Contacts will not receive a notification.'});
            }
          });

      });
  } else {
    callback({ success: true, message: 'No client visible files uploaded so no activity will be generated.'})
  }
}

exports.create = (req, res) => {
  logger.info('creating new activity');
  // let activity = new Activity({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     activity[k] = req.body[k];
  //   }
  // }


  Activity.query().insert(req.body)
  .returning('*')
  .then(activity => {
    if(activity) {
      // console.log('activity', activity)
      /**
       * Does the req object still exist after res.send? Yep: https://www.bennadel.com/blog/3275-you-can-continue-to-process-an-express-js-request-after-the-client-response-has-been-sent.htm
       */
      notifsCtrl.generateFromActivity(activity, req.io);
      res.send({ success: true, activity });

      // notifsCtrl.createFromActivity(activity, (result) => {
      //   if(result.success) {
      //     result.notifications.forEach(notification => {
      //       // console.log("Emitting Notification: ", notification)
      //       // Send notification to its user.
      //       req.io.to(notification._user).emit('receive_notification', notification)
      //     });
      //     console.log('result', result)
      //     res.send({ success: true, activity })
      //   } else {
      //     console.log('result', result)
      //     res.send({ success: true, message: "Activity created, but there was a problem creating notifications."});
      //   }
      // });
    } else {
      res.send({ success: false, message: "Could not save Activity"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating activity');

  const activityId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Activity.query()
  .findById(activityId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(activity => {
    console.log("Activity", activity)
    res.send({success: true, activity})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting activity");
  
  // TODO: needs testing and updating
  const activityId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM activities WHERE id = ' + activityId + ';'

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

exports.utilGenerateNotification = (
  // related table: activity table, client activity table, notification table
  // notification 
  user // user who generates the process 
  , fixedName // user for fixed name when user who generates the process is not loggedIn (optional) default null
  , _firm // id
  , _client // id
  , _notification // notification type (view, download, upload, request etc.)
  , text // 
  , content // content (optional) default null
  , workspaceLink // string or array (array for uploading files) for user link
  , portalLink // string or array (array for uploading files) for contact link
  , io // socket io
  , sendFirmEmail // boolean, if true send to user
  , sendClientEmail // boolean, if true send to contact
  , creator // creator (optional) default null
  , callback // response
) => {

  let fromUserString = "";
  user = user || {};

  // Add userId to these checks. If it's not there then we don't want to use the user info returned above because it is just the first user in the db.
  if(user && user.firstname && user.lastname) {
    fromUserString = `${user.firstname} ${user.lastname}`
  } else if(user && user._id) {
    fromUserString = user.username;
  } else if (fixedName) {
    fromUserString = `(${fixedName}})`;
  } else {
    // This means userId was undefined. Use placeholder info.
    fromUserString = "A user";
  }

  // user fixedName if user is not loggedIn
  if (user && user._id) {
    text = text.replace('%USER%', fromUserString);
  }

  let newActivity = {
    isReminder: true
    , link: workspaceLink
    , sendEmail: true
    , tex
    , _client
    , _firm
    , _user: user && user._id
  }

  Firm.query().findById(_firm)
    .then(firm => {
      // create new activity
      Activity.query()
        .insert(newActivity)
        .returning("*")
        .asCallback((err, activity) => {
          if (err && !activity) {
            // do nothing
            logger.error("utilGenerateNotification: failed to create activity", err);
          } else {
            
            if (sendFirmEmail) {
              // send to staff by client
              exports.generateFromActivity(firm, activity, _notification, io, fromUserString);
            }

            if (_client) {
              newActivity.link = portalLink;
              ClientActivity.query().insert(newActivity)
                .asCallback((err, clientActivity) => {
                  if (err && !clientActivity) {
                    logger.error("utilGenerateNotification: failed to create client activity", err);
                  } else {

                    if (sendClientEmail) {
                      exports.generateFromClientActivity(firm, clientActivity, _notification, io, fromUserString);
                    }
                  }
                });
            }
          }
        });
    });
}

exports.generateFromClientActivity = (firm, clientActivity, _notification, io, fromUserString = '%USER%') => {
  console.log("generating notification from (client) activity")

  Client.query()
    .findById(clientActivity._client)
    .asCallback((err, client) => {

      if (err && !client) {
        logger.error('ERROR: Client not found. ', err);
      } else {

        if (_notification && (client[_notification] || _notification === "notapplicable")) {


          
        }
      }
    });
}

exports.generateFromActivity = (firm, activity, _notification, io, fromUserString) => {
  if (activity._client) {
    staffClientsCtrl.utilGetByClientId(activity._client, (err, staffClients) => {
      if (!err && staffClients) {
        // add creator (optional)
        if (activity && activity._user && !staffClients.some(sc => sc._user === activity._user)) {
          staffClients.push({ _staff: null, _user: activity._user, sendNotifs: true });
        }
        async.map(staffClients, (staffUser, cb) => {
          if (!staffUser) {
            // do nothing
          } else if (!staffUser[_notification] && _notification !== "notapplicable") {
            // do nothing
          } else if (staffUser._user === activity._user) {            
            // do nothing
          } else if (staffUser._staff) {
            Staff.query().findById(staffUser._staff)
              .then(staff => {
                if (staff && staff.status !== "inactive") {
                  User.query().findById(staff._user)
                    .then(user => {
                      if (user && user.sendNotifEmails) {
                        let newNotification = {
                          _activity: activity._id
                          , _user: user._id
                          , content: activity.text.replace('%USER%', fromUserString)
                          , link: activity.link
                        };
                        Notification.query().insert(newNotification)
                          .returning("*")
                          .asCallback((err, notification) => {
                            if (!err && notification) {
                              io.to(notification._user).emit('receive_notification', notification);
                              // send email notification
                              const sendNotification = {
                                sender: brandingName.email.noreply
                                , link: notification.link
                                , content: notification.content
                                , subject: notification.content
                                , userlist: [user.username]
                                , firm
                              }
                              notifsCtrl.utilNotification(sendNotification, callback => {
                                logger.info("result: ", callback);
                              });
                            }
                          });
                      }
                    });
                }
              });
          } else {
            // creator send to without client

          }
          cb();
        });
      }
    });
  }
}

exports.createViewRequestSignature = (req, res) => {

  res.send({ success: true });

  if (req.params.quickTaskId) {

    ShareLink.query().where({
      _quickTask: req.params.quickTaskId
    }).first()
    .then(shareLink => {
      if (shareLink) {
        QuickTask.query().findById(req.params.quickTaskId).then(quickTask => {
          const userEmail = req.body.userEmail;
          const signer = quickTask.signingLinks.filter(user => user.signatoryEmail && user.signatoryEmail.toLowerCase() == userEmail)[0];
          if (quickTask && quickTask.signingLinks && userEmail && signer && !signer.first_viewed_at) {
            signer.first_viewed_at = DateTime.local();  
            quickTask.signingLinks = quickTask.signingLinks.map(user => user.signatoryEmail && user.signatoryEmail.toLowerCase() == userEmail ? signer : user);
            quickTask.signingLinks = JSON.stringify(quickTask.signingLinks);
    
            QuickTask.query().findById(quickTask._id).update(quickTask).returning("*").then(newQuickTasks => {
              if (newQuickTasks) {
                const contentText = req.user ? `%USER% viewed a signature request` : `${signer.signerName} viewed a signature request`;
                const newActivity = {
                  _user: req.user && req.user._id ? req.user._id : null
                  , _firm: newQuickTasks._firm
                  // , _client: newQuickTasks._client
                  , isReminder: false
                  , sendEmail: true
                  , text: contentText
                  // , link: `/firm/${newQuickTasks._firm}/workspaces/${newQuickTasks._client}/quick-tasks/quick-view/${newQuickTasks._id}`
                }

                if (newQuickTasks._client) {
                  newActivity._client = newQuickTasks._client;
                  newActivity.link = `/firm/${newQuickTasks._firm}/workspaces/${newQuickTasks._client}/quick-tasks/quick-view/${newQuickTasks._id}`;
                } else {
                  newActivity.link = "/request/signature/" + shareLink.hex;
                }

                let fromUserString = "";
                // Add userId to these checks. If it's not there then we don't want to use the user info returned above because it is just the first user in the db.
                if(signer) {
                  fromUserString = signer.signerName;
                } else if(req.user && req.user.firstname && req.user.lastname) {
                  fromUserString = `${req.user.firstname} ${req.user.lastname}`
                } else {
                  // This means userId was undefined. Use placeholder info.
                  fromUserString = "A user";
                }
    
                if (shareLink._client) {

                  // notify creator
                  if (shareLink.sN_viewSignatureRequest) {
                    StaffClient.query()
                    .where({ _client: shareLink._client, _user: shareLink._createdBy })
                    .first()
                    .then(staffClient => {
                      if (!staffClient) {
                        newActivity._user = shareLink._createdBy;
                        notifsCtrl.generateFromActivityNoClient(newActivity, req.io, newActivity.text);
                      }
                    });
                  }

                  Activity.query().insert(newActivity).returning("*").asCallback((err, activity) => {
                    if (activity) {
                      activity.shareLink = shareLink;
                      notifsCtrl.generateFromActivity(activity, req.io, fromUserString);
                    }
                  });
                } else {
                  // no activity need

                  console.log('test', shareLink)
                  newActivity.text = newActivity.text.replace('%USER%', fromUserString);

                  // notify creator
                  if (shareLink.sN_viewSignatureRequest) {
                    newActivity._user = shareLink._createdBy;
                    notifsCtrl.generateFromActivityNoClient(newActivity, req.io, newActivity.text);
                  }

                  // notify user location
                  if (shareLink._personal && shareLink._personal != shareLink._createdBy) {
                    newActivity._user = shareLink._personal;
                    notifsCtrl.generateFromActivityNoClient(newActivity, req.io, newActivity.text);
                  }
                }
              }
            });
          }
        });
      }
    });
  }
}

exports.createByUsernameFileUploader = (props) => {
  const { 
    req
    , user
    , files
    , receivers
    , fromMangobilling
    , uploadCompanyName
    , uploadEmailAddress
  } = props;
  console.log('uploadCompanyName', uploadCompanyName)
  console.log('uploadEmailAddress', uploadEmailAddress)
  if(!(files && files.length)) {
    logger.error('No files in request. Activity not created.');
  } else {
    const file = files && files.length && files[0];
    let fromUserString = ""
    if(user && user.firstname && user.lastname) {
      fromUserString = `${user.firstname} ${user.lastname}`
    } else if(user && user._id) {
      fromUserString = user.username;
    } else if (file && file.uploadName) {
      fromUserString = `(${file.uploadName})`;
    } else {
      // This means userId was undefined. Use placeholder info.
      fromUserString = !fromMangobilling ? "A user" : "A user (mangobilling)";
    }

    Firm.query()
      .findById(file._firm) 
      .then(firm => {

        Client.query()
          .findById(file._client)
          .then(client => {

            let firmUrl = appUrl;
            if(firm && firm.domain) {
              firmUrl = firm.domain;
            }
            
            console.log('client', client)
            let workspaceLink;
            let fileId;
            let companyName = uploadCompanyName;
            let otherContent = '';

            let linkText;
            let bottomContent;
            let title = brandingName.title === 'ImagineTime' ? 'ImagineShare' : brandingName.title;
            linkText = `View in ${title}`;
            let fileList = '';
            files.forEach(item => {
              let link = `http://${firmUrl}`;
              if (item && item._client) {
                if (item._folder) {
                  link += `/firm/${item._firm}/workspaces/${item._client}/files/${item._folder}/folder/${item._id}`;
                } else {
                  link += `/firm/${item._firm}/workspaces/${item._client}/files/${item._id}`;
                }
              } else if (item && item._personal) {
                if (item._folder) {
                  link += `/firm/${item._firm}/files/${item._personal}/personal/${item._folder}/folder/${item._id}`;
                } else {
                  link += `/firm/${item._firm}/files/${item._personal}/personal/${item._id}`;
                }
              } else {
                if (item._folder) {
                  link += `/firm/${item._firm}/files/public/${item._folder}/folder/${item._id}`
                } else {
                  link += `/firm/${item._firm}/files/public/${item._id}`;
                }
              }
              fileList += `<p style=""><a class="mcnButton " title="View in ${title}" href=${link} target="_self" style="font-weight: normal;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;">${item.filename}</a></p>`;
            });
            bottomContent = `<table class="mcnButtonContentContainer" cellspacing="0" cellpadding="0" border="0">
              <tbody>
                <tr>
                    <td class="mcnButtonContent" style="font-family: Helvetica; font-size: 18px; padding: 18px;" valign="middle" align="center">
                      ${fileList}
                    </td>
                </tr>
              </tbody>
            </table>`;

            if (client && client.name) {
              companyName = client.name;
            }

            console.log('companyName', companyName)

            if(uploadEmailAddress) {
              otherContent += `<br/>  
              <a href="mailto:${uploadEmailAddress}" 
                target="_blank"
                style="text-decoration: none !important; color: #222;">
                ${uploadEmailAddress}
              </a>`;
            }
   
            if (files && files.length > 1) {
              fileId = '?fIds=' + files.map(f => f._id).toString();
            } else {
              fileId = '/' + files[0]._id;
            }
            
            if (file && file._client) {
              if (file._folder) {
                workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files/${file._folder}/folder${fileId}`;
              } else {
                workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files${fileId}`;
              }
            } else if (file && file._personal) {
              if (file._folder) {
                workspaceLink = `/firm/${file._firm}/files/${file._personal}/personal/${file._folder}/folder${fileId}`;
              } else {
                workspaceLink = `/firm/${file._firm}/files/${file._personal}/personal${fileId}`;
              }
            } else {
              if (file._folder) {
                workspaceLink = `/firm/${file._firm}/files/public/${file._folder}/folder${fileId}`
              } else {
                workspaceLink = `/firm/${file._firm}/files/public${fileId}`;
              }
            }
    
            // send email notification
            const sendNotification = {
              sender: brandingName.email.noreply
              , link: workspaceLink
              , content: files.length > 1 ? `${fromUserString} uploaded ${files.length} files` : `${fromUserString} uploaded a file`
              , subject: files.length > 1 ? `${fromUserString} uploaded ${files.length} files` : `${fromUserString} uploaded a file`
              , name: `${fromUserString} | ${firm && firm.name}`
              , userlist: receivers
              , firm
              , extra: otherContent
              , linkText
              , bottomContent
            }

            if (companyName) {
              sendNotification.subject += ` | ${companyName}`;
            }

            notifsCtrl.utilNotification(sendNotification, notifCallback => {
              // callback("sent success", notifCallback);
              logger.info("result: ", notifCallback);
            });
          });
      });
  }
}