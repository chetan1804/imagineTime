let env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
let config = require('../../config')[env];

require('dotenv').config({path: `${__dirname}/../../.env`})

const aws = require('aws-sdk');

const axios = require('axios');
let crypto = require('crypto');
let jwt = require('jsonwebtoken');

const { v4: uuidv4 } = require('uuid');

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = config.gcloud.keyPath;
const bucketName = config.gcloud.bucketName;

const fileUtils = require('../../global/utils/fileUtils')
const permissions = require('../../global/utils/permissions');
const integrationUtils = require('../../global/utils/integrationUtils');

const integrationDao = require('./integrationDAO');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const Users = require('../user/UserModel');
const Firm = require('../firm/FirmModel');
const Staff = require('../staff/StaffModel');
const Client = require('../client/ClientModel');
const ClientUser = require('../clientUser/ClientUserModel');
const File = require('../file/FileModel');
const Address = require('../address/AddressModel');
const PhoneNumber = require('../phoneNumber/PhoneNumberModel');
const ShareLink = require('../shareLink/ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');
const FileActivity = require('../fileActivity/FileActivityModel');
const Activity = require('../activity/ActivityModel');
const Subscription = require('../subscription/SubscriptionModel');
const Notifications = require('../notification/NotificationModel');
const ClientActivity = require('../clientActivity/ClientActivityModel');
const ViewDownload = require('../viewdownload/ViewDownloadModel');
const ShareLinkToken = require('../shareLinkToken/ShareLinkTokenModel');
const StaffClient = require('../staffClient/StaffClientModel');

const filesController = require('../file/filesController');
const activityCtrl = require('../activity/activitiesController');
const usersController = require('../user/usersController');
const staffController = require('../staff/staffController');

const mangoApi = require('../../global/utils/clientData');

const { raw } = require('objection');

const async = require('async');

const https = require('https');

let fs = require('fs');

let logger = global.logger;

const moment = require('moment');
let DateTime = require('luxon').DateTime;
const mangobilling = require('../../global/constants').mangobilling;

let passport = require('passport');
let speakeasy = require('speakeasy');
let qrcode = require('qrcode');
let multiparty = require('multiparty')
let progress = require('progress-stream');

let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const clientColumns = [
  "_id",
  "created_at",
  "updated_at",
  "name",
  "website",
  "onBoarded",
  "_firm",
  "_primaryContact",
  "_primaryAddress",
  "_primaryPhone",
  "document_vectors",
  "status",
  "mangoClientID",
  "mangoCompanyID",
  "isIntegrated"
]

const getClientColumns = [
  "c._id",
  "c.created_at",
  "c.updated_at",
  "c.name",
  "c.website",
  "c.onBoarded",
  "c._firm",
  "c._primaryContact",
  "c._primaryAddress",
  "c._primaryPhone",
  "c.document_vectors",
  "c.status",
  "c.mangoClientID",
  "c.mangoCompanyID",
  "c.isIntegrated",
  "a.city",
  "a.country",
  "a.formatted_address",
  "a.localTZ",
  "a.postal",
  "a.state",
  "a.street1",
  "a.street2",
  "pn.type",
  "pn.number",
  "pn.extNumber",
  "u.firstname",
  "u.lastname",
  "u.username"
]

const addressColumns = [
  "city",
  "country",
  "formatted_address",
  "localTZ",
  "postal",
  "state",
  "street1",
  "street2"
]

const phoneColumns = [
  "type",
  "number",
  "extNumber"
]

const fileColumns = [
  "_id",
  "created_at",
  "updated_at",
  "filename",
  "fileExtension",
  "category",
  "contentType",
  "rawUrl",
  "status",
  "_firm",
  "_client",
  "_folder",
  "fileSize",
  "mangoCompanyID",
  "mangoClientID",
  "ParentID",
  "YellowParentID",
  "DMSParentID",
  "isIntegrated"
]

const CLIENT_STATUS = [
  'visible',
  'archived',
  'deleted'
]

exports.createClient = async (req, res) => {

  const newClients = req.body;

  console.log('---INITIATE CREATE CLIENT INTEGRATION---');
  console.log('request clients count', newClients.length);

  let promises = [];

  for(let currentClient of newClients) {
    if(!currentClient.ClientName
      || !currentClient.IShareCompanyID 
      // || !currentClient.MangoClientID
      // || !currentClient.MangoCompanyID
      ) {

    } else {
      const _firm = currentClient.IShareCompanyID + '';
      const name = currentClient.ClientName;

      if(_firm && name) {

        let clientBody = {}

        if (currentClient.MangoClientID || Object.keys(currentClient).includes('MangoClientID'))
          clientBody.mangoClientID = currentClient.MangoClientID;
    
        if (currentClient.MangoCompanyID || Object.keys(currentClient).includes('MangoCompanyID'))
          clientBody.mangoCompanyID = currentClient.MangoCompanyID;

        if (currentClient.ClientName)
          clientBody.name = currentClient.ClientName;

        if(!!currentClient.status) {
          clientBody.status = CLIENT_STATUS.includes(currentClient.status) ? currentClient.status : 'visible';
        }

        clientBody._firm = _firm;
        clientBody.onBoarded = true;

        console.log('clientBody', clientBody);

        promises.push(Client.query()
          .where({ _firm: parseInt(_firm) })
          .whereNot('status', 'deleted')
          .where(raw('lower("name")'), name.toLowerCase())
          .first()
          .then((client) => {
            if(client && client._id) {
              return Client.query()
              .findById(client._id)
              .update({...client, isMangoClient: true})
              .returning('*')
              .then(updatedClient => {
                console.log('client already exists', updatedClient._id);
                updatedClient.address = !!currentClient.address ? currentClient.address : null;
                updatedClient.phone = !!currentClient.phone ? currentClient.phone: null;
                return updatedClient;
              })
              .catch(err => {
                console.log('err failed to update client: ', err.message, client._id)
                return null;
              })
            } else {
              return Client.query().insert({...clientBody, isMangoClient: true})
              .returning('*')
              .then(newClient => {
                console.log('client created', newClient._id)
                newClient.address = !!currentClient.address ? currentClient.address : null;
                newClient.phone = !!currentClient.phone ? currentClient.phone: null;
                return newClient
              })
              .catch(err => {
                console.log('failed to create client:', err.message);
                return null;
              })
            }
          })
          .catch(err => {
            console.log('failed to fetch client data', err.message);
            return null;
          })
        )
      }
    }
  }

  Promise.all(promises)
    .then(results => {
      console.log('database call done', results.length);

      results = results.filter((x) => {
        return x;
      });

      res.send({ success: true, clients: results })

      //insert address and phone
      //update mango client ids

      results.map(client => {
        exports.insertClientAddressPhone(client);      
        exports.updateMangoClients(client);
      });

      return;
    })
    .catch(err => {
      res.send({ success: false, message: err.message })
    })

  return;
}

exports.updateMangoClients = (currentClient) => {

  if(!!currentClient.mangoClientID) {
    const MANGO_UPDATE_CLIENT = mangobilling.MANGO_UPDATE_CLIENT.replace(":mangoClientID", currentClient.mangoClientID);
    const mangoApiKey = req.firm.mangoApiKey;
  
    const requestBody = {
      "CompanyID": currentClient.mangoCompanyID,
      "IShareCompanyID": req.firm._id,
      "IShareClientID": currentClient._id,
      "ClientName": currentClient.name
    }
  
    axios({
      method: 'PUT',
      url: MANGO_UPDATE_CLIENT,
      data: requestBody,
      headers: {
        'vendorAPIToken': mangoApiKey,
        'Content-Type': 'application/json'
      }
    })
    .then((mangoRes) => {
      console.log('Update client success', mangoRes.data, currentClient._id);
    })
    .catch(err => {
      console.log('Update client failed', err.message, currentClient._id);
    })
  } else {
    console.log('Client does not have mango client id', currentClient._id);
  }
}

exports.insertClientAddressPhone = async (currentClient) => {

  let newAddress;
  let newPhone;

  if (!!currentClient.address) {
    const addressBody = {
      city: !!currentClient.address.city ? currentClient.address.city : '',
      country: !!currentClient.address.country ? currentClient.address.country : '',
      formatted_address: !!currentClient.address.formatted_address ? currentClient.address.formatted_address : '',
      localTZ: !!currentClient.address.localTZ ? currentClient.address.localTZ : '',
      postal: !!currentClient.address.postal ? currentClient.address.postal : '',
      state: !!currentClient.address.state ? currentClient.address.state : '',
      street1: !!currentClient.address.street1 ? currentClient.address.street1 : '',
      street2: !!currentClient.address.street2 ? currentClient.address.street2 : '',
      _client: currentClient._id
    }

    newAddress = await Address.query()
      .insert(addressBody)
      .returning('*')
      .then((address) => {
        return address;
      });
  }

  if (!!currentClient.phone) {
    const pNumberBody = {
      type: 'work',
      number: !!currentClient.phone.number ? currentClient.phone.number : '',
      extNumber: !!currentClient.phone.extNumber ? currentClient.phone.extNumber : '',
      _client: currentClient._id
    }

    newPhone = await PhoneNumber.query()
      .insert(pNumberBody)
      .returning('*')
      .then((pnumber) => {
        return pnumber;
      })
  }
  
  let updatedClientBody = {
    _primaryAddress: newAddress && newAddress._id ? newAddress._id : currentClient._primaryAddress,
    _primaryPhone: newPhone && newPhone._id ? newPhone._id : currentClient._primaryPhone,
    name: currentClient.name
  };
  
  Client.query().findById(currentClient._id)
    .update(updatedClientBody)
    .returning('*')
    .then((client) => {
      console.log('client address phone has been updated', client._id);
    })
    .catch(err => {
      console.log('update client error', currentClient._id, err.message);
    })
}

exports.updateClient = (req, res) => {

  try {
    if (!req.params.clientID) {
      res.send({ success: false, message: 'incomplete request' });
      return;
    }
  
    let clientBody = {};
  
    const clientId = req.params.clientID;
  
    if (req.body.ClientName)
      clientBody.name = req.body.ClientName;
  
    if (req.body.MangoClientID || Object.keys(req.body).includes('MangoClientID'))
      clientBody.mangoClientID = req.body.MangoClientID;
  
    if (req.body.MangoCompanyID || Object.keys(req.body).includes('MangoCompanyID'))
      clientBody.mangoCompanyID = req.body.MangoCompanyID;
  
    clientColumns.map(key => {
      if(Object.keys(req.body).includes(key)) {
        clientBody[key] = req.body[key];
      }
    });
  
    Client.query()
      .findById(clientId)
      .then((client) => {
        res.send(client); return;
        if(client && client._id) {
          if(req.firm && req.firm._id) {
            if(req.firm._id == client._firm) {
              Client.query()
              .findById(clientId)
              .update(clientBody)
              .returning('*')
              .asCallback(async (err, client) => {
                console.log('client', client);
          
                if (err || !client) {
                  res.send({ success: false, message: err || 'Unable to update client.' })
                } else {
  
                  let newAddress = {}
                  let newPhone = {}
  
                  if(!!req.body.address) {
                    client.address = req.body.address
                  }
  
                  if(!!req.body.phone) {
                    client.phone = req.body.phone;
                  }
  
                  res.send({ success: true, client });
          
                  if (!!req.body.address) {
                    if (client._primaryAddress) {
                      newAddress = await Address.query()
                        .findById(client._primaryAddress)
                        .update(req.body.address)
                        .returning('*')
                        .then((address) => { console.log('new address', address); return address;})
                        .catch(err => { return {} })
                    } else {
                      // add new address
                      const addressBody = {...req.body.address, _client: client._id};
                      newAddress = await Address.query()
                        .insert(addressBody)
                        .returning('*')
                        .then((address) => {
                          return address;
                        })
                        .catch(err => { return {} })
                    }
                  } else {
                    if(client._primaryAddress) {
                      newAddress = await Address.query()
                      .findById(client._primaryAddress)
                      .then((address) => { console.log('new address', address); return address;})
                      .catch(err => { return {} })
                    }
                  }
          
                  if (!!req.body.phone) {
                    if (client._primaryPhone) {
                      newPhone = await PhoneNumber.query()
                        .findById(client._primaryPhone)
                        .update(req.body.phone)
                        .returning('*')
                        .then((pnumber) => { console.log('new phone number', pnumber); return pnumber })
                    } else {
                      // add new phonumber
                      const pNumberBody = {...req.body.phone, _client: client._id}
                      newPhone = await PhoneNumber.query()
                      .insert(pNumberBody)
                      .returning('*')
                      .then((pnumber) => {
                        return pnumber;
                      })
                      .catch(err => { return {} })
                    }
                  } else {
                    if(client._primaryPhone) {
                      newPhone = await PhoneNumber.query()
                      .findById(client._primaryPhone)
                      .then((pnumber) => { console.log('new phone number', pnumber); return pnumber })
                    }
                  }
          
                  let updateClient = {
                    _primaryAddress: newAddress._id ? newAddress._id : client._primaryAddress,
                    _primaryPhone: newPhone._id ? newPhone._id : client._primaryPhone,
                    name: client.name
                  };
          
                  Client.query().findById(client._id)
                    .update(updateClient)
                    .returning('*')
                    .then((client) => {
                      console.log('client address phone has been updated');
                    })
                    .catch(err => {
                      console.log('update client error', err);
                    })
                }
                return;
              })
            } else {
              res.status(500);
              res.send({success: false, message: "You don't have permission to access this firm"});
            }
          } else {
            res.status(500);
            res.send({success: false, message: "You don't have permission to access this firm"});
          }
        } else {
          res.status(500);
          res.send({success: false, message: 'client not found'});
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: err.message })
      })
  } catch(err) {
    res.status(500)
    res.send({ success: false, message: err.message });
  }
  
}

