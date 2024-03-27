// model
const ViewDownload = require('./ViewDownloadModel');
const Client = require('../client/ClientModel');
const Notification = require('../notification/NotificationModel');
const File = require('../file/FileModel');
const Firm = require('../firm/FirmModel');
const Staff = require('../staff/StaffModel');
const User = require('../user/UserModel');
const StaffClient = require('../staffClient/StaffClientModel');
const ClientUser = require('../clientUser/ClientUserModel');

// ctrls
const filesController = require('../file/filesController');
const fileActivityCtrl = require('../fileActivity/fileActivityController');
const notificationsCtrl = require('../notification/notificationsController');
const staffClientCtrl = require('../staffClient/staffClientsController');
const clientUsersCtrl = require('../clientUser/clientUsersController');

const async = require('async');
const { raw } = require('objection');

// device os
var os = require( 'os' );
const ShareLink = require('../shareLink/ShareLinkModel');
var networkInterfaces = os.networkInterfaces();


exports.viewDownloadChecking = (req, file, callback) => {
    logger.info('view downdload triggered debug', file);

    // get params from props
    const {
        type
        , userLevel
        , shareLinkId
        , name
        , uploadName
    } = req.query;

    const {
        _firm
        , _client
    } = file;

    // check variable
    if (type && file && file._id && file.status != "hidden") {

        let actionText = 'Downloaded'; // default value
        let actionType = 'sN_downloaded'; // default value
        if (type === "viewed") {
            actionText = 'Viewed';
            actionType = 'sN_viewed';
        }
        let fromUserString = '';// default value
        let content = actionText + ' by %USER%';
        if (req.user && req.user._id) {
            fromUserString = req.user.firstname + ' ' + req.user.lastname;
            content = `${actionText} by %USER%`;
        } else if (name) {
            fromUserString = name;
            content = `${actionText} by ${name} (not logged in)`;
        }

        // req
        // , _file , _firm , _client , _user
        // , status , text
        // , workspace
        // , portal

        // add file activity
        fileActivityCtrl.utilCreateFromResource(
            req
            , file._id, _firm, _client, req.user ? req.user._id : null
            , file.status, content
            , ""
            , ""
        );

        console.log('debug 1');
        // check if the user already triggered the event
        function checkUser(response) {
            console.log('debug 3')
            if (req.user && req.user._id) {
                ViewDownload.query().where({
                    _user: req.user._id
                    , _file: file._id
                    , type: type
                }).first().then(userRes => {
                    if (userRes) {
                        response({ isNew: false, userIdentification: req.user._id, userIdentificationType: '_user' });
                    } else {
                        response({ isNew: true, userIdentification: req.user._id, userIdentificationType: '_user' });
                    }
                });
            } else if (shareLinkId) {
                const eth = Object.keys(networkInterfaces).filter(a => a.toLowerCase().includes("eth"))[0];
                console.log('debugging1', networkInterfaces[eth]);
                if (eth && networkInterfaces[eth]) {
                    const ipv6 = networkInterfaces[eth].filter(ip => ip.family.toLowerCase() === "ipv6")[0];    
                    if (ipv6 && ipv6.address) {
                        ViewDownload.query().where({
                            ipaddress: ipv6.address
                            , _file: file._id
                            , type: type
                        }).first().then(ipRes => {
                            if (ipRes) {
                                response({ isNew: false, userIdentification: ipv6.address, userIdentificationType: 'ipaddress' });
                            } else {
                                response({ isNew: true, userIdentification: ipv6.address, userIdentificationType: 'ipaddress' });
                            }
                        });
                    } else {
                        response({ isNew: true, userIdentification: '0123456789', userIdentificationType: 'ipaddress' });
                    }
                } else {
                    response({ isNew: true, userIdentification: '0123456789', userIdentificationType: 'ipaddress' });
                }
            } else {
                // do nothing
                response({ isNew: false });
            }
        };

        console.log('debug 233');
        checkUser(userRes => {
            console.log('check if the user already triggered the event', userRes.isNew);
            if (userRes.isNew && userRes.userIdentification && userRes.userIdentificationType) {

                // add activity 
                ViewDownload.query().insert({
                    [userRes.userIdentificationType]: userRes.userIdentification
                    , _file: file._id
                    , type: type
                }).returning('*').then(objRes => {

                    let workspaceLink = "";
                    let portalLink = ""; 
                    if (file && file._client) {
                        portalLink = `/portal/${file._client}/files/${file._id}`;
                        if (file._folder) {
                            workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files/${file._folder}/folder/${file._id}`;
                        } else {
                            workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files/${file._id}`;
                        }
                    } else if (file && file._personal) {
                        if (file._folder) {
                            workspaceLink = `/firm/${file._firm}/files/${file._personal}/personal/${file._folder}/folder/${file._id}`;
                        } else {
                            workspaceLink = `/firm/${file._firm}/files/${file._personal}/personal/${file._id}`;
                        }
                    } else {
                        if (file._folder) {
                            workspaceLink = `/firm/${file._firm}/files/public/${file._folder}/folder/${file._id}`
                        } else {
                            workspaceLink = `/firm/${file._firm}/files/public/${file._id}`;
                        }
                    }
                    
                    req.query.actionType = actionType;
                    req.query.fromUserString = fromUserString;
                    req.query.workspaceLink = workspaceLink;
                    req.query.portalLink = portalLink;

                    if (_client) {
                        console.log('with client');
                        Client.query().findById(_client).then(client => {
                            // notify users
                            exports.viewDownloadNotification(req, file, client, callback => {
                                console.log(callback);
                            });
                        });
                    } else {
                        // notify users
                        exports.viewDownloadNotification(req, file, {}, callback => {
                            console.log(callback);
                        });
                    }
                });
            } else {
                // user already triggered the event
                // or no user identification type
                // do nothing                
            }
        });
    }
}

