/**
 * Sever-side controllers for Note.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Note
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const permissions = require('../../global/utils/permissions.js');
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const async = require('async');
let logger = global.logger;

// import controller from resource 
const activitiesCtrl = require('../activity/activitiesController');
const notificationsController = require('../notification/notificationsController');

// define "safe" user fields to return to the api
const safeUserFields = [
    '_id', 'username', 'firstname', 'lastname'
    , '_primaryAddress', '_primaryPhone', 'onBoarded', 'admin'
    , 'created_at', 'updated_at', 'sendNotifEmails'
    , 'sharedSecretPrompt', 'sharedSecretAnswer'
    , 'firstLogin'
  ]


// import model
const TaskActivity = require('./TaskActivityModel');
const Client = require('../client/ClientModel');
const Request = require('../request/RequestModel');
const RequestTask = require('../requestTask/RequestTaskModel');
const Activity = require('../activity/ActivityModel');
const ClientActivity = require('../clientActivity/ClientActivityModel');
const Notification = require('../notification/NotificationModel');
const Firm = require('../firm/FirmModel');
const User = require('../user/UserModel');

exports.list = (req, res) => {
  TaskActivity.query()
  .then(data => {
    res.send({success: true, data })
  })
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
    TaskActivity.query()
    .where(query)
    .then(json => {
      console.log("taskActivitys", json);

      if (json) {
        async.map(json, (activity, cb) => {
          User.query()
          .select(...safeUserFields)
          .findById(activity._user)
          .then(user => {
              activity.user = user;
              User.query()
              .select(...safeUserFields)
              .findById(activity._createdBy)
              .then(creator => {
                  activity.creator = creator;
                  cb(null, activity);
              });
          });
        }, (err, result) => {
            console.log("mapps", err, result);
            res.send({ success: true, taskActivitys: result });
        });
      } else {
          res.send({ success: true, taskActivitys: [] });
      }
    })
  }
}

exports.getById = (req, res) => {
  TaskActivity.query().findById(req.params.id)
  .then(requestTask => {
    if(requestTask) {
      res.send({success: true, requestTask})
    } else {
      res.send({success: false, message: "Task activity not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get task activity schema ');
  res.send({success: true, schema: TaskActivity.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get task activity default object');
  res.send({success: true, defaultObj: TaskActivity.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  const requestId = req.body._request;
  req.body._createdBy = req.user._id;
  delete req.body._request;
  TaskActivity.query().insert(req.body)
    .returning("*")
    .asCallback((err, taskActivity) => {

      if (err && !taskActivity) {
        // for comment message
        res.send({ success: false, message: "Error: please try again later." });
      } else {

        res.send({ success: true, taskActivity });
        if (requestId) {
          Request.query().findById(requestId)
            .then(request => {

              if (request && request._id && request._client && request._firm) {
                // notify user connected in this client
                activitiesCtrl.utilCreateFromResource(
                  req.user._id, request._firm, request._client
                  , `%USER% commented in request task`
                  , `/firm/${request._firm}/workspaces/${request._client}/request-list/${request._id}/published/task-activity/${taskActivity._requestTask}/activity`
                  , false, true
                  , `%USER% commented in request task`
                  , `/portal/${request._client}/request-task/${taskActivity._requestTask}/activity`
                  , false, true
                  , req.io
                  , result => console.log(result)
                )
              }
            });
        }
      }
    });
}

exports.requestChanges = (req, res) => {
  const requestId = req.body._request;
  req.body._createdBy = req.user._id;
  delete req.body._request;
  TaskActivity.query().insert(req.body)
    .returning("*")
    .asCallback((err, taskActivity) => {

      if (err && !taskActivity) {
        // for comment message
        res.send({ success: false, message: "Error: please try again later." });
      } else {

        res.send({ success: true, taskActivity });
        if (requestId && taskActivity && taskActivity._requestTask) {
          Request.query().findById(requestId)
            .then(request => {

              Firm.query().findById(request._firm)
                .then(firm => {

                  RequestTask.query().findById(taskActivity._requestTask)
                    .then(requestTask => {
                      if (request && request._id && request._client && request._firm && requestTask && requestTask._id) {
    
                        const contentText = "%USER% request changes in a request task"
                        const activity = {
                          isReminder: true
                          , link: `/firm/${request._firm}/workspaces/${request._client}/request-list/${request._id}/published/task-activity/${requestTask._id}/activity`
                          , sendEmail: true
                          , text: contentText
                          , _firm: request._firm
                          , _client: request._client
                          , _user: req.user._id // req.user._id
                        }
                  
                        let fromUserString = "";
                        // Add userId to these checks. If it's not there then we don't want to use the user info returned above because it is just the first user in the db.
                        if(req.user && req.user._id && req.user.firstname && req.user.lastname) {
                          fromUserString = `${req.user.firstname} ${req.user.lastname}`
                        } else if(req.user && req.user.username) {
                          fromUserString = req.user.username;
                        } else {
                          // This means userId was undefined. Use placeholder info.
                          fromUserString = "A user";
                        }

                        // add to the activity log, published request task
                        Activity.query()
                          .insert(activity)
                          .returning("*")
                          .then(resActivity => {
                
                              if (resActivity) {
                
                                const clientActivity = activity;
                                clientActivity.link = `/portal/${requestTask._client}/request-task/${requestTask._id}/activity`; // requestTask.url
                                clientActivity.text = "%USER% request changes in a request task";

                                ClientActivity.query()
                                .insert(clientActivity)
                                .returning("*")
                                .then(resClientActivity => {
  
                                      // notify all assignee 
                                    async.map(requestTask.assignee, (assignee, cb) => {
                  
                                      if (assignee && assignee._id) {

                                          // add to notification
                                          const newNotification = {};
                                          newNotification._clientActivity = resClientActivity._id;
                                          newNotification._user = assignee._id;
                                          newNotification.content = clientActivity.text.replace('%USER%', fromUserString) // customize output
                                          newNotification.link = clientActivity.link;
                                          // req.io.to(assignee._id).emit('receive_notification', newNotification);

                                          // call email 
                                          Notification.query()
                                              .insert(newNotification)
                                              .returning('*')
                                              .then(notification => {
        
                                                  // send email notification
                                                  const sendNotification = {
                                                      sender: ""
                                                      , link: newNotification.link  // notification.link
                                                      , content: notification.content
                                                      , subject: notification.content
                                                      , userlist: [assignee.username]
                                                      , firm: firm
                                                      , note: req.body.note
                                                  }
                                                  req.io.to(assignee._id).emit('receive_notification', newNotification);
                                                  notificationsController.utilNotification(sendNotification, resultNotification => {
                                                      console.log(resultNotification);
                                                  });
                                              });
                                      }
                                      cb();
                                    });
                                  });
                              }
                        });
                      }
                  });
                });
          });
        }
      }
    });
}