exports.checkClientPermission = (req, res, next) => {
  let passedIds = [];

  let clientIds = req.body;

  Client.query()
    .whereIn('_id', clientIds)
    .asCallback((err, clients) => {
      if(clients.length > 0) {
        async.map(clients, (client, callback) => {
          if(client && req.firm && (client._firm == req.firm._id)) {
            passedIds.push(client._id);
            callback(null, client);
          } else if(req.user && req.user._id) {
            permissions.utilCheckFirmPermission(req.user, client._firm, 'access', (permission) => {
              if(!!permission) {
                passedIds.push(client._id);
              }
              callback(null, client);
            })
          } else {
            callback(null, client);
          }
        }, (err, results) => {
          req.body = passedIds;
          console.log('passedIds', passedIds)
          console.log('user has client permissions');
          next();
        })
      } else {
        req.body = [];
        next();
      }
    })
} 

exports.deleteClients = async (req, res) => {
  console.log('call delete client api');
  let clientIds = req.body;

  if(clientIds.length <= 0) {
    res.send({success: false, message: "You don't have permission to delete this client"});
    return;
  }

  Client.query()
    .whereIn('_id', clientIds)
    .select(['_id', 'name'])
    .then((clients) => {
      clientIds = [];

      clients.map(c => {
        if(c && c._id)
          clientIds.push(c._id);
      })

      if(clientIds.length > 0) {
        Client.query()
        .update({
          status: 'deleted'
        })
        .whereIn('_id', clientIds)
        .returning('*')
        .then((clients) => {
          if (clients && clients.length <= 0) {
            res.send({ success: false, message: err || 'Unable to delete clients.' })
          } else {
            File.query()
              .whereIn('_client', clientIds)
              .then(files => {
                async.map(files, (file, callback) => {
                  const oldFileNameWithFolders = fileUtils.buildFileNameWithFolders(file);
                  File.query()
                    .findById(file._id)
                    .update({
                      status: 'deleted',
                      filename: "deleted_" + Math.floor(Math.random() * 16777215).toString(16) + ".svg",
                      fileExtension: '.svg',
                      contentType: 'image/svg+xml'
                    })
                    .returning('*')
                    .then(file => {
                      if (file && file.category != 'folder') {
                        storage.bucket(bucketName).file(oldFileNameWithFolders).delete({
                          validation: false
                        }, (err, response) => {
                          logger.info(response);
                        })
                      }
                      callback(null, file);
                    })
                }, (err, results) => {
                  // if (err) {
                  //   //res.end({ success: false, message: "Could not delete clients" });
                  // } else {
                  //   // results = results.filter((x) => {
                  //   //   return x;
                  //   // });
                  //   // res.send({ success: true, files: results })
                  // }
                })
              })
            res.send({ success: true, message: 'Successfully deleted the clients.' })
          }
        })
        .catch(err => {
          res.end({ success: false, message: "Could not delete clients" });
        })
      } else {
        res.send({success: false, message: "You don't have permission to delete this client"});
        return;
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
  // if(req.firm && req.firm._id) {
    
  // } else {
  //   res.send({success: false, message: "You don't have permission to delete this client"});
  //   return;
  // }
}

exports.getCompanyClients = (req, res) => {
  logger.info('Find all clients associated with this firmId: ', req.params.CompanyID);

  const isIntegrated = !!req.params.isIntegrated ? req.params.isIntegrated : '';
  Firm.query().findById(req.params.CompanyID)
    .then(firm => {
      if (!firm) {
        res.send({ success: false, message: "Unable to find matching Firm" })
      } else {
        Client.query()
          .from('clients as c')
          .leftJoin('addresses as a', 'a._id', 'c._primaryAddress')
          .leftJoin('phonenumbers as pn', 'pn._id', 'c._primaryPhone')
          .leftJoin('users as u', 'u._id', 'c._primaryContact')
          .select([...getClientColumns])
          .whereNot('status', 'deleted')
          .whereNot('status', 'archived')
          .where(builder => {
            builder.where({ 'c._firm': req.params.CompanyID })

            if(isIntegrated) {
              builder.where({
                'c.isIntegrated': isIntegrated == 'true' ? true: false
              })
            }
          })
          .then(clients => {
            logger.info('clients found', clients.length);

            if(clients.length <= 0) {
              res.send({ success: true, clients: [] });
              return;
            }
            clients.map(c => {
              c.address = c._primaryAddress ? {
                "city": c.city,
                "country": c.country,
                "formatted_address": c.formatted_address,
                "localTZ": c.localTZ,
                "postal": c.postal,
                "state": c.state,
                "street1": c.street1,
                "street2": c.street2
              } : {}

              delete c.city,
              delete c.country,
              delete c.formatted_address,
              delete c.localTZ,
              delete c.postal,
              delete c.state,
              delete c.street1,
              delete c.street2

              c.phone = c._primaryPhone ? {
                "type": c.type,
                "number": c.number,
                "extNumber": c.extNumber,
              } : {}

              delete c.type;
              delete c.number;
              delete c.extNumber;

              c.contact = c._primaryContact ? {
                "username": c.username,
                "firstname": c.firstname,
                "lastname": c.lastname
              } : {}

              delete c.username;
              delete c.firstname;
              delete c.lastname;

              delete c.isMangoClient;

              delete c.accountType;
              delete c.logoPath;
              delete c.identifier;
              delete c.sharedSecretPrompt;
              delete c.sharedSecretAnswer;
              delete c.sendNotifEmails;
              delete c.sN_viewed;
              delete c.sN_downloaded;
              delete c.sN_upload;
              delete c.sN_signingCompleted;
              delete c.sN_leaveComment;
              delete c.sN_sendMessage;
              delete c.engagementTypes;
              delete c._client;

            })
            res.send({ success: true, clients });
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.getCompanyArchivedClients = (req, res) => {
  logger.info('Find all archived clients associated with this firmId: ', req.params.CompanyID);

  Firm.query().findById(req.params.CompanyID)
    .then(firm => {
      if (!firm) {
        res.send({ success: false, message: "Unable to find matching Firm" })
      } else {
        Client.query()
          .where({
            _firm: req.params.CompanyID,
            status: 'archived'
          })
          .select([...clientColumns])
          .then(clients => {
            logger.info('clients found', clients.length);
            res.send({ success: true, clients });
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.getFoldersByFirm = (req, res) => {
  const firmId = req.params.firmId;

  console.log('here i am');
  File.query()
    .where({
      _firm: firmId,
      status: 'visible'
    })
    .whereNot('status', 'deleted')
    .whereNot('status', 'archived')
    .select([...fileColumns])
    .then((files) => {
      // files = files.filter((file) => {
      //   return !!file._client
      // });

      // console.log('files', files);

      res.send({ success: true, files })
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: err.message});
    })
}

exports.getFoldersByClient = (req, res) => {
  // const clientId = req.params.clientId;

  // if(req.firm && req.firm._id) {
  //   Client.query()
  //     .findById(clientId)
  //     .then((client) => {
  //       if(client && client._id) {
  //         if(client._firm == req.firm._id) {
  //           File.query()
  //             .where({

  //             })
  //         } else {
  //           res.send({success: false, message: "You don't have permission to access this client"});
  //         }
  //       } else {
  //         res.send({success: false, message: "No client found"})
  //       }
  //     })
  //     .catch(err => {
  //       res.send({success: false, message: "Failed to fetch client"});
  //     })
  // } else {
  //   res.send({success: false, message: "You don't have permission to access this firm"});
  // }
}

exports.getFilesByFirm = (req, res) => {
  const firmId = req.params.firmId;

  Client.query()
    .where({
      _firm: firmId
    })
    .whereNot('status', 'deleted')
    .whereNot('status', 'archived')
    .then(clients => {
      if(clients.length <= 0) {
        res.send({ success: true, files: [], folders: [] });
        return;
      }
      const cIds = clients.map(c => c._id);

      File.query()
        .where({
          _firm: firmId,
          status: 'visible'
        })
        .whereIn('_client', cIds)
        // .whereNot('status', 'deleted')
        // .whereNot('status', 'archived')
        .select([...fileColumns])
        .then((files) => {
          const filteredFiles = files.filter((file) => {
            return !!file._client && file.category != 'folder'
          });
    
          const folders = files.filter((file) => {
            return !!file._client && file.category == 'folder'
          });
    
          console.log('files', files.length);
    
          res.send({ success: true, files: filteredFiles, folders: folders })
        })
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: err.message});
    })
}

exports.getArchivedFilesByFirm = (req, res) => {
  const firmId = req.params.firmId;

  console.log('here i am');
  File.query()
    .where({
      _firm: firmId,
      status: 'archived'
    })
    .select([...fileColumns])
    .then((files) => {
      files = files.filter((file) => {
        return !!file._client
      });

      res.send({ success: true, files })
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.callUpdateMangoFolder = (folder) => {
  if(!!folder.DMSParentID) {

  }
}

exports.createFolder = (req, res) => {
  if (!req.body.IShareCompanyID ||
    !req.body.IShareClientID ||
    !req.body.Filename ||
    !req.body.MangoCompanyID ||
    !req.body.MangoClientID ||
    !req.body.DMSParentID
  ) {
    res.send({ success: false, message: 'incomplete request' });
    return;
  }

  const _firm = req.body.IShareCompanyID;
  const _client = req.body.IShareClientID;
  const _folder = !!req.body.IShareFolder ? req.body.IShareFolder : '';
  const filename = req.body.Filename;
  const mangoCompanyID = req.body.MangoCompanyID;
  const mangoClientID = req.body.MangoClientID;
  const dmsParentID = req.body.DMSParentID;
  const yellowParentID = !!req.body.YellowParentID ? req.body.YellowParentID : null;
  const parentID = !!req.body.ParentID ? req.body.ParentID : null;
  const isIntegrated = !!req.body.isIntegrated ? req.body.isIntegrated : false;

  const folderBody = {
    category: 'folder',
    filename: filename,
    status: 'visible',
    wasAccessed: false,
    _client: _client,
    _firm: _firm,
    _folder: _folder,
    mangoCompanyID: mangoCompanyID,
    mangoClientID: mangoClientID,
    DMSParentID: dmsParentID,
    ParentID: parentID,
    YellowParentID: yellowParentID,
    isIntegrated
  }

  File.query().insert(folderBody)
    .returning('*')
    .then(file => {
      if (file) {
        res.send({ success: true, file: file });
        //exports.callUpdateMangoFolder(file);
      } else {
        res.status(500)
        res.send({ success: false, message: "Could not save folder" });
      }
      return;
    })
    .catch(err => {
      res.status(500);
      res.send({ success: false, message: err.message });
    })
}

exports.updateFolder = async (req, res) => {

  try {
    const folderID = req.params.folderID;
    let fileBody = {}

    if (req.body.MangoClientID || Object.keys(req.body).includes('MangoClientID')) {
      fileBody.mangoClientID = req.body.MangoClientID;
      delete req.body.MangoClientID;
    }
  
    if (req.body.MangoCompanyID || Object.keys(req.body).includes('MangoCompanyID')) {
      fileBody.mangoCompanyID = req.body.MangoCompanyID;
      delete req.body.MangoCompanyID;
    }
  
    if (req.body.Filename || Object.keys(req.body).includes('Filename')) {
      fileBody.filename = req.body.Filename;
      delete req.body.Filename;
    }
  
    if (req.body.IShareFolder || Object.keys(req.body).includes('IShareFolder')) {
      fileBody._folder = req.body.IShareFolder;
      delete req.body.IShareFolder;
    }
  
    fileColumns.map(key => {
      if(Object.keys(req.body).includes(key)) {
        fileBody[key] = req.body[key];
      }
    })

    delete fileBody._id;
  
    File.query()
      .findById(folderID)
      .update(fileBody)
      .returning('*')
      .then((folder) => {
        res.send({ success: true, folder: folder })
      })
      .catch((err) => {
        res.status(500);
        res.send({ success: false, message: err.message })
      })
  } catch(err) {
    res.status(500);
    res.send({ success: false, message: err.message })
  }
}

exports.deleteFilesInFolder = (fileIds = [], newCallback) => {

  console.log('fileIds', fileIds);
  File.query()
    .whereIn('_folder', fileIds)
    .then((files) => {
      async.map(files, (file, callback) => {
        const oldFile = file;
        const fileNameWithFolders = fileUtils.buildFileNameWithFolders(oldFile);

        File.query()
          .findById(oldFile._id)
          .update({
            status: 'deleted',
            filename: "deleted_" + Math.floor(Math.random() * 16777215).toString(16) + ".svg",
            fileExtension: '.svg',
            contentType: 'image/svg+xml'
          })
          .returning('*')
          .then((file) => {
            console.log('file deleted', file);
            if (file && file.category != 'folder') {
              storage.bucket(bucketName).file(fileNameWithFolders).delete({
                validation: false
              }, (err, response) => {
                if (err) {
                  logger.info("storage error", err);
                } else {
                  logger.info(response);
                }
              })
            } else if (file && file.category == 'folder') {
              exports.deleteFilesInFolder([file._id], (err, file) => { });
            }
            callback(null, file);
          })
          .catch(err => {
            callback(null);
          })
      }, (err, results) => {
        //res.send({success: true, message: 'successfully deleted the folder'});
        newCallback(null, null);
      });
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.deleteFolder = (req, res) => {

  const folderIds = req.body;

  File.query()
    .update({
      status: 'deleted'
    })
    .whereIn('_id', folderIds)
    .returning('*')
    .then(folders => {
      if (folders && folders.length > 0) {
        exports.deleteFilesInFolder(folderIds, () => {
          res.send({ success: true, message: 'successfully deleted the folder' });
        })
      } else {
        res.send({ success: false, message: `Error deleting folders ${folderIds}` })
      }
    })
    .catch((err) => {
      res.status(500);
      res.send({ success: false, message: err.message });
    })
}

exports.createFile = (req, res) => {

  logger.info('mangofile request body', req.body);

  if (!req.body.MangoUniquename ||
    !req.body.IShareCompanyID ||
    !req.body.IShareClientID ||
    !req.body.Filename ||
    !req.body.MangoCompanyID ||
    !req.body.MangoClientID) {
    res.send({ success: false, message: 'incomplete request' });
    return;
  }

  try {
    aws.config.update({
      accessKeyId: process.env.S3_ACCESS_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION
    });

    const bucketParams = {
      params: {
        Bucket: 'mangobillings3'
      }
    }
    const awsBucket = new aws.S3(bucketParams);

    const uniquename = req.body.MangoUniquename;

    const params = {
      Bucket: 'mangobillings3', Expires: 600000,
      ResponseContentDisposition: `attachment; filename="${uniquename}"`,
      Key: `documents/${uniquename}`
    }

    awsBucket.getSignedUrl('getObject', params, (err, url) => {
      if(err) {
        logger.error('awsbucket error', err);
        res.status(500);
        res.send({ success: 'false', message: 'Failed to save the file' });
      } else {

        logger.info('s3 data encoded url', url);

        const fileUrl = url;

        axios({
          method: 'GET',
          url: fileUrl,
          responseType: 'stream'
        })
        .then((file) => {
          const contentType = file.headers['content-type'];
          const _firm = req.body.IShareCompanyID;
          const _client = req.body.IShareClientID;
          const _folder = !!req.body.IShareFolder ? req.body.IShareFolder : '';
          const filename = req.body.Filename;
          const mangoCompanyID = req.body.MangoCompanyID;
          const mangoClientID = req.body.MangoClientID;
          const dmsParentID = req.body.DMSParentID;
          const yellowParentID = !!req.body.YellowParentID ? req.body.YellowParentID : null;
          const parentID = !!req.body.ParentID ? req.body.ParentID : null;
          const fileExtension = req.body.FileType;
          const uploadName = !!req.body.UploaderName ? req.body.UploaderName : null;
    
          const newFile = {
            filename: filename + fileExtension,
            status: 'visible',
            category: 'document',
            _client: _client,
            _firm: _firm,
            _folder: _folder,
            mangoCompanyID: mangoCompanyID,
            mangoClientID: mangoClientID,
            DMSParentID: dmsParentID,
            ParentID: parentID,
            YellowParentID: yellowParentID,
            fileExtension: fileExtension,
            contentType: contentType,
            fileSize: file.headers['content-length'],
            uploadName: uploadName
          }
    
          if (contentType.includes('pdf') || contentType.includes('text')) {
            newFile.category = 'document'
          } else if (contentType.includes('image')) {
            newFile.category = 'image'
          } else if (contentType.includes('video')) {
            newFile.category = 'video'
          } else {
            newFile.category = contentType;
          }
    
          newFile.rawUrl = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${newFile._id}${fileExtension}`;
    
          File.query()
            .insert(newFile)
            .returning("*")
            .then(newFile => {
               
              let resFile = {};
              
              res.send({
                success: true,
                file: newFile
              });
    
              const fileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);
    
              const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);
    
              const writer = fileDestination.createWriteStream({ gzip: true });
    
              file.data.pipe(writer);
    
              writer.on('error', (err) => {
                console.log('error uploading', err);
              });
    
              writer.on('finish', () => {
                console.log('finish uploading')
              });
    
              req.body.files = [newFile];
              req.body.nocallback = true;
              req.body.fromMangobilling = true;
    
              req.user = {};

              activityCtrl.createOnStaffFileUpload(req, res);
            })
            .catch(err => {
              res.status(500);
              res.send({success: false, message: err.message });
            })
        })
        .catch(err => {
          logger.error('axios get file error', err);
          res.status(500);
          res.send({success: false, message: err.message , url: fileUrl });
        })
      }
    })
  } catch (err) {
    res.status(500);
    res.send({ success: false, message: err.message });
  }
}

exports.updateFile = (req, res) => {

  try {
    const fileId = req.params.fileID;

    let fileBody = {}
  
    if (req.body.MangoClientID || Object.keys(req.body).includes('MangoClientID')) {
      fileBody.mangoClientID = req.body.MangoClientID;
      delete req.body.MangoClientID;
    }
  
    if (req.body.MangoCompanyID || Object.keys(req.body).includes('MangoCompanyID')) {
      fileBody.mangoCompanyID = req.body.MangoCompanyID;
      delete req.body.MangoCompanyID;
    }
  
    if(Object.keys(req.body).includes('Filename')) {
      fileBody.filename = req.body.Filename;
      delete req.body.Filename;
    }
  
    if(Object.keys(req.body).includes('IShareFolder')) {
      fileBody._folder = req.body.IShareFolder;
      delete req.body.IShareFolder;
    }

    fileColumns.map(key => {
      if(Object.keys(req.body).includes(key)) {
        fileBody[key] = req.body[key];
      }
    })
  
    delete fileBody._id;
  
    File.query()
      .findById(fileId)
      .update(fileBody)
      .returning('*')
      .then((file) => {
        res.send({ success: true, file: file })
      })
      .catch(err => {
        res.status(500);
        res.send({ success: false, message: err.message });
      })
  } catch(err) {
    res.status(500);
    res.send({ success: false, message: err.message });
  }

}

exports.archiveFile = (req, res) => {
  const fileIds = req.body;

  File.query()
    .whereIn('_id', fileIds)
    .update({
      status: 'archived'
    })
    .returning('*')
    .then((files) => {
      res.send({ success: true, message: 'successfully deleted the files' });
    })
    .catch(err => {
      res.status(500);
      res.send({ success: false, message: err.message });
    })
}



exports.checkFilePermission = (req, res, next) => {
  let passedIds = [];

  let fileIds = req.body;

  File.query()
    .whereIn('_id', fileIds)
    .asCallback((err, files) => {
      if(files.length > 0) {
        async.map(files, (file, callback) => {
          if(file && req.firm && (file._firm == req.firm._id)) {
            passedIds.push(file._id);
            callback(null, file);
          } else if(req.user && req.user._id) {
            permissions.utilCheckFirmPermission(req.user, file._firm, 'access', (permission) => {
              if(!!permission) {
                passedIds.push(file._id);
              }
              callback(null, file);
            })
          } else {
            callback(null, file);
          }
        }, (err, results) => {
          req.body = passedIds;
          console.log('passedIds', passedIds)
          console.log('user has permissions--');
          next();
        })
      } else {
        req.body = [];
        next();
      }
    })
} 

exports.deleteFile = async (req, res) => {

  let fileIds = req.body;

  if(fileIds.length <= 0) {
    res.send({success: false, message: "You don't have permission to delete this file/s"});
    return;
  }

  File.query()
    .whereIn('_id', fileIds)
    .then((files) => {

      async.map(files, (file, callback) => {
        
        const oldFileNameWithFolders = fileUtils.buildFileNameWithFolders(file);
        File.query()
          .findById(file._id)
          .update({
            status: 'deleted',
            filename: "deleted_" + Math.floor(Math.random() * 16777215).toString(16) + ".svg",
            fileExtension: '.svg',
            contentType: 'image/svg+xml'
          })
          .returning('*')
          .then((file) => {
            console.log('file deleted', file);
            if (file && file.category != 'folder') {
              storage.bucket(bucketName).file(oldFileNameWithFolders).delete({
                validation: false
              }, (err, response) => {
                logger.info(response);
              })
            } else {
              exports.deleteFilesInFolder([file._id], () => { })
            }
            callback(null, file);
          })
          .catch(err => {
            callback(null)
          })
      }, (err, results) => {
        res.send({ success: true, message: 'successfully deleted the files' });
      })
    })
    .catch((err) => {
      res.status(500);
      res.send({ success: false, message: err.message });
    })
}

exports.getFileByMangoFileID = (req, res) => {
  const mangoFileID = req.params.mangoFileID;

  File.query()
    .where({
      mangoFileID: mangoFileID
    })
    .first()
    .asCallback((err, file) => {
      if (err) {
        res.send({ success: false })
      } else {
        res.send({ success: true, file: file })
      }
      return;
    })
}

exports.validateApiKeys = (req, res) => {

  if (!req.body.mangoAPIKey || !req.body.ishareAPIKey || !req.body.CompanyID) {
    res.send({ message: 'incomplete request' });
    return;
  }

  Firm.query()
    .where({
      apiKey: req.body.ishareAPIKey
    })
    .first()
    .then((firm) => {
      if (firm) {
        Firm.query() // check if new mango api key is currently using.
          .where({
            mangoApiKey: req.body.mangoAPIKey
          })
          .first()
          .then((firm2) => {
            if (firm2 && firm2._id) {
              if (firm2._id == firm._id) {
                res.send({
                  data: {
                    "CompanyID": req.body.CompanyID,
                    "APIKeyMangoIS": firm.mangoApiKey,
                    "vendorAPIKeyIS": firm.apiKey,
                    "CompanyIDImagineShare": firm._id,
                    "CompanyName": firm.name
                  },
                  message: "Updated successfully"
                })
              } else {
                res.send({ success: true, message: "Mango API token already in used" })
              }
            } else {
              Firm.query()
                .findById(firm._id)
                .update({
                  name: firm.name,
                  mangoApiKey: req.body.mangoAPIKey
                })
                .returning('*')
                .then((firm) => {
                  res.send({
                    data: {
                      "CompanyID": req.body.CompanyID,
                      "APIKeyMangoIS": firm.mangoApiKey,
                      "vendorAPIKeyIS": firm.apiKey,
                      "CompanyIDImagineShare": firm._id,
                      "CompanyName": firm.name
                    },
                    message: "Updated successfully"
                  })
                })
                .catch(err => {
                  res.status(500);
                  res.send({success: false, message: "Internal Server Error"})
                })
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      } else {
        res.send({ message: "Invalid Imaginshare Token" })
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.authenticateUser = (req, res, next) => {

  console.log('req.body', req.body);

  if (!req.body._firm ||
    !req.body.username ||
    !req.body.password) {
    res.send({ message: 'incomplete request' });
    return;
  }

  if (req.body.username == undefined) {
    res.send({ success: false, message: "No username present." });
  } else {
    req.body.username = req.body.username.toLowerCase();

    passport.authenticate('local', { session: true }, (err, user) => {
      if (err) {
        res.send({ success: false, message: "Error authenticating user." });
      } else if (!user) {
        res.send({ success: false, message: "Matching user not found." });
      } else {
        console.log('user', user._id);
        Staff.query()
          .where({
            _firm: req.body._firm,
            _user: user._id
          })
          .first()
          .then((staff) => {

            console.log('staff', staff);
            if (staff) {
              Firm.query()
                .findById(req.body._firm)
                .select('_id', 'apiKey', 'name')
                .then((firm) => {
                  if (firm) {
                    res.send({
                      success: true,
                      firm: {
                        _id: firm._id,
                        name: firm.name,
                        token: firm.apiKey
                      }
                    })
                  } else {
                    res.send({ success: false, message: "Firm not found." });
                  }
                })
                .catch(err => {
                  res.status(500);
                  res.send({success: false, message: "Internal Server Error"})
                })
            } else {
              res.send({ success: false, message: "You don't have permission to access this firm." });
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      }
    })(req, res, next)
  }
}

exports.getFirmToken = (req, res) => {
  const email = req.params.email;
  const firmId = req.params.firmId;

  Firm.query()
    .findById(firmId)
    .then((firm) => {
      Users.query()
        .where({
          username: email
        })
        .then((users) => {
          let user = {};
          if (users.length > 0) {
            user = users[0];
            permissions.utilCheckFirmPermission(user, firm._id, 'access', (permission) => {
              if (!permission) {
                res.send({ success: false, message: "You do not have permission to access this Firm" })
              } else {
                const apiKey = uuidv4();

                if(!!firm.apiKey) {
                  res.send({ success: true, token: firm.apiKey });
                } else {
                  Firm.query()
                    .findById(firm._id)
                    .update({
                      apiKey,
                      name: firm.name
                    })
                    .returning('*')
                    .then((newFirm) => {
                      res.send({ success: true, token: newFirm.apiKey });
                    })
                    .catch(err => {
                      res.status(500);
                      res.send({success: false, message: "Internal Server Error"})
                    })
                }
              }
            })
          } else {
            res.send({ success: false, message: "You do not have permission to access this Firm" })
          }

        })
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.verifyToken = (req, res) => {
  if (!req.body._firm) {
    res.send({ success: false, message: 'incomplete request' });
    return;
  }

  console.log('req.firm', req.firm);

  const firmId = req.body._firm;
  Firm.query()
    .findById(firmId)
    .then((firm) => {
      if (req.firm && req.firm._id) {
        if (firm._id == req.firm._id) {
          res.send({
            success: true,
            token: firm.apiKey
          })
        } else {
          res.send({ success: false, message: "You do not have permission to access this Firm" })
        }
      } else {
        res.send({ success: false, message: "You do not have permission to access this Firm" })
      }
    })
    .catch((err) => {
      res.send({ success: false, message: 'Unable to update file.' })
    })
}

exports.comUpdateClient = (req, res) => {

  const clientId = req.params.clientId;

  Client.query()
    .findById(clientId)
    .then((client) => {
      if (client && req.firm && (client._firm == req.firm._id)) {
        Client.query()
          .findById(clientId)
          .update(req.body)
          .returning('*')
          .then((client) => {
            res.send({ success: true, client })
          })
          .catch((err) => {
            res.send({ success: false, message: `Unable to update client. Reason: ${err.message}`})
          })
      } else if(req.user && req.user._id) {
        permissions.utilCheckFirmPermission(req.user, client._firm, 'access', (permission) => {
          if(!permission) {
            res.send({ success: false, message: "You do not have permission to access this client" })
          } else {
            Client.query()
            .findById(clientId)
            .update(req.body)
            .returning('*')
            .then((client) => {
              res.send({ success: true, client })
            })
            .catch((err) => {
              res.send({ success: false, message: `Unable to update client. Reason: ${err.message}`})
            })
          }
        })
      } else {
        res.send({ success: false, message: "You do not have permission to access this client" })
      }
    })
    .catch((err) => {
      console.log('err', err);
      res.send({ success: false, message: `Unable to update client. Reason: ${err.message}` })
    })
}

exports.moveFilesInFolder = (fileId, _client, _folder, newCallback) => {
  File.query()
    .where({
      _folder: fileId
    })
    .then((files) => {
      async.map(files, (file, callback) => {

        File.query()
          .findById(file._id)
          .update({
            filename: file.filename,
            _client: _client
          })
          .returning('*')
          .then(file => {
            if (file && (file.category != 'folder' || file._folder === fileId || file._id === file._folder)) {
              //do nothing
            } else {
              exports.moveFilesInFolder(file._id, _client, _folder, () => { })
            }
            callback(null, file);
          })
          .catch(err => {
            callback(null)
          })
      }, (err, results) => {
        newCallback(null, null)
      })
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.comBulkMoveFile = (req, res) => {
  /*
    _folder
    _client
    _id
  */

  const fileId = req.body._id;

  if (!fileId) {
    res.send({ success: false, message: 'incomplete request' });
    return;
  }

  File.query()
    .findById(fileId)
    .then((file) => {
      if (file && file._firm == req.firm._id) {
        File.query()
          .findById(fileId)
          .update(req.body)
          .returning('*')
          .then((file) => {

            if (file && file.category != 'folder') {
              res.send({ success: true, message: 'successfully move the file' })
            } else {
              exports.moveFilesInFolder(fileId, req.body._client, req.body._folder, () => {
                res.send({ success: true, message: 'successfully move the file' })
              })
            }
          })
          .catch((err) => {
            res.send({ success: false, message: 'Unable to update file.' })
          })
      } else {
        res.send({ success: false, message: "You do not have permission to access this file" })
      }
    })
    .catch((err) => {
      res.send({ success: false, message: 'Unable to update file.' })
    })
}

exports.comUpdateFile = (req, res) => {

  const fileId = req.params.fileId;

  File.query()
    .findById(fileId)
    .then((file) => {
      if (file && req.firm && (file._firm == req.firm._id)) {
        File.query()
          .findById(fileId)
          .update(req.body)
          .returning('*')
          .then((file) => {
            res.send({ success: true, file: file })
          })
          .catch((err) => {
            res.send({ success: false, message: 'Unable to update file.' })
          })
      } else if(req.user && req.user._id) {
        permissions.utilCheckFirmPermission(req.user, file._firm, 'access', (permission) => {
          if(!permission) {
            res.send({ success: false, message: "You do not have permission to access this File" })
          } else {
            File.query()
            .findById(fileId)
            .update(req.body)
            .returning('*')
            .then((file) => {
              res.send({ success: true, file: file })
            })
            .catch((err) => {
              res.send({ success: false, message: 'Unable to update file.' })
            })
          }
        })
      } else {
        res.send({ success: false, message: "You do not have permission to access this file" })
      }
    })
    .catch((err) => {
      res.send({ success: false, message: 'Unable to update file.' })
    })
}

exports.getSingleClientFilesFolders = (req, res, {
  clientId, limit, offset, startDateISO, endDateISO, include_archived = '',
  filename, firstlvl_only = ''
}) => {

  const fileQueryString = `json_agg(f) as files`;

  const userQueryString = `json_agg(
    DISTINCT (SELECT y FROM (
        SELECT u._id, u.username, u.firstname, u.lastname) as y
      )
    ) as users`;

  const userTwoQueryString = `json_agg(
    DISTINCT (SELECT x FROM (
        SELECT utwo._id, utwo.username, utwo.firstname, utwo.lastname) as x
      )
    ) as requestusers`;

  Client.query()
    .findById(clientId)
    .from('clients as c')
    .leftJoin('files as f', 'f._client', 'c._id')
    .leftJoin('users as u', 'u._id', 'f._user')
    .leftJoin('users as utwo', 'utwo._id', 'f.requestedBy')
    .where(builder => {
      builder.where({
        'c._id': clientId
      })
      if(include_archived === 'true') {
        builder.whereNot({
          'c.status': 'deleted'
        })
      } else {
        builder.where({
          'c.status': 'visible'
        })
      }
    })

    .select(['c._id', 'c.name', 'c.status', 'c.created_at', raw(fileQueryString), raw(userQueryString), raw(userTwoQueryString)])
    .groupBy(['c._id'])
    .skipUndefined()
    .offset(offset)
    .limit(limit)
    .then(c => {

      if(!c) {
        res.send({success: true, files:[], folders: []})
        return;
      }

      const users = c.users && c.users.length > 0 ? c.users : [];

      const rusers = c.requestusers && c.requestusers.length > 0 ? c.requestusers : [];

      if(c.files && c.files.length > 0) {

        c.files = c.files.filter(f => f && f.status != 'deleted');
        
        c.files = c.files.filter(f => {
          if(f && f._id) {
            delete f.updated_at;
            delete f.fileExtension;
            delete f.contentType;
            delete f.rawUrl;
            delete f.document_vectors;
            delete f.prefix;
            delete f.folderString;
            delete f.uploadIp;
            delete f.wasAccessed;
            delete f.fileSize;
            delete f.mangoCompanyID;
            delete f.mangoClientID;
            delete f.ParentID;
            delete f.YellowParentID;
            delete f.DMSParentID;
            delete f._tags;
            delete f.uploadedby;

            f.fileUrl = fileUtils.getFileUrl(f);

            if(f._user) {
              const user = users.filter(u => u && u._id == f._user)[0];

              f.uploadedBy = {
                _id: f._user,
                email: user.username,
                fullname: `${user.firstname} ${user.lastname}`
              }

              // f.uploadedby = `${user.firstname} ${user.lastname}`;
            } else {
              f.uploadedBy = {
                fullname: f.uploadName ? f.uploadName : ""
              }

              //f.uploadedby = f.uploadName ? f.uploadName : "";
            }

            if(f.requestedBy) {
              const user = rusers.filter(u => u && u._id == f.requestedBy)[0];

              f.requestedBy = {
                _id: user._id,
                email: user.username,
                fullname: `${user.firstname} ${user.lastname}`
              }
            } else {
              f.requestedBy = {
                fullname: ""
              }
            }

            delete f.uploadName;

            if(startDateISO && endDateISO) {
              const fileDate = new Date(f.created_at);
              const inRange = fileDate >= startDateISO && fileDate <= endDateISO;

              if(!inRange) {
                return false;
              } else {
                return true;
              }
            } else {
              return true;
            }
          }
        })
        
        let documents = c.files.filter(f => f.category != 'folder');
        let folders = c.files.filter(f => f.category == 'folder');

        delete c.users;
        delete c.requestusers

        if(!!filename) {
          // documents = documents.filter(f => {
          //   return !!f.filename.includes(filename);
          // })

          folders = folders.filter(f => {
            return !!f.filename.includes(filename);
          })

        }

        if(firstlvl_only == 'true') {
          folders = folders.filter(f => {
            return !f._folder
          })
        }
        
        res.send({success: true, files:documents, folders})
      }
    })
    .catch(err => {
      console.log('err', err);
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.getFilesAndFolderByClient = (req, res) => {

  const clientId = req.params.clientId;

  const { date_start, date_end, limit, offset, include_archived, filename, firstlvl_only } = req.query;

  let startDateISO;
  let endDateISO;

  if(date_start, date_end) {
    let startDate = moment(date_start);
    let endDate = moment(date_end);

    if(!startDate.isValid()) {
      res.send({ success: false, message: 'date_start is invalid' });
      return;
    } 

    if(!endDate.isValid()) {
      res.send({ success: false, message: 'date_end is invalid' });
      return;
    }

    startDate = startDate.subtract(1, 'days');
    startDate = startDate.format();
    endDate = endDate.add(1, 'days');
    endDate = endDate.format();

    // global time
    startDateISO = DateTime.fromISO(startDate);
    endDateISO = DateTime.fromISO(endDate);
  }

  const options = { clientId, limit, offset, 
    startDateISO, endDateISO, include_archived, 
    filename, firstlvl_only
  }

  Client.query()
  .select(["_id", "_firm"])
  .findById(clientId)
  .then(client => {
    if(client && client._firm) {
      if(req.firm && req.firm._id) {
        if(!(client._firm == req.firm._id)) {
          res.send({success: false, message: "You don't have permisstion to access this client"});
          return;
        }
        exports.getSingleClientFilesFolders(req, res, options)
      } else if(req.user && req.user._id) {
        permissions.utilCheckFirmPermission(req.user, client._firm, 'access', permission => {
          if(!permission) {
            res.send({success: false, message: "You don't have permission to access this client"});
          } else {
            exports.getSingleClientFilesFolders(req, res, options)
          }
        })
      }

    } else {
      res.send({success: false, message: "Client not found"});
    }
  })
  .catch(err => {
    console.log('err', err);
    res.status(500);
    res.send({success: false, message: "Internal Server Error"})
  })
}

exports.getFolderFiles = (folderId, files) => {  
  let contents = files.filter(r => r._folder == folderId);

  let documents = contents.filter(f => f.category != 'folder');
  let folders = contents.filter(f => f.category == 'folder');

  for(let f of folders) {
    f.files = exports.getFolderFiles(f._id, files);
  }

  return [...folders, ...documents];
}

exports.fetchClientFiles = (req, res, {
  firmId, startDateISO, endDateISO, offset, limit, 
  include_files, file_offset, file_limit, nested
}) => {

  //const fileQueryString = "json_agg((SELECT x FROM (SELECT f.uploadName, f._id, f._firm, f._client, f._user, f._folder, f.filename, f.status, f.category, f.created_at) as x )) as files";

  const fileQueryString = `json_agg(f) as files`;

  const userQueryString = `json_agg(
    DISTINCT (SELECT y FROM (
        SELECT u._id, u.username, u.firstname, u.lastname) as y
      )
    ) as users`;

  const userTwoQueryString = `json_agg(
    DISTINCT (SELECT x FROM (
        SELECT utwo._id, utwo.username, utwo.firstname, utwo.lastname) as x
      )
    ) as requestusers`;

  //const userQueryString = `json_agg(DISTINCT u.*) as users`

  Client.query()
    .from('clients as c')
    .leftJoin('files as f', 'f._client', 'c._id')
    .leftJoin('users as u', 'u._id', 'f._user')
    .leftJoin('users as utwo', 'utwo._id', 'f.requestedBy')
    .where(builder => {
      builder.where({
        'c._firm': firmId,
        'c.status': 'visible'
      })
    })
    // .where(builder => {
    //   builder.whereNot('f.status', 'deleted')
    // })
    .select(['c._id', 'c.name', 'c.status', 'c.created_at', raw(fileQueryString), raw(userQueryString), raw(userTwoQueryString)])
    .groupBy(['c._id'])
    .skipUndefined()
    .offset(offset)
    .limit(limit)
    .then(clients => {
      console.log('clients.length', clients.length);

      if(clients && clients.length <= 0) {
        res.send({success: true, clients: []})
        return;
      }
      clients.map(c => {
        const users = c.users && c.users.length > 0 ? c.users : [];

        const rusers = c.requestusers && c.requestusers.length > 0 ? c.requestusers : [];

        console.log("requestusers", c.requestusers);

        if(c.files && c.files.length > 0) {

          c.files = c.files.filter(f => f && f.status != 'deleted');
          
          c.files = c.files.filter(f => {
            if(f && f._id) {
              delete f.updated_at;
              delete f.fileExtension;
              delete f.contentType;
              delete f.rawUrl;
              delete f.document_vectors;
              delete f.prefix;
              delete f.folderString;
              delete f.uploadIp;
              delete f.wasAccessed;
              delete f.fileSize;
              delete f.mangoCompanyID;
              delete f.mangoClientID;
              delete f.ParentID;
              delete f.YellowParentID;
              delete f.DMSParentID;
              delete f._tags;
              delete f.uploadedby;

              if(f._user) {
                const user = users.filter(u => u && u._id == f._user)[0];

                f.uploadedBy = {
                  _id: f._user,
                  email: user.username,
                  fullname: `${user.firstname} ${user.lastname}`
                }

                // f.uploadedby = `${user.firstname} ${user.lastname}`;
              } else {
                f.uploadedBy = {
                  fullname: f.uploadName ? f.uploadName : ""
                }

                //f.uploadedby = f.uploadName ? f.uploadName : "";
              }

              if(f.requestedBy) {
                const user = rusers.filter(u => u && u._id == f.requestedBy)[0];

                f.requestedBy = {
                  _id: user._id,
                  email: user.username,
                  fullname: `${user.firstname} ${user.lastname}`
                }
              } else {
                f.requestedBy = {
                  fullname: ""
                }
              }

              delete f.uploadName;

              if(startDateISO && endDateISO) {
                const fileDate = new Date(f.created_at);
                const inRange = fileDate >= startDateISO && fileDate <= endDateISO;

                if(!inRange) {
                  return false;
                } else {
                  return true;
                }
              } else {
                return true;
              }
            }
          })

          const files = c.files;

          let rootFiles = files.filter(f => !f._folder);

          for(let r of rootFiles) {
            if(r.category == 'folder') {
              r.files = exports.getFolderFiles(r._id, files);
            }
          }

          let rootDocuments = rootFiles.filter(f => f.category != 'folder');
          let rootFolders = rootFiles.filter(f => f.category == 'folder');

          c.files = [...rootFolders, ...rootDocuments];
        }

        delete c.users;
        delete c.requestusers;
      });

      res.send({success: true, clients});
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.getClientsWithFilesFolders = (req, res) => {

  const firmId = req.params.firmId;

  const { offset, limit, date_start, date_end, include_files,
    file_offset, file_limit, nested } = req.query;

  let startDateISO;
  let endDateISO;

  if(date_start, date_end) {
    let startDate = moment(date_start);
    let endDate = moment(date_end);

    if(!startDate.isValid()) {
      res.send({ success: false, message: 'date_start is invalid' });
      return;
    } 

    if(!endDate.isValid()) {
      res.send({ success: false, message: 'date_end is invalid' });
      return;
    }

    startDate = startDate.subtract(1, 'days');
    startDate = startDate.format();
    endDate = endDate.add(1, 'days');
    endDate = endDate.format();

    // global time
    startDateISO = DateTime.fromISO(startDate);
    endDateISO = DateTime.fromISO(endDate);

    startDateISO = new Date(startDate);
    endDateISO = new Date(endDate);
  }

  const options = {
    firmId, startDateISO, endDateISO, offset, limit, 
    include_files, file_offset, file_limit, nested
  }

  if(req.firm && req.firm._id) {

    if(req.firm._id != firmId) {
      res.send({success: false, message: "You don't have permission to access this firm"});
      return;
    }

    exports.fetchClientFiles(req, res, options);

  } else if(req.user && req.user._id) {
    permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
      if(permission) {
        exports.fetchClientFiles(req, res, options);
      } else {
        res.send({success: false, message: "You don't have permission to access this firm"});
      }
    })
  } else {
    res.status(403);
    res.send({success: false, message: "UNAUTHORIZED - NOT LOGGED IN"});
  }

}

exports.getClientFolderDetails = (req, res) => {

  const clientname = req.query.clientname;
  const foldername = req.query.foldername;

  if (clientname) {
    Client.query()
      .where({
        name: clientname
      })
      .first()
      .then((client) => {
        if (!client) {
          res.send({ success: false, message: 'Client not found' });
        } else {
          if (foldername) {
            File.query()
              .where({
                category: 'folder',
                filename: foldername,
                status: 'visible',
                _client: client._id
              })
              .first()
              .then((file) => {
                console.log('file foldername', file)
                res.send({ success: true, client, file })
              })
              .catch(err => {
                res.status(500);
                res.send({success: false, message: "Internal Server Error"})
              })
          } else {
            res.send({ success: true, client });
          }
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
  } else {
    res.send({ success: false, message: 'Client not found' });
  }
}

exports.createFirm = (req, res) => {

  req.body.apiKey = uuidv4();
  req.body.outward_firm = true;

  if (!req.body.name) {
    res.send({ success: false, message: "incomplete request" });
    return;
  }

  if (req.firm && !!req.firm.developer_account) {
    Firm.query().insert(req.body)
      .returning('*')
      .then(firm => {
        if (firm) {
          const formattedFirm = {
            apiKey: firm.apiKey,
            name: firm.name,
            created_at: firm.created_at,
            updated_at: firm.updated_at,
            _id: firm._id,
            logoUrl: firm.logoUrl
          }

          Subscription.query().insert({
            _firm: firm._id,
            status: "active",
            licenses: 1,
          })
          .returning('*')
          .then(subscription => {
            if(subscription) {
              logger.info(subscription);
            } else {
              logger.error('error creating subscription')
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })

          res.send({ success: true, firm: formattedFirm })
        } else {
          res.send({ success: false, message: "Could not save Firm" })
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
  } else {
    res.send({ success: false, message: "You don't have permission to access this api" })
  }

}

exports.processInviteUser = (req, res, firm) => {
  let invitedUser = req.body.user;

  Staff.query()
    .where({
      _firm: firm._id
    })
    .then(existingStaff => {
      // check if bad email 
      invitedUser.email = invitedUser.email.toLowerCase().trim();
      // regex checks for ____@____.__
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      
      const isValid = re.test(invitedUser.email);

      if(!isValid) {
        //email not valid;
        res.send({success: false, message: "Invalid email address"});
      } else {

        Users.query()
          .where({username: invitedUser.email})
          .first()
          .then(existingUser => {

            if(!existingUser) {
              console.log('user does not exists');
              let passwordHex = Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);
              let userData = {};
              userData.username = invitedUser.email;
              userData.firstname = invitedUser.firstname;
              userData.lastname = invitedUser.lastname;
              userData.password = passwordHex;
              userData.firstLogin = false;
              userData.resetPasswordHex = passwordHex;
              userData.resetPasswordTime = new Date();

              usersController.utilCheckAndSaveUser(userData, response => {
                
                let user = response.user;
                let newStaff = {
                  _user: user._id 
                  , _firm: firm._id
                  , status: 'active'
                  , owner: true
                }

                Staff.query().insert(newStaff)
                .returning('*')
                .then(staff => {
                  if(!staff) {
                    res.send({ success: false, message: "Could not save Staff"})
                  } else {
                    user.currentDate = Date.now();

                    const jwttoken = jwt.sign({...user}, config.secrets.sessionSecret);
                    res.send({success: true, user: user._id, usertoken: jwttoken});
                  }
                })
                .catch(err => {
                  res.send({ success: false, message: err})
                });
              })
            } else {
              
              let user = existingUser;
              let newStaff = {
                _user: user._id 
                , _firm: firm._id
                , status: 'active'
                , owner: true
              }
              const found = existingStaff.some(s => s._user == user._id);

              if(found) {
                user.currentDate = Date.now();
                const jwttoken = jwt.sign({...user}, config.secrets.sessionSecret);
                res.send({success: true, user: user._id, usertoken: jwttoken});
              } else {
                
                Staff.query().insert(newStaff)
                .returning('*')
                .then(staff => {
                  if(!staff) {
                    res.send({ success: false, message: "Could not save Staff"})
                  } else {
                    user.currentDate = Date.now();

                    const jwttoken = jwt.sign({...user}, config.secrets.sessionSecret);
                    res.send({success: true, user: user._id, usertoken: jwttoken});
                  }
                })
                .catch(err => {
                  res.send({ success: false, message: err})
                });
              }
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
  }

exports.inviteUser = (req, res) => {

  let invitedUser = req.body.user ? req.body.user : {};

  if(!invitedUser.email ||
    !invitedUser.firstname ||
    !invitedUser.lastname ||
    !req.body._firm) {
      res.send({success: false, message: 'incomplete request'})
      return;
  }

  Firm.query().findById(req.body._firm)
    .then(firm => {
      if(!firm) {
        res.send({success: false, message: "Firm not found"})
      } else {
        if(req.firm && firm._id == req.firm._id) {
          exports.processInviteUser(req, res, firm);

        } else if (req.user && req.user._id) {
          permissions.utilCheckFirmPermission(req.user, firm._id, 'access', permission => {
            if(!permission) {
              res.send({ success: false, message: "You don't have permission to access this firm" })
            } else {
              exports.processInviteUser(req, res, firm)
            }
          })
        } else {
          res.send({ success: false, message: "You don't have permission to access this firm" })
        }
      }
    })
    .catch(err => {
      res.send({success: false, message: err});
    })
}

exports.getClientsByFirm = (req, res) => {
  const firmId = req.params.firmId;

  if(req && req.firm && (req.firm._id == firmId)) {

    Client.query()
      .where({
        _firm: firmId
      })
      .whereNot({
        status: 'deleted'
      })
      .then((clients) => {
        res.send({success: true, total: clients.length, clients})
      })
      .catch((err) => {
        res.status(500);
        res.send({ success: false, message: err.message })
      })
  } else {
    res.send({ success: false, message: "You don't have permission to access this firm" })
  }
}

exports.generateTFAKey = async (req, res) => {
  Users.query()
    .where({
      secret_2fa: ''
    })
    .then(async (users) => {
      for(let user of users) {

        console.log('user start', user._id);

        if(user.secret_2fa && user.qrcode_2fa) {
          console.log('user done', user._id);
          continue;
        }

        const tempSecret = speakeasy.generateSecret({
          name: `Imaginetime ${user._id} Key`,
          length: 20
        });

        user.qrcode_2fa = tempSecret.otpauth_url;
        user.secret_2fa = tempSecret.base32;

        console.log('new user', user);

        let a = await Users.query()
          .findById(user._id)
          .update({...user})
          .returning('*')
          .then((newUser) => {
            return newUser;
          })
          .catch(err => {
            console.log('user error', err);
          })

        console.log('user done', user._id);

      }

      console.log('update user done!!!!!');
      res.send({users})
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.getFirmDetails = (req, res) => {

  if(req.firm && req.firm._id) {
    let firm = req.firm;

    firm = {
      "_id": firm._id,
      "name": firm.name,
      "logoUrl": firm.logoUrl,
      "domain": firm.domain,
      "eSigAccess": firm.eSigAccess,
      "apiKey": firm.apiKey,
      "contextIdentifier": firm.contextIdentifier,
      "contextUsername": firm.contextUsername,
      "allowCreateFolder": firm.allowCreateFolder,
      "allowDeleteFiles": firm.allowDeleteFiles,
      "zipFilesDownload": firm.zipFilesDownload,
      "showNewLabel": firm.showNewLabel,
      "developer_account": firm.developer_account,
      "outward_firm": firm.outward_firm,
      "created_at": firm.created_at,
      "updated_at": firm.updated_at,
      "domain": firm.domain
    }

    res.send({success: true, firm});
  } else {
    res.send({success: false, message: 'Firm not found'});
  }
}

exports.getFolderContents = (req, res) => {

  const folderId = req.params.folderId;

  const { filename } = req.query;

  if(req.firm && req.firm._id) {    
    if(!isNaN(folderId)) {
      //findbyId
      console.log('get folder contents by filename',folderId)
      File.query()
      .findById(folderId)
      .then((file) => {
        if(!file) {
          res.send({success: false, message: 'File/Folder not found'});
        } else {
          if(file._firm == req.firm._id) {
            File.query()
              .where({
                _folder: folderId,
                _firm: file._firm
              })
              .whereNot({
                status: 'deleted'
              })
              .then((files) => {

                files.map(f => {
                  f.fileUrl = fileUtils.getFileUrl(f);
                });

                if(!!filename) {
                  files = files.filter(f => {
                    return !!f.filename.includes(filename);
                  })
                }

                res.send({success: true, files});
              })
              .catch(err => {
                res.status(500);
                res.send({success: false, message: "Internal Server Error"})
              })
          } else {
            res.send({success: false, message: "You don't have permission to access this file/folder"})
          }
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
    } else {
      //findbyFoldername
      console.log('get folder contents by filename',folderId)
      File.query()
      .where({
        filename: folderId,
        category: 'folder',
        _firm: req.firm._id
      })
      .first()
      .then((file) => {
        if(!file) {
          res.send({success: false, message: 'File/Folder not found'});
        } else {
          if(file._firm == req.firm._id) {
            File.query()
              .where({
                _folder: file._id,
                _firm: file._firm
              })
              .whereNot({
                status: 'deleted'
              })
              .then((files) => {

                files.map(f => {
                  f.fileUrl = fileUtils.getFileUrl(f);
                });

                if(!!filename) {
                  files = files.filter(f => {
                    return !!f.filename.includes(filename);
                  })
                }

                res.send({success: true, files});
              })
              .catch(err => {
                res.status(500);
                res.send({success: false, message: "Internal Server Error"})
              })
          } else {
            res.send({success: false, message: "You don't have permission to access this file/folder"})
          }
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
    }
    
  } else {
    res.send({success: false, message: "You don't have permission to access this file/folder"})
  }
}

exports.fetchGeneralStaffFiles = (req, res, {
  user, startDateISO, endDateISO, offset, limit, firmId
}) => {
  File.query()
    .select(['files._id', 'files.filename', 'files._client', 
      'files._firm', 'files._user', 'files._folder', 'files.category',
      'files.status', 'files.requestedBy', 'files.uploadName', 'files.created_at'])
    .select(['uone.username', 'uone.firstname', 'uone.lastname'])
    .select(['utwo.username as reqUsername', 'utwo.firstname as reqFirstname', 'utwo.lastname as reqLastname'])
    .leftJoin('users as uone', 'uone._id', 'files._user')
    .leftJoin('users as utwo', 'utwo._id', 'files.requestedBy')
    .where({
      _firm: firmId,
      _client: null
    })
    .whereNot({
      status: 'deleted'
    })
    .where(builder => {
      if(startDateISO && endDateISO) {
        builder.whereBetween('files.created_at', [startDateISO, endDateISO])
      }
    })
    .skipUndefined()
    .offset(offset)
    .limit(limit)
    .orderBy('files.created_at', 'desc')
    .then((files) => {

      files.map(f => {

        if(f._user) {
          f.uploadedBy = {
            _id: f._user,
            email: f.username,
            fullname: `${f.firstname} ${f.lastname}`
          }
        } else {
          f.uploadedBy = {
            fullname: f.uploadName ? f.uploadName : ""
          }
        }

        if(f.requestedBy) {
          f.requestedBy = {
            _id: f.requestedBy,
            email: f.reqUsername,
            fullname: `${f.reqFirstname} ${f.reqLastname}`
          }
        } else {
          f.requestedBy = {
            fullname: ""
          }
        }

        delete f._user;
        delete f.username;
        delete f.firstname;
        delete f.lastname;
        delete f.uploadName

        delete f.reqUsername;
        delete f.reqFirstname;
        delete f.reqLastname;

      })

      if(user == 'all') {
        Staff.query()
          .select(["staff._user", "staff._firm", "staff.status", "staff.status"])
          .select(`users.username`,`users.firstname`, `users.lastname`)
          .leftJoin('users', 'users._id', 'staff._user')
          .where({
            _firm: firmId,
            status: 'active'
          })
          .then(staffs => {

            for(let staff of staffs) {

              let documents = files.filter((f) => {
                return f._personal == staff._user && f.category != "folder"
              })
      
              let folders = files.filter((f) => {
                return f._personal == staff._user && f.category == "folder"
              })

              staff.files = {files: documents, folders} 
            }
            res.send({success: true, staffs})
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      } else if (!!user) {
        Staff.query()
          .select(["staff._id", "staff._user", "staff._firm", "staff.status"])
          .select(`users.username`,`users.firstname`, `users.lastname`)
          .leftJoin('users', 'users._id', 'staff._user')
          .where({
            _firm: firmId,
            _user: user,
            status: 'active'
          })
          .first()
          .then((staff) => {
            console.log('staff', staff);
            if(!(staff && staff._id)) {
              res.send({success: false, message: "Staff not found"});
            } else {
              let documents = files.filter((f) => {
                return f._personal == user && f.category != "folder"
              })
      
              let folders = files.filter((f) => {
                return f._personal == user && f.category == "folder"
              })

              let staffs = [{
                ...staff,
                files: {files: documents, folders}
              }]

              res.send({success: true, staffs})
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal Server Error"})
          })
      } else {
        //get general files

        let documents = files.filter((f) => {
          return !f._personal && f.category != "folder"
        });

        let folders = files.filter((f) => {
          return !f._personal && f.category == "folder"
        });

        let staffs = [{
          files: {files: documents, folders}
        }];

        res.send({success: true, staffs})
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
}

exports.getGeneralStaffFiles = async (req, res) => {

  const firmId = req.params.firmId;

  const {user, date_start, date_end, offset, limit} = req.query;

  let startDateISO;
  let endDateISO;

  if(date_start, date_end) {
    let startDate = moment(date_start);
    let endDate = moment(date_end);

    if(!startDate.isValid()) {
      res.send({ success: false, message: 'date_start is invalid' });
      return;
    } 

    if(!endDate.isValid()) {
      res.send({ success: false, message: 'date_end is invalid' });
      return;
    }

    startDate = startDate.subtract(1, 'days');
    startDate = startDate.format();
    endDate = endDate.add(1, 'days');
    endDate = endDate.format();

    // global time
    startDateISO = DateTime.fromISO(startDate);
    endDateISO = DateTime.fromISO(endDate);
  }

  const options = {
    startDateISO, endDateISO, user, offset, limit, firmId
  }

  if(req.firm && req.firm._id) {
    if(req.firm._id == firmId) {
      exports.fetchGeneralStaffFiles(req, res, options)
    } else {
      res.send({success: false, message: "You don't have permission to access this firm"})
    }
  } else if(req.user && req.user._id) {
    permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
      if(!permission) {
        res.send({success: false, message: "You don't have permission to access this firm"});
      } else {
        exports.fetchGeneralStaffFiles(req, res, options)
      }
    })
  }
}

exports.getSignatureRequestDetails = (req, res) => {

  let link = req.body.link;

  link = link.split("/");

  const hex = !!link[link.length - 1] ? link[link.length - 1] : '';

  if(req.firm && req.firm._id) {
    const firmId = req.firm._id;
    if(hex) {
      ShareLink.query()
        .where({
          _firm: firmId,
          hex,
          type: "signature-request"
        })
        .first()
        .then(async sharelink => {
          if(sharelink && sharelink._quickTask) {
            let quickTask = await QuickTask.query()
              .findById(sharelink._quickTask)
              .then(quickTask => {
                return quickTask;
              })

            let user;

            if(sharelink && sharelink._createdBy) {
              user = await Users.query()
                .findById(sharelink._createdBy)
                .then(user => {
                  return user;
                })
            }

            let signers = quickTask && quickTask.signingLinks && quickTask.signingLinks.length > 0 ? quickTask.signingLinks : [];

            const apiResponse = {
              signers: signers.map(s => { return {name: s.signerName, email: s.signatoryEmail }}),
              signedDate: quickTask.responseDate,
              requestedBy: user && user._id ? {
                _id: user._id,
                email: user.username,
                firstname: user.firstname,
                lastname: user.lastname
              } : {},
              requestedDate: sharelink.created_at
            }

            res.send({ success: true, details: {...apiResponse} });
          } else {
            res.send({success: false, message: "You don't have permission to access the link"});
          }
        })
        .catch(err => {
          res.status(500);
          res.send({success: false, message: "Internal Server Error"})
        })
    } else {
      res.send({success: false, message: "You don't have permission to access the link"});
    }
  } else {
    res.send({success: false, message: "You don't have permission to access the link"});
  }

}

exports.downloadFile = (req, res) => {
  const fileId = req.params.fileId;

  console.log("file firn", req.firm);
  if(req.firm && req.firm._id) {
    const firmId = req.firm._id;
    File.query()
      .where({
        _firm: firmId,
        _id: fileId
      })
      .first()
      .then(file => {
        if(file && file._id) {
          filesController.utilDownloadFile(req, file, res);
        } else {
          res.status(404);
          res.send({success: false, message: "File not found"})
        }
      })
      .catch(err => {
        res.status(404);
        res.send({success: false, message: "File not found"})
      })
  } else {
    res.send({success: false, message: "You don't have permission to access this file"});
  }
}

let RootFolder = '';

exports.getRootFolder = async (folderId) => {
  await File.query()
  .findById(folderId)
  .then(async (file) => {
    if(file._folder) {
      await exports.getRootFolder(file._folder);
    } else {
      RootFolder = file;
    }
  })
  .catch(err => {
    RootFolder = ''
  })
}

exports.setUserStatus = (req, res) => {

  if(!req.body.status || !req.body.firm) {
    res.send({success: false, message: 'incomplete request'})
    return
  }

  const userId = req.params.userId;
  const firmId = req.body.firm;
  const status = req.body.status;

  if(req.firm && (req.firm._id == firmId)) {
    exports.callSetUserStatusDB({req, res, firmId, userId, status});

  } else if (req.user && req.user._id) {
    permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
      if(!permission) {
        res.send({success: false, message: "You don't have permission to access this firm"});
      } else {
        exports.callSetUserStatusDB({req, res, firmId, userId, status});
      }
    })
  } else {
    res.send({success: false, message: "UNAUTHORIZED - NOT LOGGED IN"});
  }
}

exports.callSetUserStatusDB = ({
  req,
  res,
  userId,
  firmId,
  status
}) => {
  if(status == 'deleted') {
    Staff.query()
    .where({
      _user: userId,
      _firm: firmId
    })
    .first()
    .then(staff => {
      if(!!staff) {
        StaffClient.query()
        .where('_staff', staff._id)
        .delete()
        .asCallback((err, staffClient) => {
          if (err) {
            res.send({ success: false, message: err });
          } else {
            Staff.query()
            .findById(staff._id)
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
      } else {
        res.send({ success: false, message: 'Staff not found' });
      }
    })
  } else {
    Staff.query()
    .where({
      _user: userId,
      _firm: firmId
    })
    .update({
      status: status
    })
    .returning('*')
    .then((staff) => {
      res.send({success: true, message: `User set to ${status}`});
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal Server Error"})
    })
  }
}
exports.searchFiles = (req, res) => {

  const firmId = req.params.firmId;

  const keyword = req.body.keyword ? req.body.keyword.toLowerCase() : '';

  if(req.firm && req.firm._id && firmId == req.firm._id) {
    File.query()
      .where({
        _firm: firmId
      })
      .whereNot({
        status: 'deleted'
      })
      .then((files) => {
        res.send({success: true, files});
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
  } else if(req.user && req.user._id) {
    res.send({success: true, files: []})
  } else {
    res.send({success: false, message: "You don't have permission to access this firm"});
  }
}

exports.checkFolderByPath = async (pathname, folderId) => {
  let file = await File.query()
    .where({
      _firm: firmId,
      client: null,
      category: 'folder',
      filename: path
    })
    .then(file => {
      return file && file._id ? file : {};
    })
    .catch(err => {
      return {};
    })
}

getSubFoldersByPath = ({
  client = null,
  paths = [],
  firmId,
  res
}) => {
  let promiseArr = [];
  paths.map(path => {
    const query = File.query()
      .where({
        _firm: firmId,
        category: "folder",
        filename: path,
        status: "visible",
        _client: client
      })
      .then(folder => {
        return folder;
      });

    promiseArr.push(query);
  })

  Promise.all([...promiseArr])
  .then(paths => {
    let markedFolder = {};
    let pathsChecker = [];

    let rootFolders = paths[0];

    rootFolders = rootFolders.filter(x => !x._folder);

    if(rootFolders.length > 0) paths.shift();

    if(paths.length <= 0) {
      markedFolder = rootFolders[0];
      pathsChecker.push(true);
    } else {
      for(let root of rootFolders) {
        for(const [i,path] of paths.entries()) {
          pathsChecker[i] = false;
          for(const x of path) {
            if(x._folder == root._id) {
              markedFolder = x;
              pathsChecker[i] = true;
              continue;
            }
          }
          root = markedFolder;
          if(!pathsChecker[i]) break;
        }

        if(pathsChecker.every(x => !!x)) break;
      }
    }
    
    if(pathsChecker.every(x => !!x) && !!markedFolder._id) {
      delete markedFolder.uri;
      let file = markedFolder;

      if(file._client) {
        file.fileUrl = `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._id}/folder/` 
      } else {
        file.fileUrl = `https://${appUrl}/firm/${file._firm}/files/public/${file._id}/folder/`
      }

      res.send({success: true, folder: file});
    } else {
      res.send({success: false, message: "Folder not found"});
    }
  })
}

exports.getFolderByPath = (req, res) => {

  const firmId = req.body.firmId;

  if(!req.body.pathname ||
    !req.body.firmId) {
      res.send({success: false, message: "incomplete request"});
      return;
  }

  if(req.firm && req.firm._id) {
    if(req.firm._id != firmId) {
      res.send({success: false, message: "You don't have permission to access this firm"});
      return;
    }
  }

  let paths = req.body.pathname;

  paths = paths.split('/').filter(x => !!x);

  console.log('paths', paths);
  const rootFolder = paths[0];

  console.log('rootFolder', rootFolder);

  if(paths.length > 1) paths.shift()

  else paths = [];

  if(rootFolder == 'General Files') {
    getSubFoldersByPath({
      paths,
      client: null,
      firmId,
      res
    })
  } else {  
    //check client;
    Client.query()
      .where({
        name: rootFolder,
        _firm: firmId
      })
      .first()
      .then(client => {
        console.log('firmId', client);
        if(!!client) {
          getSubFoldersByPath({
            paths,
            client: client._id,
            firmId,
            res
          })
        } else {
          res.send({success: false, message: 'Root folder not found'});
        }
      })
  }
}

exports.updateMangoFields = (req, res) => {

  const firmId = req.params.firmId;
  const clientId = req.params.clientId;

  const mangoClientID = Object.keys(req.body).includes('mangoClientID') ? req.body.mangoClientID : null;
  const mangoCompanyID = Object.keys(req.body).includes('mangoCompanyID') ? req.body.mangoCompanyID : null;

  if(!mangoCompanyID || !mangoClientID) {
    res.send({success: false, message: 'Incomplete request'});
    return;
  }
  
  Client.query()
    .where({
      _firm: firmId,
      _id: clientId
    })
    .first()
    .then(client => {
      console.log('client', client);
      if(client && client._id) {
        File.query()
          .where({
            _firm: client._firm,
            _client: client._id
          })
          .whereNot({
            status: 'deleted'
          })
          .update({
            mangoCompanyID,
            mangoClientID
          })
          .returning(['_id', 'filename', 'category', '_firm', '_client', 'mangoCompanyID', 'mangoClientID'])
          .then((files) => {
            console.log('files', files.length);
            res.send({success: true, files})
          })
          .catch(err => {
            res.send({success: false, message: "Failed to update files"})
          })
      } else {
        res.send({success: false, message: 'Client not found'});
      }
    })
    .catch(err => {
      res.send({success: false, message: 'Client not found'});
    })
}

exports.getFileByUniqueId = (req, res) => {

  const uniqueId = req.params.uniqueId;

  File.query()
    .where({
      uniqueId
    })
    .first()
    .then(file => {
      if(file && file._id) {
        if(req && req.firm) {
          if(req.firm._id == file._firm) {
            res.send({success: true, file});
          } else {
            res.send({success: false, message: "You don't have permission to access this file"});
          }
        } else if(req.user && req.user._id) {
          permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
            if(permission) {
              res.send({success: true, file});
            } else {
              res.send({success: false, message: "You don't have permission to access this file"});
            }
          });
        }
      } else {
        res.send({success: false, message: 'File not found'});
      }

    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: 'Internal server error'});
    })
}

exports.generateTempApiKey = (req, res) => {
  if(req.firm && req.firm._id) {
    const apiKey = uuidv4();

    const { _client, type, files, _folder } = req.body;

    const data = {
      _firm: req.firm._id,
      _client: !!_client ? _client : null,
      _folder: !!_folder ? _folder : null,
      token: apiKey,
      type: !!type ? type: '',
      files: !!files ? JSON.stringify(files): JSON.stringify([])
    }

    ShareLinkToken.query()
      .insert({...data})
      .returning('*')
      .then(sharelinktoken => {
        console.log('sharelinktoken', sharelinktoken);
        if(sharelinktoken && sharelinktoken._id) {
          setTimeout(() => {
            ShareLinkToken.query()
              .findById(sharelinktoken._id)
              .del()
              .returning('*')
              .then((data) => {
                console.log('temp token is deleted', data);
              })
          }, 1000 * 60 * 60);
        }
        res.send({success: true, token: apiKey})
      })
      .catch(err => {
        console.log('err', err);
        res.status(500);
        res.send({success: false, message: 'Internal server error'});
      })

  } else {
    res.status(500);
    res.send({success: false, message: 'Internal server error'});
  }
}

exports.getTempApiKeyDetails = (req, res) => {

  const { token } = req.params;

  console.log('req.params', token);
  if(!!token) {
    ShareLinkToken.query()
      .where({
        token: token
      })
      .first()
      .then(data => {
        if(!data) {
          res.send({status: false, message: 'invalid token'});
        } else {
          res.send({status: true, key: data});
        }
      })
  } else {
    res.send({status: false, message: 'token is missing'});
  }
}

exports.deleteTempApiKey = (req, res) => {

  const { token } = req.body;

  if(!token) {
    res.send({success: false, message: 'incomplete request'});
  } else {
    ShareLinkToken.query()
    .where({
      token: token
    })
    .del()
    .returning('*')
    .then((data) => {
      console.log('temp token is deleted', data);
      res.send({success: true, message: 'token deleted'})
    })
  }

}

exports.getFirmDomains = async (req, res) => {
  Firm.query()
    .where(builder => {
      builder.where('domain', 'like', '%lexshare.io%')
    })
    .select(['_id', 'domain', 'name'])
    .then((firms) => {
      res.send(firms.map(x => x.domain));
    });

}

exports.reauthenticateUserToken = (req, res) => {

  if(!!req.user) {

  } else {
    res.send({success: false, message: "Cannot find user record"});
  }
}


exports.createFileMangoByFile = (firm, client, file, callback) => {
  if (client && client._id && firm && firm.mangoCompanyID && firm.mangoApiKey) {
    const MANGO_CREATE_FILE = mangobilling.MANGO_CREATE_FILE;
    const uniqueName = `${Math.floor(Math.random()*16777215).toString(16)}-${Math.floor(Math.random()*16777215).toString(16)}_${file.filename}`;
    const requestBody = {
      "CompanyID": file.mangoCompanyID,
      "IShareCompanyID": file._firm,
      "IShareDMSParentID": file._id,
      "IShareClientID": file._client,
      "ClientID": file.mangoClientID,
      "FName": file.filename,
      "ParentID": file.ParentID,
      "YellowParentID": file.YellowParentID,
      "ISharePublicFileUrl": `https://${appUrl}/api/files/download/${file._firm}/${file._client}/${file._id}/${file.filename}`,
      "UniqueName": uniqueName,
      "FileType": file.fileExtension,
      "Size": file.fileSize ? (parseInt(file.fileSize) / 1000) + "kb" : "0kb",
      "ShowInPortal": true
    }
    axios({
      method: 'POST',
      url: MANGO_CREATE_FILE,
      data: requestBody,
      headers: {
        'vendorAPIToken': firm.mangoApiKey,
        'Content-Type': 'application/json'
      }
    })
    .then(({data}) => {
      const mangoRes = data;
      if(mangoRes && mangoRes.data && mangoRes.data.dmsParentID) {
        File.query()
          .findById(file._id)
          .update({
            filename: file.filename,
            DMSParentID: mangoRes.data.dmsParentID
          })
          .returning('*')
          .then((file) => {
            callback({ success: true });
            //callback(null, file);
          })
          .catch(err => {
            callback({ success: true });
            //callback(null, file);
          })
      } else {
        callback({ success: true });
      }
    })
    .catch((err) => {
      console.log('MANGO_CREATE_FILE ERROR', err);
      //callback(null, file);
    })
  } else {
    callback({ success: false });
  }
}

exports.updateUser = (req, res) => {
  
  if(!req.body.firstname ||
    !req.body.lastname ||
    !req.body.firm) {
      res.send({success: false, message: 'incomplete request'})
      return
    }

  const userId = req.params.userId;
  const firmId = req.body.firm;

  if(req.firm && (req.firm._id == firmId)) {
    Staff.query()
      .where({
        _user: userId,
        _firm: firmId
      })
      .first()
      .then((staff) => {
        if(!!staff) {
          exports.callUpdateUserDB({req, res, userId});
        } else {
          res.send({success: false, message: "You don't have permission to update this user"});
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
  } else if (req.user && req.user._id) {
    //check if staff else check if current user is equal to the params userId
    permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
      if(!permission) {
        if(req.user._id == userId) {
          exports.callUpdateUserDB({req, res, userId});
        } else {
          res.send({success: false, message: "You don't have permission to access this firm"});
        }
      } else {
        exports.callUpdateUserDB({req, res, userId});
      }
    })
  }
}

exports.callUpdateUserDB = ({
  req,
  res,
  userId
}) => {
  Users.query()
  .findById(userId)
  .then(user => {
    if(!!user) {  
      Users.query()
        .findById(userId)
        .update({
          username: user.username,
          firstname: req.body.firstname,
          lastname: req.body.lastname
        })
        .returning('*')
        .then(user => {
          res.send({success: true, user});
        })
        .catch(err => {
          console.log('update user err', err);
          res.status(500);
          res.send({success: false, message: "Internal Server Error"})
        })
    } else {
      res.send({success: false, message: 'User not found'});
    }
  })
  .catch(err => {
    console.log('update user err', err);
    res.status(500);
    res.send({success: false, message: "Internal Server Error"})
  })

}

exports.downloadFileMango = (req, res) => {
  const fileId = req.params.fileId;

  File.query()
    .findById(fileId)
    .then(file => {
      filesController.utilDownloadFile(req, file, res);
    })
    .catch(err => {
      res.status(500);
      res.send({ success: false, message: err.message });
    })
}

exports.getCurrentUser = (req, res) => {

  if(req.user && req.user._id) {
    delete req.user.password_salt;  
    delete req.user.secret_2fa;
    delete req.user.qrcode_2fa;
    delete req.user.ssotoken;
    delete req.user.password_hash;
    delete req.user.resetPasswordTime;
    delete req.user.resetPasswordHex;
  }

  res.send({ success: true, user: !!req.user ? req.user : {} });
}

exports.bulkUpload = (req, res) => {

  let uploadIp = '';

  if(req.ip && typeof(req.ip) == 'string') {
    uploadIp = req.ip;
  }

  let fileObjectKeys = {
    uploadIp
  };

  let form = new multiparty.Form();

  form.on('error', err => {
    console.log('Error parsing form', + err.stack);
    res.send({success: false, message: "Failed to upload the file. Please try again."});
    return;
  })
  form.on('field', (name, value) => {
    console.log('name', name);
    if(name == '_firm') {
      console.log('this is the firm', name);
      fileObjectKeys['_firm'] = !!value ? value : null
    } else if(name == '_client') {
      fileObjectKeys['_client'] = !!value ? value : null;
    } else if (name == "_folder") {
      fileObjectKeys['_folder'] = !!value ? value : null;
    } else {
      fileObjectKeys[name] = !!value ? value : "";
    }
  })
  form.parse(req, (err, fields, files) => {
    if(err) {
      res.send({ success: false, message: err });
    } else if(!files || !files[0]) {
      res.send({ success: false, message: "No file present in request" })
    } else {
      res.send({ success: true, files: [] });

      let multipleFiles = [];

      let promiseList = [];

      files = Object.values(files);

      console.log('files', files);
      
      for(const file of files) {

        console.log('file', file);

        let newFile = {...fileObjectKeys};

        let contentType = file[0].headers['content-type'];

        let fileExtension = file[0].originalFilename.substring(file[0].originalFilename.lastIndexOf('.'), file[0].originalFilename.length);

        newFile.filename = file[0].originalFilename;
        newFile.fileExtension = fileExtension;
        newFile.contentType = contentType;

        if(contentType.includes('pdf') || contentType.includes('text')) {
          newFile.category = 'document'
        } else if(contentType.includes('image')) {
          newFile.category = 'image'
        } else if(contentType.includes('video')) {
          newFile.category = 'video'
        }

        newFile.rawUrl = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${newFile._id}${fileExtension}`
        newFile.fileSize = file[0].size

        promiseList.push(
          File.query()
          .insert(newFile)
          .returning('*')
          .then(newFile => {
            if(!newFile) {
              return null;
            } else {
              console.log('newFile', newFile);
              const fileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);
              const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);

              const stats = fs.statSync(file[0].path);
              const streamProgress = progress({
                length: stats.size,
                time: 200 // The interval at which events are emitted in milliseconds.
              });
              streamProgress.on('progress', progress => {
                console.log("PROGRESS!", progress, newFile.filename);
              })

              fs.createReadStream(file[0].path)
              .pipe(streamProgress) // pipe to the method above so we can keep track of upload progress via the socket connection.
              .pipe(fileDestination.createWriteStream({ gzip: true }))
              .on('error', err => {
                logger.error("ERROR: in createReadStream ", newFile.filename);
                logger.info(err)
              })
              .on('finish', () => {
                logger.info("Finished uploading file", newFile.filename);
                multipleFiles.push(newFile);
              });

              return newFile;
            }
          })
          .catch(err => {
            return null;
          })
        )
      }

      Promise.all(promiseList)
        .then(files => {
          file = files.filter(f => !!f); //remove null objects;
          console.log('total files uploaded', files.length);
        })
        .catch(err => {
          console.log('error : ', err.message);
        })
    }
  })
}

exports.handleUpload = (req, res) => {
  let uploadIp = '';

  if(req.ip && typeof(req.ip) == 'string') {
    uploadIp = req.ip;
  }

  let fileObjectKeys = {
    uploadIp
  };

  let form = new multiparty.Form();

  form.on('error', err => {
    console.log('Error parsing form', + err.stack);
    res.send({success: false, message: "Failed to upload the file. Please try again."});
    return;
  })
  form.on('field', (name, value) => {
    console.log('name', name);
    if(name == '_firm') {
      fileObjectKeys['_firm'] = !!value ? value : null
    } else if(name == '_client') {
      fileObjectKeys['_client'] = !!value ? value : null;
    } else if (name == "_folder") {
      fileObjectKeys['_folder'] = !!value ? value : null;
    } else {
      fileObjectKeys[name] = !!value ? value : "";
    }
  })
  form.parse(req, (err, fields, files) => {
    if(err) {
      res.send({ success: false, message: err });
    } else if(!files || !files[0]) {
      res.send({ success: false, message: "No file present in request" })
    } else {
      let multipleFiles = [];

      let promiseList = [];

      files = Object.values(files);

      console.log('files', files);
      
      for(const file of files) {

        console.log('file', file);

        let newFile = {...fileObjectKeys};

        let contentType = file[0].headers['content-type'];

        let fileExtension = file[0].originalFilename.substring(file[0].originalFilename.lastIndexOf('.'), file[0].originalFilename.length);

        newFile.filename = file[0].originalFilename;
        newFile.fileExtension = fileExtension;
        newFile.contentType = contentType;

        if(contentType.includes('pdf') || contentType.includes('text')) {
          newFile.category = 'document'
        } else if(contentType.includes('image')) {
          newFile.category = 'image'
        } else if(contentType.includes('video')) {
          newFile.category = 'video'
        }

        newFile.rawUrl = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${newFile._id}${fileExtension}`
        newFile.fileSize = file[0].size
        newFile.status = 'visible';

        promiseList.push(
          File.query()
          .insert(newFile)
          .returning(['_id', '_firm', '_client', 'filename', 'fileExtension', 'contentType', 'category', 'fileSize'])
          .then(newFile => {
            if(!newFile) {
              return null;
            } else {
              console.log('newFile', newFile);
              const fileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);
              const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);

              const stats = fs.statSync(file[0].path);
              const streamProgress = progress({
                length: stats.size,
                time: 200 // The interval at which events are emitted in milliseconds.
              });
              streamProgress.on('progress', progress => {
                console.log("PROGRESS!", progress, newFile.filename);
              })

              return new Promise((resolve, reject) => {
                fs.createReadStream(file[0].path)
                .pipe(streamProgress) // pipe to the method above so we can keep track of upload progress via the socket connection.
                .pipe(fileDestination.createWriteStream({ gzip: true }))
                .on('error', err => {
                  logger.error("ERROR: in createReadStream ", newFile.filename);
                  logger.info(err)
                  reject(null)
                })
                .on('finish', () => {
                  logger.info("Finished uploading file", newFile.filename);
                  multipleFiles.push(newFile);
                  resolve(newFile);
                });
              })
            }
          })
          .catch(err => {
            console.log('err', err);
            return null;
          })
        )
      }

      Promise.all(promiseList)
        .then(files => {
          console.log('files',files);
          files = files.filter(f => !!f)//remove null objects;
          console.log('total files uploaded', files.length);
          res.send({ success: true, files: multipleFiles });
        })
        .catch(err => {
          console.log('error : ', err.message);
          res.send({ success: false, message: 'Failed to upload file' });
        })
    }
  })
}

exports.syncUpload = (req, res) => {
  
  const { firmId } = req.params;

  if(req.firm && (req.firm._id == firmId)) {
    exports.handleUpload(req, res);
  } else {
    permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
      if(!permission) {
        res.send({success: false, message: "You don't have permission to access this firm"});
      } else {
        exports.handleUpload(req, res);
      }
    })
  }
}

exports.getClientUsers = (req, res) => {
  const firmId = req.params.firmId;
  const clientId = req.params.clientId;

  integrationDao.hasPermission(req, firmId)
    .then(permission => {
      integrationDao.fetchClientUsers(firmId, clientId)
        .then(clientUsers => {
          res.send({success: true, clientUsers});
        })
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal server error"});
    })
}

exports.getStaffUsersByFirm = (req, res) => {
  const firmId = req.params.firmId;

  integrationDao.hasPermission(req, firmId)
    .then(permission => {
      if(!!permission) {
        integrationDao.fetchStaffUsers(firmId)
          .then(staffs => {
            console.log('staffs', staffs);
            res.send({success: true, staffs});
          })
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal server error"});
    })
}

exports.createOrUpdateStaffUser = (req, res) => {
  console.log('calling create/update staff api')
  //check client user fields exists
  if(!req.body._firm || !req.body.email 
    || !req.body.firstname || !req.body.lastname) {
      res.send({success: false, message: 'Incomplete request for contact. Required fields are _firm, _client, email, firstname, lastname'});
      return;
    }

  //check value for status
  if(req.body.hasOwnProperty('status')) {
    if(!['active', 'archived', 'deleted'].includes(req.body.status)) {
      res.send({success: false, message: "Invalid value for field status: Accepted values: [active, archived, deleted]"});
      return;
    }
  }

  //if address object exists, check fields
  if(req.body.hasOwnProperty('address')) {
    const address = req.body.address;
    if((!address.street1 || !address.city || !address.state 
      || !address.postal || !address.country)) {
      res.send({success: false, message: 'Incomplete request for address. Required field/s: [street1, city, state, postal, country]'});
      return;
    }
  }
  
  //if phone object exists, check fields
  if(req.body.hasOwnProperty('phoneNumber')) {
    const phoneNumber = req.body.phoneNumber;
    if(!phoneNumber.number) {
      res.send({success: false, message: 'Incomplete request for address. Required field/s: [number]'});
      return;
    }
  }

  const firmId = req.body._firm;

  const {userId} = req.body;

  integrationDao.hasPermission(req, firmId)
  .then(async permission => {
    if(!!permission) {
      if(!!req.body._client) {
        //check if client is under req.firm;
        const clientId = req.body._client;
        const hasClientPermission = await integrationDao.hasClientPermission(req.user, firmId, clientId);

        if(!hasClientPermission) {
          res.send({success: false, message: "You don't have permission to access this client"});
          return;
        }
      }

      integrationDao.createClientOrStaffUser(req.body, userId, 'staff')
      .then(user => {
        res.send({success: true, user})
      })
      .catch(err => {
        console.log('create client user api err', err);
        res.status(500);
        res.send({success: false, message: 'Internal server error'});
      })
    } else {
      res.send({success: false, message: "You don't have permission to access this firm"});
    }
  })
  .catch(err => {
    res.status(500)
    res.send({success: false, message: "Internal server error"});
  })


}

exports.createOrUpdateClientUser = (req, res) => {

  //check client user fields exists
  if(!req.body._firm || !req.body._client || !req.body.email 
    || !req.body.firstname || !req.body.lastname) {
      res.send({success: false, message: 'Incomplete request for contact. Required field/s: [_firm, _client, email, firstname, lastname]'});
      return;
    }

  //check value for status
  if(req.body.hasOwnProperty('status')) {
    if(!['active', 'archived', 'deleted'].includes(req.body.status)) {
      res.send({success: false, message: "Invalid value for field status: Accepted values: [active, archived, deleted]"});
      return;
    }
  }

  //if address object exists, check fields
  if(req.body.hasOwnProperty('address')) {
    const address = req.body.address;
    if((!address.street1 || !address.city || !address.state 
      || !address.postal || !address.country)) {
      res.send({success: false, message: 'Incomplete request for address. Required field/s: [street1, city, state, postal, country]'});
      return;
    }
  }

  //if phone object exists, check fields
  if(req.body.hasOwnProperty('phoneNumber')) {
    const phoneNumber = req.body.phoneNumber;
    if(!phoneNumber.number) {
      res.send({success: false, message: 'Incomplete request for address. Required field/s: [number]'});
      return;
    }
  }

  const firmId = req.body._firm;
  const userId = req.params.userId;

  integrationDao.hasPermission(req, firmId)
    .then(permission => {
      if(!!permission) {
        integrationDao.createClientOrStaffUser(req.body, userId, 'clientUser')
        .then(user => {
          res.send({success: true, user})
        })
        .catch(err => {
          console.log('create client user api err', err);
          res.status(500);
          res.send({success: false, message: 'Internal server error'});
        })
      } else {
        res.send({success: false, message: "You don't have permission to access this firm"});
      }
    })
    .catch(err => {
      res.status(500)
      res.send({success: false, message: "Internal server error"});
    })
}

exports.resetFields = (req, res) => {
  const mangoCompanyID = req.params.mangoCompanyID;

  let promiseList = [];

  promiseList.push(Client.query()
    .where({
      mangoCompanyID
    })
    .update({
      mangoCompanyID: null,
      mangoClientID: null,
      isMangoClient: false,
      isIntegrated: false
    })
    .returning('*')
    .then(clients => {
      return clients;
    })
    .catch(err => {
      return null;
    })
  );

  promiseList.push(File.query()
    .where({
      mangoCompanyID
    })
    .update({
      mangoCompanyID: null,
      mangoClientID: null,
      DMSParentID: null,
      ParentID: null,
      YellowParentID: null
    })
    .returning('*')
    .then(files => {
      return files;
    })
    .catch(err => {
      return null;
    })
  )
  
  Promise.all(promiseList)
    .then(results => {
      res.send({success: true, message: 'Successfully reset the fields'});
    })
    .catch(err => {
      res.send({success: false, message: err.message});
    })
}