exports.downloadNotification = (req, res) => {
    const { fileIds, shareLinkId, userLevel, uploadName } = req.body;
    res.send({ success: true, message: "back end process no need to wait the request response." });

    let actionText = 'Downloaded'; // default value
    let actionType = 'sN_downloaded'; // default value
    let fromUserString = ''; // default value
    let content = actionText + ' by %USER%';
    if (req.user && req.user._id) {
        fromUserString = req.user.firstname + ' ' + req.user.lastname;
        content = `${actionText} by %USER%`;
    } else if (uploadName) {
        fromUserString = uploadName;
        content = `${actionText} by ${uploadName} (not logged in)`;
    }


    console.log('content', content);

    if (fileIds && fileIds.length > 1) {
        File.query().findById(fileIds[0]).then(file => {

            let workspaceLink = "";
            let portalLink = ""; 
            let strIds  = fileIds.join(',');
            if (file && file._client) {
                portalLink = `/portal/${file._client}/files?fIds=${strIds}`;
                workspaceLink = `/firm/${file._firm}/workspaces/${file._client}/files?fIds=${strIds}`;
            } else if (file && file._personal) {
                workspaceLink = `/firm/${file._firm}/files/${file._personal}/personal?fIds=${strIds}`;
            } else {
                workspaceLink = `/firm/${file._firm}/files/public?fIds=${strIds}`;
            }

            req.query = {
                type: 'downloaded'
                , userLevel
                , shareLinkId
                , actionType
                , fromUserString
                , workspaceLink
                , portalLink
                , multiple: true
            }   

            if (file && file._client) {
                console.log('with client');
                Client.query().findById(file._client).then(client => {
                    // notify users
                    exports.viewDownloadNotification(req, file, client, callback => {
                        console.log(callback);
                    });
                });
            } else {
                // notify users
                exports.viewDownloadNotification(req, file, {}, callback => {
                    console.log(callback);
                });
            }

            // fileIds.forEach(fileId => {
            //     // notify users
            //     exports.viewDownloadNotification(req, file, {}, callback => {
            //         console.log(callback);
            //         fileActivityCtrl.utilCreateFromResource(
            //             req
            //             , fileId, file._firm, file._client, req.user ? req.user._id : null
            //             , file.status, content
            //             , ""
            //             , ""
            //         );
            //     });
            // });

            fileIds.forEach(fileId => {
                fileActivityCtrl.utilCreateFromResource(
                    req
                    , fileId, file._firm, file._client, req.user ? req.user._id : null
                    , file.status, content
                    , ""
                    , ""
                );
            });
        });
    } else if (fileIds && fileIds.length === 1) {
        File.query().findById(fileIds[0]).then(file => {
            req.query = {
                type: 'downloaded'
                , userLevel
                , shareLinkId
                , actionType
                , name: fromUserString
            }   
            exports.viewDownloadChecking(req, file, callback => {
                console.log('callback', callback);
            })
        });
    }
}

