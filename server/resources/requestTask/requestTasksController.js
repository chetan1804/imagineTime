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

// import controller from resource 
const permissions = require('../../global/utils/permissions.js');
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const async = require('async');
const DateTime = require('luxon').DateTime;

const RequestTask = require('./RequestTaskModel');
const User = require('../user/UserModel');
const ClientActivity = require('../clientActivity/ClientActivityModel');
const Activity = require('../activity/ActivityModel');
const Firm = require('../firm/FirmModel');
const Notification = require('../notification/NotificationModel');
const Staff = require('../staff/StaffModel');
const TaskActivity = require('../taskActivity/TaskActivityModel');
const Client = require('../client/ClientModel');
const Request = require('../request/RequestModel');

const notificationsController = require('../notification/notificationsController');
const staffClientsController = require('../staffClient/staffClientsController');
const filesController = require('../file/filesController');

const requestTaskDAO = require('./requestTaskDAO');

const CSVUtils = require('../../global/utils/CSVUtils');
const stringUtils = require('../../global/utils/stringUtils.js');
const { getSearchObject } = require('../searchUtil');
const staffCtrl = require('../staff/staffController');

let logger = global.logger;

exports.search = (req, res) => {
  //logger.debug(getFileIdentifier(), 'requesting user id: ', req.user._id);
  //logger.debug(getFileIdentifier(), 'request body: ', req.body);
  //logger.debug(getFileIdentifier(), 'req.header("Accept")', req.header('Accept'));
  let isAcceptCSV = req.header('Accept') === 'text/csv';
  
  const searchObj = getSearchObject(req.body);
  //logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId);
  if(!searchObj.firmId) {
      res.send({success: false, message: 'firmId is required.'})
      return;
  }
  if(isAcceptCSV || searchObj.ignoreLimit === true) {
    searchObj.includeCount = false;
    searchObj.ignoreLimit = true;
  }
  //staffCtrl.utilGetLoggedInByFirm(100, searchObj.firmId, result => {
  staffCtrl.utilGetLoggedInByFirm(req.user._id, searchObj.firmId, result => {
    if(!result.success) {
      logger.error(getFileIdentifier(), 'Error, Problem fetching logged in staff object. Unable to complete request.')
      res.send(result)
    }
    else {
      if(isAcceptCSV) {
        searchObj.includeCount = false;
        searchObj.orderBy = 'id';
        searchObj.sortOrderAscending = true;
      }
      requestTaskDAO.search(searchObj).then(result => {
        result.list.forEach((item) => {
          item['userName'] = stringUtils.concatenate(item.userFirstName, item.userLastName, ' ', true);
          item['createdByName'] = stringUtils.concatenate(item.createdByFirstName, item.createdByLastName, ' ', true);
          item['totalUploadedFiles'] = item._returnedFiles && item._returnedFiles.length || 0;

          if(isAcceptCSV) {
            if(!!item.createdDateTime) {
              item.createdDateTime = DateTime.fromMillis(item.createdDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if(!!item.updatedDateTime) {
              item.updatedDateTime = DateTime.fromMillis(item.updatedDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if(!!item.dueDate) {
              item.dueDate = DateTime.fromMillis(item.dueDate.getTime()).toFormat('yyyy-LL-dd');
            }
            if(!!item.responseDate) {
              item.responseDate = DateTime.fromMillis(item.responseDate.getTime()).toFormat('yyyy-LL-dd');
            }

            delete item.uploadedFilesCount;
            delete item._returnedFiles;
            delete item.userFirstName;
            delete item.userLastName;
            delete item.createdByFirstName;
            delete item.createdByLastName;
          }
        });
        if(isAcceptCSV) {
          CSVUtils.toCSV(result.list)
          .then(csv => {
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader('Content-Disposition', 'attachment; filename=RequestTasks.csv');
              res.send(csv);
          })
          .catch(err => {
              logger.error('Error: ', err);
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader('Content-Disposition', 'attachment; filename=InternalError.csv');
              res.status(500).send(err);
          });
        }
        else {
          res.send({success: result.success, results:result.list, totalCount: result.totalCount});
        }
      });
    }
  });
}

exports.bulkDelete = (req, res) => {
  const requestTaskIds = req.body;
  logger.debug('bulk delete request list task ids=', requestTaskIds);

  async.map(requestTaskIds,
    (requestTaskId, callback) => {
      deleteRequestTask(requestTaskId, req.user._id, result => {
        if(result.success) {
          return callback(null, {id: requestTaskId, message: ''});
        }
        else {
          return callback(null, {id: requestTaskId, message: result.message});
        }
      });
    },
    (err, list) => {
      logger.debug('success request list task bulk delete', err, list);
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

const deleteRequestTask = (requestTaskId, loggedInUserId, callback) => {
  logger.debug('delete request list task id=', requestTaskId);
  const columns = [{id:'requesttask._id'}, {firmId:'requestList._firm'}];
  RequestTask.query()
  .innerJoin('request AS requestList', 'requesttask._request', 'requestList._id')
  .where({'requesttask._id': requestTaskId})
  .columns(columns)
  .then(requestTasks => {
    if(requestTasks) {
      staffCtrl.utilGetLoggedInByFirm(loggedInUserId, requestTasks[0].firmId, staffResult => {
        if(!staffResult.success) {
          logger.error("Permission issues: Logged in user[id: " + loggedInUserId + "] is not from the same firm[id: " + requestTasks[0].firmId + "].")
          return callback({success: false, message: 'You do not have permission to delete this request list task.'})
        } else {
          requestTaskDAO.delete(requestTasks[0].id, (result) => {
            return callback(result);
          });
        }
      });
    } else {
      return callback({success: false, message: 'Invalid request list task'})
    }
  });
}

exports.list = (req, res) => {
  RequestTask.query()
  .then(data => {
    res.send({success: true, data })
  })
}

exports.listByRefs = (req, res) => {
  logger.error("res debug 1")
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
    RequestTask.query()
    .where(query)
    .then(requestTasks => {
      console.log("requestTasks", requestTasks);
      res.send({ success: true, requestTasks })
    })
  }
}

exports.getById = (req, res) => {
  RequestTask.query().findById(req.params.id)
  .then(requestTask => {
    if(requestTask && requestTask._id) {
      requestTask.totalUploadedFiles = requestTask._returnedFiles.length
      res.send({success: true, requestTask})
    } else {
      res.send({success: false, message: "Request task not found"})
    }
  });
}

exports.getByHex = (req, res) => {
  RequestTask.query().where({ hex: req.params.hex })
  .first()
  .then(requestTask => {
    if(requestTask && requestTask._client) {
      Client.query().findById(requestTask._client)
        .then(client => {
          if (client && client._firm) {
            requestTask.client = client;
            Firm.query().findById(client._firm)
              .then(firm => {
                requestTask.firm = firm;
                res.send({success: true, requestTask, authenticated: false });
              });
          } else {
            res.send({success: true, requestTask, authenticated: false });
          }
        });
    } else if (requestTask) {
      res.send({success: true, requestTask, authenticated: false });
    } else {
      res.send({success: false, message: "Request task not found"});
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get request schema ');
  res.send({success: true, schema: RequestTask.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get note default object');
  res.send({success: true, defaultObj: RequestTask.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  const { _firm, assignee, _client, _request, action } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
    } else {

      delete req.body._firm;
      delete req.body.action;

      const hex = Math.floor(Math.random()*16777215).toString(16)
        + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
        + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
        + Math.floor(Math.random()*16777215).toString(16); // we can make this bigger if needed?
      req.body._createdBy = req.user._id;
      req.body.hex = hex;
      req.body.url = `https://${appUrl}/request/request-task/${hex}`;
      req.body.assignee = JSON.stringify(assignee);
      req.body.dueDate = new Date(req.body.dueDate);

      Request.query().findById(req.body._request).then(request => {
        if (!request) {
          res.send({ success: false, message: "Request list not found." });
        } else {
          request.tasks++;
          Request.query().findById(req.body._request).update(request).returning("*")
            .asCallback((err, newRequest) => {
              if (err && !newRequest) {
                res.send({ success: false, message: "Failed to create." });
              } else {
                RequestTask.query().insert(req.body).returning("*")
                .asCallback((err, requestTask) => {
                  if (err && !requestTask) {
                    res.send({ success: false, message: "Failed to create." });
                  } else {

                    res.send({ success: true, requestTask, request: newRequest });

                    const newActivity = {
                      _createdBy: req.user._id
                      , _requestTask: requestTask._id
                    }
                    async.map(requestTask.assignee, (assignee, cb)  => {
                      if (assignee._id) {
                        newActivity._user = assignee._id;
                        newActivity.text = `assigned %USER%`;
                      } else {
                        newActivity.text = `assigned ${assignee.firstname} ${assignee.lastname}`;
                      }
                      TaskActivity.query().insert(newActivity)
                        .returning("*")
                        .then(activity => {
                          logger.info("create new task activity", activity);
                          cb();
                        });
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

exports.update = (req, res) => {
  const { _firm, _client, assignee, status, action } = req.body;

  permissions.utilCheckFirmPermission(req.user, _firm, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
    } else {
      delete req.body._firm;
      delete req.body.action;
      req.body.assignee = JSON.stringify(assignee);
      
      if (action === "published" || action === "completed") {
        req.body.status = action;
      }
      
      RequestTask.query().findById(req.body._id)
        .then(OldRequestTask => {
    
          if (!OldRequestTask) {
            res.send({ success: false, message: "Request task not found" });
          } else {
    
            Request.query().findById(OldRequestTask._request).then(request => {

              if (!request) {
                res.send({ success: false, message: "Request not found" });
              } else {
                delete req.body.totalUploadedFiles;
                RequestTask.query()
                  .findById(req.body._id)
                  .update(req.body)
                  .returning("*")
                  .asCallback((err, requestTask) => {
                    if (err && !requestTask) {
                      logger.error('requestTaskController.update -', err);
                      res.send({ success: false, message: "Failed to update." });
                    } else {
                      res.send({ success: true, requestTask });
              
                      if (action === "published" || action === "completed") {
                        
                        const text = action === "published" ? "has published a request task." : "request task has been completed.";

                        const newActivity = {
                          _createdBy: req.user._id
                          , _requestTask: requestTask._id
                          , text: text
                        }
                        TaskActivity.query().insert(newActivity)
                          .asCallback((err, activity) => {
                            if (err && !activity) {
                              console.log("error", err);
                            } else {
                              Firm.query().findById(_firm).then(firm => {
                                  if (!firm) {
                                      console.log("Firm not found");
                                  } else {
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
                                    const contentText = `%USER% ${text}`;
                                    exports.requestTaskNotification(true, req, requestTask, firm, _client, fromUserString, contentText, action, (err, callback) => {                                
                                      console.log("info", callback);
                                    });

                                    if (action === "completed") {
                                      exports.requestTaskNotification(false, req, requestTask, firm, _client, fromUserString, contentText, action, (err, callback) => {                                
                                        console.log("info", callback);
                                      });
                                    }
                                  }
                              });
                            }
                          });
                      } else {
                        async.map(OldRequestTask.assignee, (assignee, cb) => {
                          if (!requestTask.assignee.some(a => a._id && a._id === assignee._id) || !requestTask.assignee.some(a => a.username && a.username === assignee.username)) {
                            const newActivity = {
                              _createdBy: req.user._id
                              , _requestTask: requestTask._id
                            }
                            if (assignee._id) {
                              newActivity._user = assignee._id;
                              newActivity.text = `removed %USER%`;
                            } else {
                              newActivity.text = `removed ${assignee.firstname} ${assignee.lastname}`;
                            }
                            TaskActivity.query().insert(newActivity)
                              .returning("*")
                              .then(activity => {
                                logger.info("create new task activity", activity);
                                cb(null);
                              });
                          } else {
                            cb(null);
                          }
                        }, err => {
                          if (!err) {
                            async.map(requestTask.assignee, (assignee, cb) => {
                              if (!OldRequestTask.assignee.some(a => a._id && a._id === assignee._id) || !OldRequestTask.assignee.some(a => a.username && a.username === assignee.username)) {
                                const newActivity = {
                                  _createdBy: req.user._id
                                  , _requestTask: requestTask._id
                                }
                                if (assignee._id) {
                                  newActivity._user = assignee._id;
                                  newActivity.text = `assigned %USER%`;
                                } else {
                                  newActivity.text = `assigned ${assignee.firstname} ${assignee.lastname}`;
                                }
                                TaskActivity.query().insert(newActivity)
                                  .returning("*")
                                  .then(activity => {
                                    logger.info("create new task activity", activity);
                                  });
                              }
                              cb();
                            })
                          }
                        });
                      }
                    }
                  });
              }
            });
          }
        });
    }
  });
}

exports.bulkUpdate = (req, res) => {
  const { _firm, requestTask, requestTasksIds, _client } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
    } else {

      requestTask.assignee = JSON.stringify(requestTask.assignee);
      delete req.body.totalUploadedFiles;
      RequestTask.query()
        .whereIn("_id", requestTasksIds)
        .update(requestTask)
        .returning("*")
        .then(requestTasks => {
          if (!requestTasks) {
            res.send({ success: false, message: "Failed to update." });
          } else {
            res.send({ success: true, requestTasks });
            
          }
        });
    }
  });
}

exports.bulkUpdateStatus = (req, res) => {
  const { firmId, requestListId, requestTaskIds, status } = req.body;
  if(status !== 'unpublished' && status !== 'published' && status !== 'completed') {
    res.send({ success: false, message: "Invalid request." });
    return;
  }

  permissions.utilCheckFirmPermission(req.user, firmId, "access", permission => {
    if(!permission) {
      // User doesn't have specific permission, only allow them to update the _returnedFiles array.
      res.send({ success: false, message: "You do not have permission to perform this action." });
      return;
    }
    Request.query()
    .findById(requestListId)
    .then(requestList => {
      if (!requestList) {
        res.send({ success: false, message: "Invalid request list." });
      } else {
        RequestTask.query()
        .whereIn("_id", requestTaskIds)
        .andWhere("_request", requestListId)
        .update({status: status})
        .returning("*")
        .then(requestTasks => {
          if (!requestTasks) {
            res.send({ success: false, message: "Failed to update." });
          } else {
            res.send({ success: true });
          }
        })
        .catch(err => {
          res.send({ success: false, message: "Internal server error." });
        })
      }
    })
    .catch(err => {
      res.send({ success: false, message: "Internal server error." });
    })
  });
}

exports.requestTaskNotification = (fromStaff, req, requestTask, firm, _client, fromUserString, contentText, action, callback) => {
    
  if (fromStaff) {

      const activity = {
          isReminder: false
          , link: `/firm/${firm._id}/workspaces/${_client}/request-list/${requestTask._request}/${action}/task-activity/${requestTask._id}/detail`
          , sendEmail: true
          , text: contentText
          , _firm: firm._id
          , _client: _client
          , _user: req.user._id // req.user._id
      }

      // add to the activity log, published request task
      Activity.query().insert(activity)
        .asCallback((err, resActivity) => {
          if (err && !resActivity) {
            console.log("error", err);
          } else {
            const clientActivity = activity;
            clientActivity.link = `/portal/${requestTask._client}/request-task/${requestTask._id}` // requestTask.url;
            clientActivity.text = action === "published" ? "%USER% requested you to complete the task" : contentText;
            console.log("clientActivity", clientActivity)

            // add to the clientActivity log
            ClientActivity.query().insert(clientActivity)
              .asCallback((err, resClientActivity) => {
                
                if (err && !resClientActivity) {
                  console.log("error", err);
                } else {
                  // notify all assignee 
                  async.map(requestTask.assignee, (assignee, cb) => {
                    
                    if (assignee && assignee._id) {
                      
                      // add to notification
                      const newNotification = {};
                      newNotification._clientActivity = resClientActivity._id;
                      newNotification._user = assignee._id;
                      newNotification.content = resClientActivity.text.replace('%USER%', fromUserString) // customize output
                      newNotification.link = resClientActivity.link;
                      req.io.to(assignee._id).emit('receive_notification', newNotification);

                      // call email 
                      Notification.query()
                          .insert(newNotification)
                          .returning('*')
                          .then(notification => {

                              // send email notification
                              const sendNotification = {
                                  sender: ""
                                  , link: `/request/request-task/${requestTask.hex}`  // notification.link
                                  , content: notification.content
                                  , subject: notification.content
                                  , userlist: [assignee.username]
                                  , firm: firm
                              }
                              req.io.to(assignee._id).emit('receive_notification', newNotification);
                              notificationsController.utilNotification(sendNotification, resultNotify => {
                                  console.log(resultNotify);
                              });
                          });
                    }
                    cb();
                  });
                }
            });
          }
        });
  } else {
    staffClientsController.utilGetByClientId(_client, (err, staffClients) => {
      if(err) {
        logger.error('Error finding staffClients.', err)
      } else {

        if (requestTask && requestTask._createdBy && staffClients && !staffClients.some(sc => sc._user === requestTask._createdBy)) {
          staffClients.push({
            _staff: null
            , _user: requestTask._createdBy
            , sendNotifs: true
          });
        }

        async.map(staffClients, (staffClient, cb) => {

          if (staffClient._user === req.user._id) {
            // do nothing
          } else if (staffClient.sendNotifs) {

            Staff.query()
            .where({ _id: staffClient._staff })
            .first()
            .then(staff => {
              logger.error("debug 1", staff)

              if ((!staff && !staffClient._staff) || (staff && staff.status != "inactive")) {
                User.query().findById(staff._user)
                  .then(user => {
                    logger.error("user", user);

                    if (user && user.sendNotifEmails) {
                      const activity = {
                        isReminder: false
                        , link: `/firm/${firm._firm}/workspaces/${_client}/request-list/${requestTask._request}/published/task-activity/${requestTask._id}/upload`
                        , sendEmail: true
                        , text: contentText
                        , _firm: firm._id
                        , _client: _client
                        , _user: req.user._id
                      }

                      // add to the activity log, published request task
                      Activity.query()
                          .insert(activity)
                          .returning("*")
                          .then(resActivity => {
                              if (resActivity) {

                                const newNotification = {};
                                newNotification._activity = resActivity._id;
                                newNotification._user = user._id;
                                newNotification.content = resActivity.text.replace('%USER%', fromUserString) // customize output
                                newNotification.link = resActivity.link;

                                // call email 
                                Notification.query()
                                .insert(newNotification)
                                .returning('*')
                                .then(notification => {

                                    // send email notification
                                    const sendNotification = {
                                        sender: ""
                                        , link: notification.link  // notification.link
                                        , content: notification.content
                                        , subject: notification.content
                                        , userlist: [user.username]
                                        , firm: firm
                                    }
                                    req.io.to(user._id).emit('receive_notification', newNotification);
                                    notificationsController.utilNotification(sendNotification, resultNotify => {
                                        console.log(resultNotify);
                                    });
                                });
                              }
                          });
                      }
                  });
              }
            });
          }
          cb();
        });
      }
    });
  }
}

exports.portalRequestTask = (req, res) => {
  if (req.user) {
    RequestTask.query()
      .where({ _client: req.params.clientId })
      .whereNot({ status: "unpublished" })
      .then(requestTasks => {
        async.filter(requestTasks, (requestTask, cb) => {
          if (requestTask.assignee.length && requestTask.assignee.some(user => user._id == req.user._id || user.username == req.user.username)) {
            cb(null, requestTask);
          } else {
            cb(null, null);
          }
        }, (err, result) => {
          res.send({success: true, requestTasks: result })
        });
      });
  } else {
    res.send({success: false, message: "Request task not found"})
  }
}

exports.countNewUploadedFiles = (newTask, OldTask) => {
  Request.query().findById(newTask._request).then(request => {

    if (!request) {
      console.log("request not found");
    } else {

      const newFilesUploaded = OldTask && OldTask._returnedFiles && newTask._returnedFiles ? newTask._returnedFiles.length - OldTask._returnedFiles.length : 0;

      request.uploadedFiles += newFilesUploaded;
      Request.query().findById(request._id).update(request).returning("*")
        .asCallback((err, newRequest) => {

          if (err && !newRequest) {
            console.log("err newRequest", err)
          } else {
            console.log("success")
          }
        });
      }
  });
}

exports.updatebyClientUser = (req, res) => {

  const { _firm } = req.body;

  Firm.query().findById(_firm)
    .then(firm => {

      if (!firm) {
        res.send({ success: false, message: "Firm not found" });
      } else {
        let newUser = req.user && req.user._id ? req.user : req.body.user;
        if (newUser && newUser.username) {
      
          RequestTask.query().findById(req.body._id)
          .then(OldRequestTask => {
            

            if (OldRequestTask) {
              exports.countNewUploadedFiles(req.body, OldRequestTask);
            }

            if (!OldRequestTask && !OldRequestTask.assignee.some(ass => ass.username === newUser.username)) {
              res.send({ success: false, message: "You do not have permission to perform this action." });
            } else if (OldRequestTask.status === "completed") {
              res.send({ success: false, message: "Task already completed" });
            } else {


              Request.query().findById(OldRequestTask._request).then(request => {
                if (!request) {
                  res.send({ success: false, message: "Request no found" });
                } else {

                  if (!OldRequestTask.responseDate) {
                    req.body.responseDate = DateTime.local();
                  }
          
                  req.body.assignee = OldRequestTask.assignee.map(assignee => {
                    if (newUser.username === assignee.username) {
                      assignee.responseDate = DateTime.local();
                      newUser = req.user && req.user._id ? req.user : assignee;
                      req.user = req.user && req.user._id ? req.user : assignee;
                    }
                    return assignee;
                  });
                  
                  delete req.body.user;
                  delete req.body._firm;
                  delete req.body.client;
                  delete req.body.firm;
                  delete req.body.totalUploadedFiles;
                  req.body.assignee = JSON.stringify(req.body.assignee);
                  RequestTask.query().findById(req.body._id).update(req.body).returning("*")
                    .asCallback((err, requestTask) => {
          
                      if (err && !requestTask) {
                        logger.error("err", err)
                        res.send({ success: false, message: "Failed to update" });
                      } else {
                        
                        const newFilesId = requestTask._returnedFiles.filter(fileId => !OldRequestTask._returnedFiles.includes(fileId));
                        const preffixText = newFilesId.length > 1 ? "uploaded new files" : "uploaded a file";
    
                        // insert task
                        TaskActivity.query().insert({
                          text: preffixText
                          , _createdBy: req.user ? req.user._id : null
                          , _file: newFilesId
                          , _requestTask: requestTask._id
                        }).returning("*")
                          .then(taskActivity => {
                            logger.info("create new task activity", taskActivity);
                            if (taskActivity) {
                              res.send({ success: true, requestTask, taskActivity });
                            } else {
                              res.send({ success: true, requestTask });
                            }
                          });
    
                        if (requestTask._client) {
                          const newActivity = {
                            isReminder: false
                            , link: `/firm/${_firm}/workspaces/${requestTask._client}/request-list/${requestTask._request}/published/task-activity/${requestTask._id}/upload`
                            , sendEmail: true
                            , text: `%USER% ${preffixText} from request task`
                            , _client: requestTask._client
                            , _firm
                            , _user: req.user._id
                          }
                          let fromUserString = "";
                          // Add userId to these checks. If it's not there then we don't want to use the user info returned above because it is just the first user in the db.
                          if(req.user && req.user.firstname && req.user.lastname) {
                            fromUserString = `${req.user.firstname} ${req.user.lastname}`
                          } else if(req.user && (req.user._id || req.user.username)) {
                            fromUserString = req.user.username;
                          } else {
                            // This means userId was undefined. Use placeholder info.
                            fromUserString = "A user";
                          }
                          if (!(req.user && req.user._id)) {
                            newActivity.text = newActivity.text.replace('%USER%', fromUserString);
                          }
          
                          Activity.query().insert(newActivity)
                            .asCallback((err, activity) => {
                              
                              if (err && !activity) {
                                logger.error("newActivity error", err);
                              } else {
                                activity.link = `/portal/${requestTask._client}/request-task/${requestTask._id}/upload`
                                ClientActivity.query().insert(activity)
                                  .asCallback((err, clientActivity) => {
    
                                    if (err && !clientActivity) {
                                      logger.error("new clientActivity error", err);
                                    } else {
                                      logger.error("newActivity", newActivity);
                                      // notify user
                                      staffClientsController.utilGetByClientId(requestTask._client, (err, staffClients) => {
                                        if(err) {
                                          logger.error('Error finding staffClients.', err)
                                        } else {
                                          
                                          // add creator
                                          if (!staffClients.some(staffClient => staffClient._user === requestTask._createdBy)) {
                                            staffClients.push({
                                              _user: requestTask._createdBy
                                              , sendNotifs: true
                                              , sN_upload: true
                                              , _staff: null
                                            });
                                          }
                                          async.map(staffClients, (staffClient, cb) => {
                                            if (staffClient.sN_upload) {
                                              Staff.query().where({ _id: staffClient._staff,  })
                                              .first()
                                              .then(staff => {
                                                if (!(staff && staffClient._staff) || (staff && staff.status != "inactive")) {
                                                  User.query().findById(staffClient._user)
                                                    .then(user => {
                                                      if (user && user.sendNotifEmails) {
                                                        
                                                        // add to notification
                                                        const newNotification = {};
                                                        newNotification._activity = activity._id;
                                                        newNotification._user = user._id;
                                                        newNotification.content = newActivity.text.replace('%USER%', fromUserString) // customize output
                                                        newNotification.link = newActivity.link;
                                                        req.io.to(user._id).emit('receive_notification', newNotification);
    
                                                        Notification.query().insert(newNotification)
                                                        .returning("*")
                                                        .asCallback((err, notification) => {
                
                                                          if (!err && notification) {
                                                            
                                                            const sendNotification = {
                                                              sender: ""
                                                              , link: notification.link
                                                              , content: notification.content
                                                              , subject: notification.content
                                                              , userlist: [user.username]
                                                              , firm
                                                            }
                                                            notificationsController.utilNotification(sendNotification, callback => {
                                                              logger.info(callback);
                                                            });
                                                          }
                                                        });
                                                      }
                                                    });
                                                }
                                              });
                                            }
                                            cb();
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
              });
            }
          });
        } else {
          res.send({ success: false, message: "User not found" });
        }
      }
    });
}

exports.uploadFiles = (req, res) => {
  // allow uploading files from the sharelinks controller
  RequestTask.query()
  .where({
    hex: req.params.hex
  })
  .first()
  .asCallback((err, requestTask) => {
    if(err || !requestTask) {
      logger.error("Error!", err);
      res.send({success: false, message: "Matching request task link not found. 0xA."})
    } else {
      logger.info('found share link.')
      if (requestTask._client) {
        filesController.utilCreateFile(req, res);
      } else {
        filesController.utilCreateFile(req, res, requestTask);
      }
    }
  })
}

function getFileIdentifier() {
  return 'requestTaskController -';
}
