/**
 * Sever-side controllers for QuickTask.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the QuickTask
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

 const axios = require('axios');
 const { raw } = require('objection');
 
 // libraries
 const File = require('../file/FileModel')
 const Firm = require('../firm/FirmModel');
 const QuickTask = require('./QuickTaskModel');
 const User = require('../user/UserModel');
 const Notification = require('../notification/NotificationModel');
 const ShareLink = require("../shareLink/ShareLinkModel");
 const Activity = require('../activity/ActivityModel');
 const DocumentTemplate = require('../documentTemplate/DocumentTemplateModel');
 
 // import controller from resource 
 const fileActivityCtrl = require('../fileActivity/fileActivityController');
 const filesCtrl = require('../file/filesController');
 const activitiesCtrl = require('../activity/activitiesController');
 const staffCtrl = require('../staff/staffController');
 const notificationsCtrl = require('../notification/notificationsController');
 const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
 const async = require('async');
 const assureSign = require('../../global/utils/assureSign')
 const permissions = require('../../global/utils/permissions.js');
 
 const fileUtil = require('../../global/utils/fileUtils.js');
 const StaffClient = require('../staffClient/StaffClientModel');
 const Client = require('../client/ClientModel');
 const sendEmail = require('../shareLink/shareLinksController');
 const brandingName = require('../../global/brandingName').brandingName;
 
 let logger = global.logger;
 
 const mangobilling = require('../../global/constants').mangobilling;
 
 const safeUserFields = [
   '_id', 'username', 'firstname', 'lastname'
 ]
 
 /**
  * This logic may have to be altered for quicktasks. Also may need to update activities / clientActivities controller.
  */
  exports.utilCheckAndGenerateActivity = (user = {}, io, initialObj = {}, finalObj, sendClientEmail = false, signedFileHex = "", req = {}, callback = () => {}) => {
    console.log("client task utilCheckAndGenerateActivity 2")
    console.log(initialObj, finalObj)
    console.log("debug check")
 
    console.log('req.body quicktask', req.body);
   // this is the first one, but similar util should be copied for other resources as well
   
   /**
    * general:
    * see notes in activitiesController.utilCreateFromResource
    * this logic will determine whether to create an activity based on the resource changes
    * callback is optional and probably won't be used much (we will go ahead and return to the user before this)
    * initialObj is also optional (might be a create action)
    * 
    * this also determines whether or not to send to the client as well
    */
 
   /**
    * specific to quickTasks:
    * 
    * Two statuses: 'open', 'closed'
    * (firm activity/client activity)
    * 1. "task available to client"/"new task available"
    *    status: no status -> open
    * 
    * 2. "client completed a task"/"you completed a task"
    *    status: open -> closed
    * 
    * 3. On file upload
    *   a) with user
    *   b) without user
    * 
    * 4. More TBD
    */ 
   if(initialObj.status == "open" && finalObj.status == "open") {
     // console.log("debug 1");
     // 1. new quickTask created.
     activitiesCtrl.utilCreateFromResource(
       user._id
       , finalObj._firm
       , finalObj._client
       , finalObj.type === 'signature' ? `%USER% requested a signature` : finalObj.type === 'file' ? '%USER% requested a file' : '%USER% assigned a task'
       , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/quick-tasks/quick-view/${finalObj._id}`
       , false
       , false
       , finalObj.type === 'signature' ? `%USER% requested your signature` : finalObj.type === 'file' ? `%USER% requested a file`: `%USER% assigned you a task`
       , `/portal/${finalObj._client}/quick-tasks/${finalObj._id}`
       , false
       , sendClientEmail
       , io
       , ''
       , result => callback(result) 
     )
   } else if(initialObj.status == "open" && finalObj.status == "closed" && initialObj.type != "file") {
     // file activity signed signature
     if (finalObj.type === "signature") {
       Firm.query().findById(finalObj._firm)
       .then(firm => {
         if (firm) {
 
           ShareLink.query().where({ _quickTask: finalObj._id }).first().then(shareLink => {
 
             if (shareLink) {

              console.log("shareLink", shareLink)
              const usernameList = [];
              finalObj.signingLinks.map(item => usernameList.push(item.signatoryEmail));

              if (usernameList && usernameList.length) {
                const hex = Math.floor(Math.random()*16777215).toString(16)
                + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                + Math.floor(Math.random()*16777215).toString(16) // we can make this bigger if needed?
                + Math.floor(Math.random()*16777215).toString(16); // we can make this bigger if needed?
  
                if (shareLink.authType === "individual-auth") {
                  shareLink.authType = "none";
                  shareLink.password = "";
                  shareLink.prompt = "";
                }

                const insertData = {
                  authType: shareLink.authType
                  , expireDate: null
                  , password: shareLink.password
                  , prompt: shareLink.prompt
                  , sentTo: []
                  , type: "share"
                  , _client: null
                  , _files: finalObj._returnedFiles
                  , _firm: finalObj._firm
                  , _createdBy: finalObj._createdBy
                  , hex: hex
                  , url: `https://${appUrl}/share/${hex}`
                }

                //let content = 'Signature request has been completed' + signerNamesString;
                // let content = 'The file ' + signedFile.filename + ' has been signed' + signerNamesString;
                // content += (!!shareLink._client ? ' for client ' + shareLink.name : '');
                // content += (!!shareLink._personal ? ' for user ' + shareLink.firstname + ' ' + shareLink.lastname : '');
                // content += '.';

                shareLink.sentTo.map(user => {
                  usernameList.push(user.email);
                })

                ShareLink.query()
                  .insert(insertData)
                  .then(shareLink => {
                    if (shareLink) {
                      const sendNotification = {
                        link: `/share/${shareLink.hex}`
                        , content: "Your file has been completed"
                        , subject: "Your file has been completed"
                        , userlist: usernameList
                        , firm: firm
                        , linkText: "View a file"
                      }
                      notificationsCtrl.utilNotification(sendNotification, callback => {
                        console.log("deubg1", callback)
                      });
                    }
                  });
              }
            
         
               // const signerName = finalObj.signingLinks.length === 1 ? finalObj.signingLinks[0].signerName + "" : "A user";
               // const actionText = user._id ? "%USER%" : `${signerName}`;
 

              // notify assigned staff and creator
              let signerName = "";
              let actionText = "";
              if (finalObj.signingLinks.length > 1) {
                actionText = finalObj.signingLinks.map(item => item.signerName).join(" & ");
              } else {
                signerName = finalObj.signingLinks.length === 1 ? finalObj.signingLinks[0].signerName : "A user";
                actionText = user._id ? "%USER%" : `${signerName}`;
              }
              if (finalObj._client) {
              const newActivity = {
                _user: req.user && req.user._id ? req.user._id : null
                , _firm: finalObj._firm
                , _client: finalObj._client
                , isReminder: false
                , sendEmail: true
                , text: `${actionText} signed a document`
                , link: `/firm/${finalObj._firm}/workspaces/${finalObj._client}/quick-tasks/quick-view/${finalObj._id}`
              }
              Activity.query().insert(newActivity).returning("*").asCallback((err, activity) => {
                if (activity) {
                  activity.shareLink = shareLink;
                  notificationsCtrl.generateFromActivity(activity, io, signerName);
                }
              });

              if (finalObj._createdBy && shareLink.sN_signingCompleted) {
                  StaffClient.query()
                    .where({ _client: finalObj._client, _user: finalObj._createdBy })
                    .first()
                    .then(staffClient => {
                      if (!staffClient) {
                        notificationsCtrl.sendNotifLinkByUserId(
                          io
                          , [finalObj._createdBy]
                          , finalObj._firm
                          , null // clientid
                          , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/quick-tasks/quick-view/${finalObj._id}`
                          , null // portal link
                          , `${actionText} signed a document`
                          , signerName
                          , result => console.log("res", result)
                        );
                      }
                    });
                }
              } else {
    
              // if (f)
              const userIds = [];
              if (shareLink.sN_signingCompleted && shareLink._createdBy) {
                userIds.push(shareLink._createdBy);
              }

              if (shareLink && shareLink._personal && finalObj._createdBy != shareLink._personal) {
                userIds.push(shareLink._personal);
              }
              
              let workspaceLink = `/firm/${finalObj._firm}/files/public/${finalObj._returnedFiles[0]}`;
              if (shareLink._personal) {
                workspaceLink = `/firm/${finalObj._firm}/files/${shareLink._personal}/personal/${finalObj._returnedFiles[0]}`;
              }
                notificationsCtrl.sendNotifLinkByUserId(
                  io
                  , userIds
                  , shareLink._firm
                  , null // clientid
                  , workspaceLink
                  , null // portal link
                  , `${actionText} signed a document`
                  , signerName
                  , result => console.log("res", result)
                );
              }
             }
           });
         }
       });
     } else {
       activitiesCtrl.utilCreateFromResource(
         user._id
         , finalObj._firm
         , finalObj._client
         , finalObj.type === 'signature' ? `%USER% signed a document` : finalObj.type === 'file' ? `%USER% uploaded a file` : `%USER% completed a task`
         , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/quick-tasks/quick-view/${finalObj._id}`
         , false
         , true
         , finalObj.type === 'signature' ? `%USER% signed a document` : finalObj.type === 'file' ? `%USER% uploaded a file` : `%USER% completed a task`
         , `/portal/${finalObj._client}/quick-tasks/${finalObj._id}`
         , false
         , true
         , io
         , finalObj.type
         , result => callback(result) 
       )
     }
 
     // console.log("debug 2");
     // 2. quickTask completed
 
   } else if (!initialObj._client && initialObj.type === "file" && finalObj.type === "file" && !finalObj._client && finalObj._createdBy) {
     // if client is null, notify the user who created of a request file link
     logger.info("debug 7 if client is null, notify the user who created of a request file link debug 7");
 
     // files Id
     const newFileIds = finalObj._returnedFiles.filter(fileId => !initialObj._returnedFiles.includes(fileId));
     if (newFileIds && newFileIds.length) {
 
       File.query()
         .whereIn('_id', newFileIds)
         .asCallback((err, files) => {
 
           console.log('files found', files)
           if (!err && files && files.length) {
 
             ShareLink.query().where({
               _quickTask: finalObj._id
             }).first()
             .then(shareLink => {
               console.log('sharelink found', shareLink)
 
               if (shareLink) {
                 
                 // other receiver
                 const signingLinks = finalObj.signingLinks;
                 let receivers = [];
                 let userIds = [];
 
                 // notify creator
                 if (shareLink && shareLink.sN_upload) {
                   userIds.push(shareLink._createdBy);
                 }
 
                 if (signingLinks && signingLinks.sentTo && signingLinks.sentTo.length && signingLinks.action === "request") {
                   receivers = signingLinks.sentTo.filter(item => item.email).map(item => item.email);
                 }
                 if (shareLink._personal && shareLink._personal != shareLink.createdBy) {
                   userIds.push(shareLink._personal);
                 }
 
                 User.query().whereIn(
                   '_id', userIds
                 ).then(users => {
 
                   if (users && users.length) {
                     users.map(item => {
                       receivers.push(item.username);
                     });
                   }
 
                   if (receivers && receivers.length) {
                     console.log('receivers', receivers)
                     const props = { 
                       req
                       , user
                       , files
                       , receivers
                       , fromMangobilling: !!req.body.fromMangobilling
                       , uploadCompanyName: req.body.uploadCompanyName
                       , uploadEmailAddress: req.body.uploadEmailAddress
                     };
                     activitiesCtrl.createByUsernameFileUploader(props);
                   }
                 });
               }
             });
           }
         });
     }
   } else if(initialObj && finalObj && initialObj._returnedFiles && finalObj._returnedFiles && finalObj.type === 'file' && initialObj._returnedFiles.length < finalObj._returnedFiles.length) {
 
     console.log("debug 8 if request link is associated with client");
     const newFileIds = finalObj._returnedFiles.filter(fileId => !initialObj._returnedFiles.includes(fileId));
     if (newFileIds && newFileIds.length) {
       File.query()
       .whereIn("_id", newFileIds)
       .asCallback((err, files) => {
   
         if (!err && files && files.length) {
 
           ShareLink.query().where({
             _quickTask: finalObj._id
           }).first()
           .then(shareLink => {
 
             if (shareLink) {
               req.body.files = files;
               req.body.nocallback = true;
               req.body.shareLink = shareLink;
               activitiesCtrl.createOnClientFileUpload(req, null);
               if (!(user && user._id)) {
                 activitiesCtrl.createOnStaffFileUpload(req, null);
               }
         
               // other receiver
               const signingLinks = finalObj.signingLinks;
               console.log('signingLinks1', signingLinks)
               if (signingLinks && signingLinks.sentTo && signingLinks.sentTo.length && signingLinks.action === "request") {
                 const receivers = signingLinks.sentTo.filter(item => item.email).map(item => item.email);
                 if (receivers && receivers.length) {
                   const props = { 
                     req
                     , user
                     , files
                     , receivers
                     , fromMangobilling: !!req.body.fromMangobilling
                     , uploadCompanyName: req.body.uploadCompanyName
                     , uploadEmailAddress: req.body.uploadEmailAddress
                   };
                   activitiesCtrl.createByUsernameFileUploader(props);
                 }
               }
             }
           });
         }
       });
     }
   } else {
     // no need to generate activity
     console.log("end")
   }
 }
 
 exports.utilSearch = (vectorQueryString, firmId = null, firmClientIds = null, clientId = null, callback) => {
   console.log("QUICK_TASK UTIL SEARCH", vectorQueryString, clientId)
   // 3 types, which may end up being more different later
   // admin, firm, client
   if(clientId) {
     // client search
     QuickTask.query()
     .where({_client: clientId, status: 'active'})
     .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
     .then(quickTasks => {
       callback({success: true, quickTasks})
     })
   } else if(firmId && firmClientIds) {
     // firm non-admin search
     QuickTask.query()
     // note: needs testing. it looks like "or" creates a new branch and things need to be repeated
     // NOTE: Fixed "or" issue with a sub query.
     .where({_firm: firmId})
     .where(builder => {
       builder
       .whereIn('_client', firmClientIds)
       .orWhereNull('_client')
     })
     .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
     .then(quickTasks => {
       callback({success: true, quickTasks})
     })
   } else if(firmId) {
     // firm search
     QuickTask.query()
     .where({_firm: firmId})
     .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
     .then(quickTasks => {
       callback({success: true, quickTasks})
     })
   } else {
     // ADMIN search
     QuickTask.query()
     .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
     .then(quickTasks => {
       callback({success: true, quickTasks})
     })
   }
 }
 
 exports.list = (req, res) => {
   QuickTask.query()
   .then(quickTasks => {
     res.send({success: true, quickTasks})
   })
 }
 
 exports.listByValues = (req, res) => {
   res.send({success: false, message: "Not implemented for Postgres yet"});
   return;
   /**
    * returns list of quickTasks queried from the array of _id's passed in the query param
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
     // QuickTask.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, quickTasks) => {
     //     if(err || !quickTasks) {
     //       res.send({success: false, message: `Error querying for quickTasks by ${["_" + req.params.refKey]} list`, err});
     //     } else if(quickTasks.length == 0) {
     //       QuickTask.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, quickTasks) => {
     //         if(err || !quickTasks) {
     //           res.send({success: false, message: `Error querying for quickTasks by ${[req.params.refKey]} list`, err});
     //         } else {
     //           res.send({success: true, quickTasks});
     //         }
     //       })
     //     } else  {
     //       res.send({success: true, quickTasks});
     //     }
     // })
     QuickTask.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, quickTasks) => {
         if(err || !quickTasks) {
           res.send({success: false, message: `Error querying for quickTasks by ${[req.params.refKey]} list`, err});
         } else  {
           res.send({success: true, quickTasks});
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
     QuickTask.query()
     .where(query)
     .asCallback((err, quickTasks) => {
       if(err || !quickTasks) {
         res.send({success: false, message: err || "Error finding quickTasks"})
       } else {
         res.send({success: true, quickTasks})
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
     QuickTask.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, quickTasks) => {
       if(err || !quickTasks) {
         res.send({ success: false, message: err });
       } else {
         res.send({
           success: true
           , quickTasks: quickTasks
           , pagination: {
             per: per
             , page: page
           }
         });
       }
     });
   } else {
     QuickTask.find(mongoQuery).exec((err, quickTasks) => {
       if(err || !quickTasks) {
         res.send({ success: false, message: err });
       } else {
         res.send({ success: true, quickTasks: quickTasks });
       }
     });
   }
 }
 
 exports.getById = (req, res) => {
   logger.info('get quickTask by id');
   const quickTaskId = parseInt(req.params.id)
   QuickTask.query().findById(quickTaskId)
   .asCallback((err, quickTask) => {
     if(err || !quickTask) {
       res.send({success: false, message: "QuickTask not found"})
     } else {
       res.send({success: true, quickTask})
     }
   });
 }
 
 exports.utilGetReminderTasksByClient = (clientId, callback) => {
    /* 1. For each client get all quickTasks that match the following criteria:
    *    a) quickTasks with "open" status, a type of 'signature', and an 'active' visibility.
    *    b) quickTasks with "open" status and a type of 'file' and an empty _returnedFiles array.
    */
   QuickTask.query()
   .where({_client: parseInt(clientId), status: 'open', type: 'signature', visibility: 'active'})
   .orWhere({_client: parseInt(clientId), status: 'open', type: 'file', _returnedFiles: []})
   .asCallback((err, quickTasks) => {
     if(err || !quickTasks) {
       callback(err || "Problem finding overdue quickTasks.")
     } else {
       callback(null, quickTasks)
     }
   });
 }
 
 exports.getSchema = (req, res) => {
   // TODO: need to figure out how/if this can work with the existing yote stuff
   /**
    * This is admin protected and useful for displaying REST api documentation
    */
   logger.info('get quickTask schema ');
   res.send({success: true, schema: QuickTask.jsonSchema});
 }
 
  exports.getDefault = (req, res) => {
   /**
    * This is an open api call by default (see what I did there?) and is used to
    * return the default object back to the Create components on the client-side.
    *
    * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
    * will otherwise return null. 
    */
   logger.info('get quickTask default object');
   res.send({success: true, defaultObj: QuickTask.defaultObject});
   // res.send({success: false})
 }
 
 exports.create = (req, res) => {
   // TODO: Turn the methods below in to callback utils rather than passing req and res.
   logger.info('creating new quickTask');
   // console.log(req.body)
   if(req.body.type === 'signature') {
     exports.utilCreateSignatureRequest(req, res)
   } else if(req.body.type === 'file') {
     exports.utilCreateFileRequest(req, res)
   } else {
     res.send({ success: false, message: "QuickTask type not supported." })
   }
 }
 
 exports.update = (req, res) => {
   /**
    * NOTE: This method is called in a few places where we SHOULD probably be using the method below (exports.updateWithPermission)
    * But first updateWithPermission will need some more options added. Leaving it as is for now because refactoring all of it will
    * require more thought and testing.
    */
   logger.info('updating quickTask');
   let quickTask = req.body;
   const quickTaskId = parseInt(req.params.id) // has to be an int
   QuickTask.query().findById(quickTaskId)
   .then(oldQuickTask => {

    if (oldQuickTask && oldQuickTask.signingLinks && oldQuickTask.signingLinks.length && oldQuickTask.signingLinks[0] && oldQuickTask.signingLinks[0].auth && quickTask.signingLinks && quickTask.signingLinks.length) {
      quickTask.signingLinks = quickTask.signingLinks.map(signer => {
        const oldSigner = oldQuickTask.signingLinks.filter(item => item.signatoryEmail === signer.signatoryEmail)[0];
        if (oldSigner && oldSigner.auth) {
          signer.auth = oldSigner.auth;
        }
        return signer;
      });
    }

    quickTask.signingLinks = JSON.stringify(quickTask.signingLinks); // arrays have to be stringified before saving.
    exports.utilUpdate(req.user, req.io, quickTaskId, quickTask, req, result => {
      if (result && result.quickTask && result.quickTask.signingLinks && result.quickTask.signingLinks.length) {
        result.quickTask.signingLinks.forEach(item => {
          if (item && item.auth && item.auth.password) {
            delete item.auth.password;
          }
        });
      }
      res.send(result);
    })
   });
 }
 
 exports.utilUpdate = (user, io, quickTaskId, updatedQuickTask, req = {}, callback) => {
  // using knex/objection models
  QuickTask.query()
  .findById(quickTaskId)
  .then(oldQuickTask => {
    
    QuickTask.query()
    .findById(quickTaskId)
    .update(updatedQuickTask) //valiation? errors?? 
    .returning('*') // doesn't do this automatically on an update
    .then(quickTask => {

      const fileRequestReceivers = req.body.fileRequestReceivers;
      let signingLinks = {};
      if (quickTask && quickTask.type === "file" && fileRequestReceivers && fileRequestReceivers.length && quickTask.signingLinks) {
        if (quickTask.signingLinks.action === "request") {
          signingLinks = quickTask.signingLinks;
        } else {
          signingLinks.action = "request";
        }

        if (signingLinks && signingLinks.sentTo && signingLinks.sentTo.length) {
          signingLinks.sentTo = signingLinks.sentTo.concat(fileRequestReceivers);
        } else {
          signingLinks.sentTo = fileRequestReceivers;
        }
        quickTask.signingLinks = signingLinks;
      }

      exports.utilCheckAndGenerateActivity(user, io, oldQuickTask, quickTask, true, '', req)
      callback({success: true, quickTask})
    })
  })
 }
 
 exports.updateWithPermission = (req, res) => {
   // TODO: Add some more flexibitly to this. For instance, a client needs to be able to update the response date.
   
   const quickTaskId = parseInt(req.params.id) // has to be an int
   logger.info('quickTaskId', quickTaskId);
   // staff and staffClients should be able to update everything.
   // Everyone else should only be able to update _returnedFiles
   QuickTask.query()
   .findById(quickTaskId)
   .asCallback((err, oldQuickTask) => {
     if(err || !oldQuickTask) {
       logger.error('ERROR: ')
       logger.info(err || "Could not find QuickTask")
       res.send({ success: false, message: err || "Could not find QuickTask" })
     } else {
       console.log('found oldQuickTask');
       let quickTask = req.body;
 
       // if(quickTask.uploadCompanyName)
       //   delete quickTask.uploadCompanyName;
 
       // if(quickTask.uploadEmailAddress)
       //   delete quickTask.uploadEmailAddress;


        if (oldQuickTask && oldQuickTask.signingLinks && oldQuickTask.signingLinks.length && oldQuickTask.signingLinks[0] && oldQuickTask.signingLinks[0].auth && quickTask.signingLinks && quickTask.signingLinks.length) {
          quickTask.signingLinks = quickTask.signingLinks.map(signer => {
            const oldSigner = oldQuickTask.signingLinks.filter(item => item.signatoryEmail === signer.signatoryEmail)[0];
            if (oldSigner && oldSigner.auth) {
              signer.auth = oldSigner.auth;
            }
            return signer;
          });
        }
 
       if(req.user && req.user._id) {
         // For now we are only doing a firm level check here. Any staff of this firm can update every sharelink for this firm.
         // do firm "access" level permission check.
         permissions.utilCheckFirmPermission(req.user, oldQuickTask._firm, "access", permission => {
           if(!permission) {
             // User doesn't have specific permission, only allow them to update the _returnedFiles array.
             quickTask = { _returnedFiles: quickTask._returnedFiles }
           }
           logger.info(permission ? "Updating QuickTask with firm access permission" : "Updating QuickTask with restrictions.")
           // Update.
           exports.utilUpdate(req.user, req.io, quickTaskId, quickTask, req, result => {
            if (result && result.quickTask && result.quickTask.signingLinks && result.quickTask.signingLinks.length) {
              result.quickTask.signingLinks.forEach(item => delete item['auth']['password']);
            }
            res.send(result)
           })
         });
       } else {
         // User is not logged in, only allow updates to _returnedFiles array.
         quickTask = { _returnedFiles: quickTask._returnedFiles }
         if (quickTask && req.body.signingLinks && req.body.signingLinks.length) {
           quickTask.signingLinks = JSON.stringify(req.body.signingLinks);
         }
         logger.info("Updating QuickTask with restrictions.")
         exports.utilUpdate({}, req.io, quickTaskId, quickTask, req, result => {
          if (result && result.quickTask && result.quickTask.signingLinks && result.quickTask.signingLinks.length) {
            result.quickTask.signingLinks.forEach(item => {
              if (item && item.auth && item.auth.password) {
                delete item.auth.password;
              }
              return item;
            });
          }
          res.send(result)
         });
       }
     }
   });
 }
 
 exports.delete = (req, res) => {
   logger.warn("deleting quickTask");
   
   // TODO: needs testing and updating
   const quickTaskId = parseInt(req.params.id) // has to be an int
 
   let query = 'DELETE FROM quickTasks WHERE id = ' + quickTaskId + ';'
 
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
 
 exports.getAssureSignTemplateById = (req, res) => {
   const templateId = req.params.templateId;
   const firmId = parseInt(req.params.firmId);
   // Fetch the firm so we can get the assuresign contextIdentifier.
   Firm.query()
   .findById(firmId)
   .asCallback((err, firm) => {
     if(err || !firm) {
       logger.error('ERROR: ')
       logger.info(err || "Could not find Firm")
       res.send({ success: false, message: err || "Could not find Firm" })
     } else {
 
       if(req.firm && req.firm._id && (req.firm._id == firm._id)) {
         staffCtrl.getFirstStaffByFirm(firm._id, (result) => {
           if(!result.success) {
             logger.error("Problem fetching staff object. Unable to complete request.")
             res.send(result)
           } else {
             const loggedInStaff = result.staff
             assureSign.getAuthToken(firm, loggedInStaff, result => {
               if(!result.success) {
                 res.send(result)
               } else {
                 const authToken = result.token;
                 // Now fetch the blank template and return it to the front end.
                 assureSign.getTemplateById(firm, loggedInStaff, authToken, templateId, result => {
                   res.send(result)
                 });
               }
             });
           }
         })
       } else {
         // Fetch the logged in staff for the rest of the assuresign credentials.
         staffCtrl.utilGetLoggedInByFirm(req.user._id, firm._id, result => {
           if(!result.success) {
             logger.error("Problem fetching staff object. Unable to complete request.")
             res.send(result)
           } else {
             // got firm and loggedInStaff. Continue building the request.
             const loggedInStaff = result.staff
             assureSign.getAuthToken(firm, loggedInStaff, result => {
               if(!result.success) {
                 res.send(result)
               } else {
                 const authToken = result.token;
                 // Now fetch the blank template and return it to the front end.
                 assureSign.getTemplateById(firm, loggedInStaff, authToken, templateId, result => {
                   res.send(result)
                 });
               }
             });
           }
         });
       }
     }
   });
 }
 
 exports.utilCreateSignatureRequest = (req, res) => {
   logger.info("Creating quickTask for signature.")
   // TODO: Add permissions check here..
   /**
    * req.body should look like this:
    * {
       _client: clientId
       , _firm: firmId
       , _unsignedFiles: [fileId]
       , prompt: "String"
       , signers: [
           {
             username: "String"
             , firstname: "String"
             , lastname: "String"
           }, {
             username: "String"
             , firstname: "String"
             , lastname: "String"
           }
       ]
       , type: "String" // 'signature', 'file'
       , templateId: "String"
     }
    */
   // Fetch the firm and loggedInStaff so we can get the assuresign credentials.
   Firm.query()
   .findById(parseInt(req.body._firm))
   .asCallback((err, firm) => {
     if(err || !firm) {
       logger.error('ERROR: ')
       logger.info(err || "Could not find Firm")
       res.send({ success: false, message: err || "Could not find Firm" })
     } else {
 
       const userId = req.user && req.user._id && req.user._id ? req.user._id : !!req.body._createdBy ? req.body._createdBy : 0;
 
       staffCtrl.utilGetLoggedInByFirm(userId, firm._id, result => {
         if(!result.success) {
           logger.error("Problem fetching staff object. Unable to complete request.")
           res.send(result)
         } else {
           // got firm and loggedInStaff. Continue building the request.
           const loggedInStaff = result.staff;
           req.user = req.user && req.user._id ? req.user : result.user;
           const customeTemplate = req.body.customeTemplate;
           const templateId = req.body.templateId
           const newQuickTask = {
             _client: req.body._client
             , _createdBy: userId
             , _firm: req.body._firm
             , _unsignedFiles: req.body._unsignedFiles
             , type: req.body.type
             , prompt: req.body.prompt
             , unsignedFileModelName: req.body.unsignedFileModelName
             , status: 'open'
           }
 
           if (customeTemplate && templateId === "custom") {
             newQuickTask.template = JSON.stringify(customeTemplate);
           }
     
           // signers is now an array of signer objects. This way the staff person can enter the signer info freeform without the signer being a portal user.
           const signers = req.body.signers;
           const signerSigningOrderType = req.body.signerSigningOrderType ? req.body.signerSigningOrderType : "sequential";

           if(!signers || signers.length < 1) {
             res.send({ success: false, message: "ERROR: Missing required signer in request."})
           } else {
             QuickTask.query().insert(newQuickTask)
             .returning('*')
             .asCallback((err, quickTask) => {
               if(err || !quickTask) {
                 logger.error("ERROR: ")
                 logger.info(err || 'Could not create QuickTask')
                 res.send({ success: false, message: "Could not create QuickTask"})
               } else {
                 let socketId = userId;
                 req.io.to(socketId).emit('signature_progress', {message: 'Authorizing', percent: 15});
                 assureSign.getAuthToken(firm, loggedInStaff, result => {
                   if(!result.success) {
                     res.send(result)
                   } else {
                     const authToken = result.token;
 
                     if (templateId !== "custom") {
 
                       // with selected template 
                       // Now fetch the blank template, we'll fill it out with the rest of the info on req.body.
                       req.io.to(socketId).emit('signature_progress', {message: 'Setting up template', percent: 30});
                       assureSign.getTemplateById(firm, loggedInStaff, authToken, templateId, result => {
                         if(!result.success) {
                           res.send(result)
                         } else {
                           const template = result.template;
                           
                           // This method will attach the file (if one is present) and the signers to the template and return a prepared envelopeId.
                           // We only allow one file to be uploaded to a signature request. So we'll pass quickTask._unsignedFiles[0].
                           req.io.to(socketId).emit('signature_progress', {message: 'Preparing document', percent: 45});
                           assureSign.prepareEnvelope(firm, loggedInStaff, authToken, req.body.unsignedFileModelName, quickTask._unsignedFiles[0], signers, template, result => {
                           // assureSign.prepareEnvelope(authToken, quickTask._unsignedFiles[0], signers, template, req.io, socketId, result => { // for debugging
                             if(!result.success) {
                               res.send(result)
                             } else {
                               // We could call prepareEnvelope again if we wanted to change anything.
                               // Now that we are done building the envelope we have to submit it.
                               const preparedEnvelopeId = result.preparedEnvelopeId
 
                               req.io.to(socketId).emit('signature_progress', {message: 'Finalizing document', percent: 60});
                               assureSign.submitPreparedEnvelope(firm, loggedInStaff, authToken, preparedEnvelopeId, result => {
                                 // console.log("RESULT OF SUBMIT PREPARED ENVELOPE");
                                 // logger.info(result)
                                 if(!result.success) {
                                   res.send(result)
                                 } else {
                                   const finalEnvelopeId = result.finalEnvelopeId;
                                   // set custom url, if applicable
                                   let firmUrl = appUrl;
 
                                   if(firm && firm.domain) {
                                     firmUrl = firm.domain;
                                   }
                                   // Pass the finalEnvelopeId and the redirect url. Returns same finalEnvelopeId and signingLinks.
                                   let redirectUrl = req.body.redirectUrl ? encodeURI(req.body.redirectUrl) : encodeURI(`http://${firmUrl}/portal/${quickTask._client}/quick-tasks/${quickTask._id}`)
                                   req.io.to(socketId).emit('signature_progress', {message: 'Generating links', percent: 75});
                                   assureSign.getSigningLinks(firm, loggedInStaff, authToken, finalEnvelopeId, redirectUrl, result => {
                                     if(!result.success) {
                                       res.send(result)
                                     } else {
                                       req.io.to(socketId).emit('signature_progress', {message: 'Notifying signers', percent: 90});
                                       // save the signingLink and envelopeId on the quickTask and return the quickTask to the front end.
                                       // correct signers sorting
                                       let signingLinks = signers.map((signer, i) => {
                                         const currentLink = result.signingLinks.filter(link => link.signatoryEmail === signer.username)[0];
                                         currentLink.signerName = signer.firstname + ' ' + signer.lastname;
                                         currentLink.auth = signer.auth;
                                         return currentLink;
                                       });
 
                                       QuickTask.query()
                                       .findById(quickTask._id)
                                       .patch({
                                         envelopeId: signingLinks[0].envelopeID
                                         , signingLinks: JSON.stringify(signingLinks)
                                         , status: 'open',
                                         assureSignTemplateId: template.templateID
                                       })
                                       .returning('*')
                                       .asCallback((err, updatedQuickTask) => {
                                         if(err || !updatedQuickTask) {
                                           logger.error("ERROR: ")
                                           logger.info(err || "Unable to update quickTask.", quickTask._id)
                                           res.send({success: false, message: "Unable to update quickTask. Please try again.", err})
                                         } else {
                                           // Pass false so we don't send client emails on this activity. Email notifications for signature requests are handled by the shareLink controller.
                                           // Why? Because the emails need to be sent to the signers only and the activities controller has no idea what that means.
                                           exports.utilCheckAndGenerateActivity(req.user, req.io, quickTask, updatedQuickTask, false, '', req)
                                           logger.info("Quick Task Updated! ", updatedQuickTask);
                                           res.send({ success: true, quickTask: updatedQuickTask });
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
                     } else if (customeTemplate) {
 
                       const fileId = quickTask._unsignedFiles[0];
                       req.io.to(socketId).emit('signature_progress', { message: 'Setting up template', percent: 60 });
                       assureSign.SubmitCustomizeTemplate(firm, loggedInStaff, fileId, authToken, signers, customeTemplate, signerSigningOrderType, submitresult => {
 
                         if (!submitresult.success) {
                           res.send(submitresult)
                         } else {
                           
                           let firmUrl = appUrl;
                           if(firm && firm.domain) {
                             firmUrl = firm.domain;
                           }
 
                           const envelopeID = submitresult.envelopeID;
                           const redirectUrl = req.body.redirectUrl ? encodeURI(req.body.redirectUrl) : encodeURI(`http://${firmUrl}/portal/${quickTask._client}/quick-tasks/${quickTask._id}`)
                           req.io.to(socketId).emit('signature_progress', {message: 'Generating links', percent: 75});
                           assureSign.getSigningLinks(firm, loggedInStaff, authToken, envelopeID, redirectUrl, linkresult => {
 
                             if (!linkresult.success) {
                               res.send(linkresult);
                             } else {
 
                               req.io.to(socketId).emit('signature_progress', { message: 'Notifying signers', percent: 90 });
 
                               // save the signingLink and envelopeId on the quickTask and return the quickTask to the front end.
                               // correct signers sorting
                               let signingLinks = signers.map((signer,i) => {
                                 const currentLink = linkresult.signingLinks.filter(link => link.signatoryEmail === signer.username)[0];
                                 currentLink.signerName = signer.firstname + ' ' + signer.lastname;
                                 currentLink.auth = signer.auth;
                                 return currentLink;
                               });
 
                               QuickTask.query()
                               .findById(quickTask._id)
                               .patch({
                                 envelopeId: signingLinks[0].envelopeID
                                 , signingLinks: JSON.stringify(signingLinks)
                                 , status: 'open',
                                 assureSignTemplateId: 'custom'
                               })
                               .returning('*')
                               .asCallback((err, updatedQuickTask) => {
                                 if(err || !updatedQuickTask) {
                                   logger.error("ERROR: ")
                                   logger.info(err || "Unable to update quickTask.", quickTask._id)
                                   res.send({success: false, message: "Unable to update quickTask. Please try again.", err})
                                 } else {
                                   // Pass false so we don't send client emails on this activity. Email notifications for signature requests are handled by the shareLink controller.
                                   // Why? Because the emails need to be sent to the signers only and the activities controller has no idea what that means.
                                   exports.utilCheckAndGenerateActivity(req.user, req.io, quickTask, updatedQuickTask, false, '', req)
                                   logger.info("Quick Task Updated! ", updatedQuickTask);
                                   res.send({ success: true, quickTask: updatedQuickTask });
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
         }
       });
     }
   });
 }
 
 exports.utilCreateFileRequest = (req, res) => {
   const newQuickTask = {
     _client: req.body._client
     , _createdBy: req.user && req.user._id ? req.user._id : null
     , _firm: req.body._firm
     , type: req.body.type
     , prompt: req.body.prompt
     , status: 'open'
     , signingLinks: req.body.signingLinks ? JSON.stringify(req.body.signingLinks) : []
     , selectedStaff: req.body.selectedStaff
   }
   QuickTask.query().insert(newQuickTask)
   .returning('*')
   .asCallback((err, quickTask) => {
     if(err || !quickTask) {
       logger.error("ERROR: ")
       logger.info(err || 'Could not create QuickTask')
       res.send({ success: false, message: "Could not create QuickTask"})
     } else {
       exports.utilCheckAndGenerateActivity(req.user, req.io, {}, quickTask, false, '', req)
       logger.info("Quick Task Created! ", quickTask);
       res.send({ success: true, quickTask: quickTask })
     }
   })
 }
 
 exports.finalizeSignature = async (req, res) => {
   // TODO: Add permissions check here.
   /**
    * Here's what needs to happen:
    * 1. Fetch the signed document.
    * 2. Save it as a file.
    * 3. Update quickTask._returnedFiles with a reference to the file.
    * 4. Update the quickTask status.
    * 5. Return the updated quickTask to the frontend.
    */
   console.log("finalizeSignature", req.body)
 
   let signerNames = "";
 
   if(req.body.signingLinks && req.body.signingLinks.length > 0) {
 
     const signingLinks = req.body.signingLinks;
 
     signingLinks.map(sl => {
       signerNames += `${sl.signerName}, `
     })
 
     signerNames = signerNames.trim();
     signerNames = signerNames.slice(0, -1);
   }
 
   console.log('signerNames', signerNames);
 
   // req.body.signingLinks = JSON.stringify(req.body.signingLinks) // arrays have to be stringified before saving.
   const quickTaskId = parseInt(req.body._id);
 
   let socketId;
   let signedFileHex = "";
 
   let folder = req.body._folder;
   delete req.body._folder;
 
   if(req.user) {
     socketId = req.user._id;
   } else if(req.body.hex) {
     socketId = req.body.hex;
   }
 
   if(req.body.hex) { signedFileHex = req.body.hex; delete req.body.hex}
 
 
   // const requestedBy = await User.query()
   //   .findById(req.body._createdBy)
   //   .then(user => {
   //     return user.firstname + " " + user.lastname;
   //   })
   //   .catch(e => {
   //     return ''
   //   });
 
   // console.log('requestedBy', requestedBy);

  const getFileById = (quickTask, result) => {
    if (quickTask.unsignedFileModelName === "documenttemplate") {
      DocumentTemplate.query().findById(quickTask._unsignedFiles[0])
      .then(template => {
        if (quickTask._client) {
          Client.query().findById(quickTask._client).then(client => {
            template.mangoClientID = client.mangoClientID;
            template.mangoCompanyID = client.mangoCompanyID;
            result(template);
          });
        } else {
          result(template);
        }
      });
    } else {
      File.query().findById(quickTask._unsignedFiles[0])
      .then(file => result(file));
    }
   };
 
   QuickTask.query()
   .findById(quickTaskId)
   .then(oldQuickTask => {
      if (oldQuickTask) {

        if (oldQuickTask && oldQuickTask.signingLinks && oldQuickTask.signingLinks.length && oldQuickTask.signingLinks[0] && oldQuickTask.signingLinks[0].auth && req.body.signingLinks && req.body.signingLinks.length) {
          req.body.signingLinks = req.body.signingLinks.map(signer => {
            const oldSigner = oldQuickTask.signingLinks.filter(item => item.signatoryEmail === signer.signatoryEmail)[0];
            if (oldSigner && oldSigner.auth) {
              signer.auth = oldSigner.auth;
            }
            return signer;
          });
        }
        req.body.signingLinks = JSON.stringify(req.body.signingLinks) // arrays have to be stringified before saving.

        QuickTask.query()
        .findById(quickTaskId)
        .update(req.body)
        .returning('*')
        .asCallback((err, quickTask) => {
          if(err || !quickTask) {
            logger.error("ERROR: ");
            logger.info(err);
            res.send({ success: false, message: "QuickTask not found" })
          } else {
            // fetch the file on quickTask so we can use the filename on the new file.
            req.io.to(socketId).emit('generate_progress', {message: 'Generating signed file. Please wait for a moment.', percent: 15});
            getFileById(quickTask, file => {
              if(file && file._id) {
                // Fetch the firm so we can get the assuresign contextIdentifier.
                req.io.to(socketId).emit('generate_progress', {message: 'Generating signed file. Please wait for a moment.', percent: 35});
                Firm.query()
                .findById(parseInt(quickTask._firm))
                .asCallback((err, firm) => {
                  if(err || !firm) {
                    logger.error('ERROR: ')
                    logger.info(err || "Could not find Firm")
                    res.send({ success: false, message: err || "Could not find Firm" })
                  } else {
                    // Fetch the staff so we can get the rest of the assuresign credentials.
                    req.io.to(socketId).emit('generate_progress', {message: 'Generating signed file. Please wait for a moment.', percent: 50});
                    staffCtrl.utilGetLoggedInByFirm(quickTask._createdBy, firm._id, result => {
                      if(!result.success) {
                        logger.error("Problem fetching staff object. Unable to complete request.")
                        res.send(result)
                      } else {
                        const loggedInStaff = result.staff

                        // Always need to get an authToken before hitting the assureSign API.
                        assureSign.getAuthToken(firm, loggedInStaff, result => {
                          if(!result.success) {
                            res.send(result)
                          } else {
                            req.io.to(socketId).emit('generate_progress', {message: 'Generating signed file. Please wait for a moment.', percent: 60});
                            // We have the auth token (result.token) now put together the request.
                            const authToken = result.token;
                            // If we decide to use an envelope password it would be passed below in place of null.
                            assureSign.getSignedDocument(firm, loggedInStaff, authToken, null, quickTask.envelopeId, result => {
                              if(!result.success) {
                                res.send(result)
                              } else {

                                ShareLink.query().where({ _quickTask: quickTask._id })
                                  .first()
                                  .then(async (shareLink) => {
                                    if (shareLink) {
                                      console.log("shareLink", shareLink);

                                      req.io.to(socketId).emit('generate_progress', {message: 'Generating signed file. Please wait for a moment.', percent: 80});
                                      // We have the signed document. Now save it as a file.
                                      const signedDocument = result.signedDocument
            
                                      if(fileUtil.checkIfMSWordFile(file)) {
                                        const prevFileExtension = file.fileExtension;
                                        file.contentType = "application/pdf";
                                        file.fileExtension = ".pdf";
                                        file.filename = file.filename.replace(prevFileExtension, '.pdf');
                                      }

                                      if (quickTask.unsignedFileModelName === "documenttemplate") {
                                        file.category = "document";
                                      }
                                      
                                      console.log('prev file', file);

                                      const filePointers = {
                                        category: file.category 
                                        , contentType: file.contentType
                                        , fileExtension: file.fileExtension
                                        , filename: `SIGNED_${file.filename}`
                                        , status: 'visible' // The client should be able to view documents they've signed.
                                        , _firm: quickTask._firm
                                        , _user: req.user ? req.user._id : null
                                        , _client: quickTask._client
                                        , _tags: [] // TODO: Should we add the original file tags and "signed" here?
                                        , _folder: !!(shareLink && shareLink._folder && shareLink._folder != file._id) ? shareLink._folder : file._folder
                                        , _personal: shareLink._personal
                                        , YellowParentID: file.YellowParentID
                                        , ParentID: file.ParentID
                                        , mangoClientID: file.mangoClientID
                                        , mangoCompanyID: file.mangoCompanyID
                                        , fileSize: signedDocument.length
                                        , uploadName: signerNames
                                        , requestedBy: req.body && req.body._createdBy ? req.body._createdBy : null
                                      }

                                      const existingReturnedFileId = quickTask._returnedFiles[0] ? quickTask._returnedFiles[0] : false;
                                      quickTask.status = existingReturnedFileId ? 'closed' : 'open'; // to set notification

                                      filesCtrl.utilCreateFromBase64(signedDocument, filePointers, existingReturnedFileId, result => {
                                        if(!result.success) {
                                          res.send(result)
                                        } else {
                                          // The signed document has been saved. Update the quicktask.
                                          let returnedFiles = []
                                          returnedFiles.push(parseInt(result.file._id))
                                          QuickTask.query()
                                          .findById(quickTask._id)
                                          .patch({
                                            _returnedFiles: returnedFiles
                                            , responseDate: new Date()
                                            , status: 'closed'
                                          })
                                          .returning('*')
                                          .asCallback((err, updatedQuickTask) => {
                                            if(err || !updatedQuickTask) {
                                              logger.error("ERROR: ")
                                              logger.info(err)
                                              res.send({ success: false, message: err || 'Unable to update quickTask' })
                                            } else {
                                              req.io.to(socketId).emit('generate_progress', {message: 'Generating signed file. Please wait for a moment.', percent: 90});
                                              // don't send a notification to the user who generated this activity: the loggedInUser is the one who generate the activity
                                              // Note: req.user is the signer and _createdBy is the creator
                                              exports.utilCheckAndGenerateActivity(req.user, req.io, quickTask, updatedQuickTask, false, signedFileHex);

                                              res.send({ success: true, quickTask: updatedQuickTask, file: result.file })
                                            }
                                          });

                                          //Save to mangobilling

                                          let file = result.file;

                                          if(file._client && firm.mangoCompanyID && firm.mangoApiKey && !filePointers._returnedFileId) {

                                            const MANGO_CREATE_FILE = mangobilling.MANGO_CREATE_FILE;
                                            let uniqueName = `${Math.floor(Math.random()*16777215).toString(16)}-${Math.floor(Math.random()*16777215).toString(16)}_${file.filename}`;

                                            const requestBody = {
                                              "CompanyID": file.mangoCompanyID,
                                              "IShareCompanyID": file._firm,
                                              "IShareDMSParentID": file._id,
                                              "IShareClientID": file._client,
                                              "ClientID": file.mangoClientID,
                                              "FName": file.filename,
                                              "ParentID": file.ParentID,
                                              "YellowParentID": file.YellowParentID,
                                              //"ISharePublicFileUrl": `https://${appUrl}/api/files/download/${file._firm}/${file._client}/${file._id}/${file.filename}`,
                                              "ISharePublicFileUrl": `https://app.${brandingName.host}/api/files/download/${file._firm}/${file._client}/${file._id}/${file.filename}`,
                                              //"ISharePublicFileUrl": `https://demo.imaginetime.com/api/files/download/${file._firm}/${file._client}/${file._id}/${file.filename}`,
                                              "UniqueName": uniqueName,
                                              "FileType": file.fileExtension,
                                              "Size": file.fileSize ? (parseInt(file.fileSize) / 1000) + "kb" : "0kb",
                                              "ShowInPortal": true
                                            }

                                            console.log('mango upload requestBody', requestBody);

                                            // axios({
                                            //   method: 'POST',
                                            //   url: MANGO_CREATE_FILE,
                                            //   data: requestBody,
                                            //   headers: {
                                            //     'vendorAPIToken': firm.mangoApiKey,
                                            //     'Content-Type': 'application/json'
                                            //   }
                                            // })
                                            // .then(({data}) => {
                                            //   const mangoRes = data;
                                            //   console.log('MANGO_CREATE_FILE RESPONSE', mangoRes.data);
                                            //   logger.debug("MANGO FILE CREATED");
                                            //   if(mangoRes && mangoRes.data && mangoRes.data.dmsParentID) {
                                            //     File.query()
                                            //       .findById(file._id)
                                            //       .update({
                                            //         filename: file.filename,
                                            //         DMSParentID: mangoRes.data.dmsParentID
                                            //       })
                                            //       .returning('*')
                                            //       .then((file) => {
                                            //         console.log('mangoFile', file);
                                            //       })
                                            //   } else {
                                            //     console.log('failed to call mango API')
                                            //   }
                                            // })
                                            // .catch((err) => {
                                            //   console.log('MANGO_CREATE_FILE ERROR', err);
                                            // })
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
                    });
                  }
                });
              } else {
                res.send({ success: false, message: "Original file not found" });
              }
            });
          }
        });
      } else {
        res.send({ success: false, message: "QuickTask not found" })
      }
   })
 }
 
 
 exports.updateReturnedFiles = (req, quickTaskId, fileIds) => {
   // TODO: Add some more flexibitly to this. For instance, a client needs to be able to update the response date.
   logger.info('quickTaskId', quickTaskId);
   // staff and staffClients should be able to update everything.
   // Everyone else should only be able to update _returnedFiles
   console.log('debug1', req.body.uploadCompanyName)
   QuickTask.query()
   .findById(quickTaskId)
   .asCallback((err, oldQuickTask) => {
     if(err || !oldQuickTask) {
       logger.error('ERROR: ')
       logger.info(err || "Could not find QuickTask")
     } else {
       console.log('found oldQuickTask');
       if (oldQuickTask && oldQuickTask._returnedFiles && oldQuickTask._returnedFiles.length) {
         fileIds = fileIds.concat(oldQuickTask._returnedFiles);
       }
       let quickTask = { 
         _returnedFiles: fileIds
         , status: 'closed' 
       };
 
       if(req.user && req.user._id) {
         exports.utilUpdate(req.user, req.io, quickTaskId, quickTask, req, result => {
           console.log('debug', result)
         });
       } else {
         exports.utilUpdate({}, req.io, quickTaskId, quickTask, req, result => {
           console.log('debug 1', result)
         });
       }
     }
   });
 }
 
 exports.signatureReminder = (req, res) => {
   const quickTaskId = req.params.id;
   ShareLink.query().from('sharelinks as s')
     .innerJoin('quicktasks as q', 'q._id', 's._quickTask')
     .innerJoin('firms as f', 'f._id', 's._firm')
     .where({
       's._quickTask': quickTaskId
     })
     .select(['s.*', raw('row_to_json(q) as quicktask'), raw('row_to_json(f) as firm')])
     .groupBy(['s._id', 'q._id', 'f._id'])
     .then(shareLinks => {
 
         console.log('shareLinks', shareLinks)
         if (shareLinks && shareLinks.length) {
             async.map(shareLinks, (shareLink, cb) => {
                 // console.log(shareLink)
                 notificationsCtrl.signatureReminder(shareLink);
                 cb(null);
             }, (err) => {
                 console.log('signature reminder');
                 res.send({ success: true });
             });
         }
     });
 }
 
 exports.currentSigner = (req, res) => {
   const quickTaskId = parseInt(req.params.id);
 
   QuickTask.query()
   .findById(quickTaskId)
   .asCallback((err, quickTask) => {
     if(err || !quickTask) {
       logger.error('ERROR: ')
       logger.info(err || "Could not find QuickTask")
       res.send({ success: false, message: err || "Could not find QuickTask" })
     } else {
       const data = req.body;
 
       ShareLink.query()
       .findById(data._id)
       .asCallback((err, data) => {
         if(err || !data) {
           logger.error('ERROR: ')
           logger.info(err || "Could not find ShareLink")
           res.send({ success: false, message: err || "Could not find ShareLink" })
         } else {
 
           Firm.query()
           .findById(data._firm)
           .asCallback((err, firm) => {
             if (err || !firm) {
               res.send({ success: false, message: err || "Could not find Firm" });
             } else {
               staffCtrl.utilGetLoggedInByFirm(data._createdBy, firm._id, result => {
                 if(!result.success) {
                   logger.error("Problem fetching staff object. Unable to complete request.")
                   res.send(result)
                 } else {
                   const loggedInStaff = result.staff
     
                   assureSign.getAuthToken(firm, loggedInStaff, result => {
                     if(!result.success) {
                       res.send(result)
                     } else {
                       const authToken = result.token;
             
                       assureSign.getCurrentSigner(firm, loggedInStaff, authToken, quickTask.envelopeId, result => {
                         if (!result.success) {
                           res.send(result);
                         } else {;
                           const nextSigner = result.signingLinks[0];
 
                           sendEmail.utilSendUnsignedSignerEmail(data, nextSigner, result => {
                             res.send(result)
                           })              
                         }
                       });
                     }
                   })
                 }
               })
             }
           })
         }
       })
     }
   })
 }
 
 exports.requestFileReminder = (req, res) => {
   const quickTaskId = req.params.id;
   ShareLink.query().from('sharelinks as s')
   .innerJoin('quicktasks as q', 'q._id', 's._quickTask')
   .innerJoin('firms as f', 'f._id', 's._firm')
   .where({
     's._quickTask': quickTaskId
   })
   .select(['s.*', raw('row_to_json(q) as quicktask'), raw('row_to_json(f) as firm')])
   .groupBy(['s._id', 'q._id', 'f._id'])
   .then(shareLinks => {
     if (shareLinks && shareLinks.length) {
       async.map(shareLinks, (shareLink, cb) => {
           notificationsCtrl.requestFileReminder(shareLink);
           cb(null);
       }, (err) => {
           res.send({ success: true });
       });
     }
   });
 }
