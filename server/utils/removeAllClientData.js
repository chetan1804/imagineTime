/**
 * to run from /server folder:

on local:
node util/removeAllClientData.js

against prod database:
NODE_ENV=production node util/removeAllClientData.js
 */

let async     = require('async');
let utilWrapper = require('./utilWrapper');
let saveToCsv = require('./saveToCsv');
let _ = require('lodash');
let DateTime = require('luxon').DateTime;
let fs        = require('fs');
// let CSV       = require('csv')

console.log("util - remove all CLIENT data from a single firm");

const Activity = require('../resources/activity/ActivityModel');
const ClientActivity = require('../resources/clientActivity/ClientActivityModel');
const Address = require('../resources/address/AddressModel');
const File = require('../resources/file/FileModel');
const Firm = require('../resources/firm/FirmModel');
const Client = require('../resources/client/ClientModel');
const ClientUser = require('../resources/clientUser/ClientUserModel');
const ClientPost = require('../resources/clientPost/ClientPostModel');
const StaffClient = require('../resources/staffClient/StaffClientModel');
const User = require('../resources/user/UserModel');
const Note = require('../resources/note/NoteModel');
const Notification = require('../resources/notification/NotificationModel');
const PhoneNumber = require('../resources/phoneNumber/PhoneNumberModel');
const ClientNote = require('../resources/clientNote/ClientNoteModel');
const ShareLink = require('../resources/shareLink/ShareLinkModel');
const QuickTask = require('../resources/quickTask/QuickTaskModel');



// who is responsible for what ever this does
// const adminCreatorId = '5b059612843bc70010d8a821'; // grant@fugitivelabs.com

utilWrapper.run(() => {

  console.log("Running remove all CLIENT data from a single firm")

  let firmId; // SET THIS BEFORE YOU RUN IT
  // let firmId = 61; Wendy Klein CPA


  Firm.query().findById(firmId)
  .asCallback((err, firm) => {
    if(err || !firm) {
      console.log("Error finding firm", err);
      process.exit(1);
    } else {
      console.log("found firm", firm);
      /**
      * we have a firm. from here, we need to:
      * 1. find all clients for that firm
      * 2. delete users IF they don't have another clientUser or staff (big yikes)
      * 3. delete clients and clientUsers
      * 4. delete files IF they have a _client ref
      * 5. delete staffClients
      */

      Client.query()
      .where({_firm: firmId})
      .asCallback((err, clients) => {
        if(err || !clients) {
          console.log("Error finding clients", err);
          process.exit(1);
        } else {
          let primaryContacts = clients.map(c => c._primaryContact);
          console.log("found clients", clients.length, primaryContacts.length)
          console.log(primaryContacts)

          // easiest to do things per client
          async.each(clients, (client, cb1) => {

            async.parallel({
              clientUsers: cb => {

                ClientUser.query()
                .where({_firm: firmId, _client: client._id})
                // .del()
                // .then(() => {
                //   cb(null, null)
                // })
                .then(clientUsers => {
                  // console.log("FOUND " + clientUsers.length + " ClientUsers")
                  let userIds = clientUsers.map(cu => cu._user);
                  ClientUser.query()
                  .where({_firm: firmId, _client: client._id})
                  .del()
                  .then(() => {
                    cb(null, userIds)
                  })
                })

              }
              , staffClients: cb => {

                StaffClient.query()
                .where({_firm: firmId, _client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
                // .then(staffClients => {
                //   console.log("FOUND " + staffClients.length + " StaffClients")
                //   cb(null, null)
                // })

              }
              , clientFiles: cb => {
                File.query()
                .where({_firm: firmId, _client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , clientPosts: cb => {
                ClientPost.query()
                .where({_client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , shareLinks: cb => {
                ShareLink.query()
                .where({_firm: firmId, _client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , addresses: cb => {
                Address.query()
                .where({_client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , phoneNumbers: cb => {
                PhoneNumber.query()
                .where({_client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , activities: cb => {
                Activity.query()
                .where({_client: client._id})
                .then(activities => {

                  let activityIds = activities.map(a => a._id) || []
                  if(activityIds.length > 0) {
                    Notification.query()
                    // .whereExists('_activity')
                    .whereIn('_activity', activityIds)
                    .del()
                    .then(() => {
                      activity.query()
                      .where({_client: client._id})
                      .del().then(() => {
                        cb(null, null)
                      
                      })
                    })
                  } else {
                    cb(null, null)
                  }
                })
              }
              , clientActivities: cb => {
                ClientActivity.query()
                .where({_client: client._id})
                .then(clientActivities => {

                  let clientActivityIds = clientActivities.map(ca => ca._id) || []
                  if(clientActivityIds.length > 0) {
                    console.log('trying to delete', clientActivityIds)
                    Notification.query()
                    .debug(true)
                    // .whereExists('_clientActivity')
                    .whereIn('_clientActivity', clientActivityIds)
                    .del()
                    .then(() => {
                      ClientActivity.query()
                      .where({_client: client._id})
                      .del().then(() => {
                        cb(null, null)
                      })
                    })
                  } else {
                    cb(null, null)
                  }
                })
              }
              , notes: cb => {
                Note.query()
                .where({_client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , clientNotes: cb => {
                ClientNote.query()
                .where({_firm: firmId, _client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }
              , quickTasks: cb => {
                QuickTask.query()
                .where({_firm: firmId, _client: client._id})
                .del()
                .then(() => {
                  cb(null, null)
                })
              }

              , client: cb => {
                // finally, before we can delete the users associated with it, we have to remove the _user
                // references from the client themselves
                Client.query()
                .findById(client._id)
                .update({
                  _primaryContact: null
                  , _primaryAddress: null
                  , _primaryPhone: null
                })
                .then(() => {
                  cb(null, null)
                })
              }
            }, (err, results) => {

              if(results.clientUsers.length > 0) {
                console.log("CLIENT USER IDS", results.clientUsers.length);
              }

              // now that we have deleted this client's ClientUsers, we can delete the users as well
              // IF THEY AREN:T ATTACHED TO ANY OTHER CLIENT ALREADY

              if(results.clientUsers.length > 0) {
                async.each(results.clientUsers, (userId, cb) => {
                  console.log("trying to delete user " + userId)
                  ClientUser.query()
                  .where({_user: userId})
                  .then(clientUsers => {
                    if(clientUsers.length > 0) {
                      console.log("USER has other clientUsers; skipping.");
                      cb()
                    } else {
                      console.log("USER has no other clientUsers; deleting");
                      User.query()
                      .findById(userId)
                      .del()
                      .then(() => {
                        cb();
                      })
                    }
                  })
                }, err => {
                  cb1();
                })
              } else {
                cb1();
              }
            })


          }, err => {
            console.log("finally delete client objects")
            // end clients each

            // now with all the depencies deleted, we can delete the client objects
            Client.query()
            .where({_firm: firmId})
            .del()
            .then(() => {
              console.log("DELETED ALL CLIENT DATA")
              process.exit();

            })
          })
        }
      })
    }
  })

})