exports.viewDownloadNotification = (req, file, client = {}, callback) => {

    const {
      type
      , userLevel
      , shareLinkId
      , fromUserString
      , actionType
      , workspaceLink
      , portalLink
    } = req.query;
    
    console.log(`type: ${type} || client: ${client} || shareLinkId: ${shareLinkId}`);
    console.log('file', file);
    console.log('client', client);
    console.log('actionType', actionType)
    console.log("hello world", fromUserString)

    // get firm
    Firm.query().findById(parseInt(file._firm)).then(firm => {
  
      if (firm) {
        console.log('firm found')
  
        if (client && client._id) { 
  
          // notify assigned staff
          if (userLevel === "clientuser") {
            StaffClient.query().from('staffclients as sc')
              .innerJoin('staff as s', 's._id', 'sc._staff')
              .innerJoin('users as u', 'u._id', 'sc._user')
              .where({ 'sc._client': client._id })
              .select(['s.*', raw('row_to_json(sc) as staffClient'), raw('row_to_json(u) as user')])
              .groupBy(['s._id', 'sc._id', 'u._id'])
              .then(staffs => {
                console.log('staffs', staffs)
                if (staffs && staffs.length) {
  
                    staffs.forEach(staff => {
                        if (staff && staff.status === "active" && 
                            staff.staffclient && staff.staffclient[actionType] &&
                            staff.user && staff.user.sendNotifEmails) {
                                filesController.utilFileNotification(req, staff.user, firm, file, fromUserString, workspaceLink, (err, res) => {
                                console.log(res);
                            });  
                        }
                    });
                } else {
                  callback('Assigned staff not found');
                }
              });
          }
  
          // notify contact
          if (userLevel === 'staffclient' && client[actionType]) {
  
            console.log('notify contact associated with ', client.name);
  
            ClientUser.query().from('clientusers as cu')
              .innerJoin('users as u', 'u._id', 'cu._user')
              .where({ 'cu._client': client._id, 'cu.status': "active"  })
              .select(['cu.*', raw('row_to_json(u) as user')])
              .groupBy(['cu._id', 'u._id'])
              .then(clientUsers => {
                console.log('clientUsers', clientUsers)
                if (clientUsers && clientUsers.length) {
  
                  clientUsers.forEach(clientUser => {
                    if (clientUser && clientUser.user && clientUser.user.sendNotifEmails && (clientUser.accessType && clientUser.accessType != 'noinvitesent' || !clientUser.user.firstLogin)) {
                        filesController.utilFileNotification(req, clientUser.user, firm, file, fromUserString, portalLink, (err, res) => {
                        callback(res);
                      }); 
                    }
                  });
                } else {
                  callback('Contact not found');
                }
              });
          }
        } else if (shareLinkId) {
          ShareLink.query().from('sharelinks as sl')
          .innerJoin('staff as s', 's._user', 'sl._createdBy')
          .innerJoin('users as u', 'u._id', 'sl._createdBy')
          .where({ 'sl._id': shareLinkId, 'sl._firm': firm._id })
          .select(['sl.*', raw('row_to_json(s) as staff'), raw('row_to_json(u) as user')])
          .groupBy(['sl._id', 'u._id', 's._id'])
          .first()
          .then(shareLink => {
            if (shareLink && shareLink[actionType] && shareLink.staff && shareLink.staff.status === 'active' && shareLink.user && shareLink.user.sendNotifEmails) {
                filesController.utilFileNotification(req, shareLink.user, firm, file, fromUserString, workspaceLink, (err, res) => {
                console.log(res);
              }); 
            }
          });
        }
      } else {
        // do nothing 
        callback('firm not found');
      }
    });
  }