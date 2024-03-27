/**
 * Sever-side controllers for File.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the File
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */
const config = require('../../config')[process.env.NODE_ENV];

let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

const permissions = require('../../global/utils/permissions')

const fileUtils = require('../../global/utils/fileUtils')

const secrets = config.secrets;
// set up Google environment variables
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = config.gcloud.keyPath;
const bucketName = config.gcloud.bucketName;

const { Storage } = require('@google-cloud/storage');
const DateTime = require('luxon').DateTime;
const moment = require('moment');
const storage = new Storage();

const { v4: uuidv4 } = require('uuid');

const contentDisposition = require('content-disposition')

// import model
const Staff = require('../staff/StaffModel');
const StaffClient = require('../staffClient/StaffClientModel');
const User = require('../user/UserModel');
const ClientUser = require('../clientUser/ClientUserModel');
const Client = require('../client/ClientModel');
const Firm = require('../firm/FirmModel');
const File = require('./FileModel');
const Tag = require('../tag/TagModel');
const ShareLink = require('../shareLink/ShareLinkModel');
const RequestTask = require('../requestTask/RequestTaskModel');
const Activity = require('../activity/ActivityModel');
const Notification = require('../notification/NotificationModel');
const FileSynchronization = require('../fileSynchronization/FileSynchronizationModel');

// controllers
const staffClientsCtrl = require('../staffClient/staffClientsController');
const clientUsersCtrl = require('../clientUser/clientUsersController');
const userCtrl = require('../user/usersController');
const notificationsCtrl = require('../notification/notificationsController'); 
const viewDownloadsCtrl = require('../viewdownload/viewDownloadsController');
const fileActivityCtrl = require('../fileActivity/fileActivityController');
const activityCtrl = require('../activity/activitiesController');
const folderTemplatesCtrl = require('../folderTemplate/folderTemplatesController');
const documentTemplateCtrl = require('../documentTemplate/documentTemplatesController');

const async = require('async');
let request = require('request')
let multiparty = require('multiparty')
let fs = require('fs');
const { Readable } = require('stream');
let progress = require('progress-stream');
const emailUtil = require('../../global/utils/email');
const brandingName = require('../../global/brandingName.js').brandingName;

const axios = require('axios');
const { raw } = require('objection');

let logger = global.logger;
const sqlUtils = require('../../global/utils/sqlUtils');
const { FORMERR } = require('dns');
const { getFirmFromDomain } = require('../firm/firmsController');

const mangobilling = require('../../global/constants').mangobilling;
const libre = require('libreoffice-convert');
const _ = require('lodash');
const ClientNote = require('../clientNote/ClientNoteModel');

const AdmZip = require("adm-zip") //for zipping folders and files

let RootFolder;

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

// local storge
const LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage('./scratch');

exports.utilSearch = (vectorQueryString, firmId = null, firmClientIds = null, clientId = null, callback) => {
  console.log("FILES UTIL SEARCH", vectorQueryString, firmId, firmClientIds, clientId)
  let specialQueryString = '';
  if (vectorQueryString && vectorQueryString.indexOf('-AMPERSAND-') > -1) {
    let tempQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '');
    if (!tempQueryString) {
      specialQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '&');
    }
    vectorQueryString = tempQueryString;
  }

  if (vectorQueryString && vectorQueryString.trim()) {
    vectorQueryString = vectorQueryString.replace(/ /g, ' & ');
  }
  // 4 types, which may end up being more different later

  // 1 client, only access their files
  // 2 firm user, only access client files that they are staff too
  // 3 firm admin, access all firm files
  // 4 global admin - NOTE: "we don't have any access to your files" from demo call

  /**
   * NOTE REGARDING TEXT SEARCH IN POSTGRES:
   * By default, to_tsvector doesn't save entire strings but only saves
   * the stem or lexeme of each word. This means common prefixes and suffixes will not be stored. A file named "taxes" may only
   * have "tax" saved in document_vectors. This means if a user searches "tax", the file called "taxes" will be returned, but
   * if a user searches "taxes" it will not.
   * 
   * Below we were passing "simple" as the first argument to to_tsquery. That means our search text is not transformed at all
   * and we run in to the problem described above ("tax" returns the file named "taxes", but "taxes" does not).
   * By removing "simple", our search text will be treated the same way as our document_vectors are saved. This allows us to
   * search "taxes" and return the file called "taxes" because our search text will omit common prefixes and suffixes.
   * 
   * More info here: http://rachbelaid.com/postgres-full-text-search-is-good-enough/
   */

   console.log("file vectorQueryString", vectorQueryString);
  if(clientId) {
    // client search
    File.query()
    .where({_client: clientId})
    .whereIn('status', ['visible','locked'])
    // .whereRaw(`document_vectors @@ to_tsquery('simple','${vectorQueryString}:*')`) // NOTE: this searches the prefix string
    // .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`) // NOTE: this searches the prefix string
    .where(builder => {
      if (vectorQueryString) {
        builder.whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
      }
      if (specialQueryString) {
        builder.where('filename', 'like', `%${specialQueryString}%`)
      }
    })
    .orderBy('_id', 'desc')
    .then(files => {
      let totalFiles = [];
      totalFiles = [...files];

      User.query()
        .select(["_id", "username", "firstname", "lastname"])
        .then(users => {
          
          if (vectorQueryString) {
            users = users.filter((user) => {
              const fullname = (user.firstname + " " + user.lastname).replace(/ /g, " & ").toLowerCase();
              return fullname.includes(vectorQueryString.toLowerCase());
            });
          } else {
            users = [];
          }

          console.log("users", users);
          if(users && users.length > 0) {
            const userIds = users.map(user => user._id);
            console.log("userIds", userIds);
            File.query()
              .where({_client: clientId})
              .whereIn('status', ['visible','locked'])
              .orderBy('_id', 'desc')
              .then(files => {
                const newFiles = files.filter((file) => {
                  return userIds.includes(file._user);
                });
                
                totalFiles = [...totalFiles, ...newFiles];
                callback({success: true, files: totalFiles})
              })
          } else {
            callback({success: true, files: totalFiles})
          }
        })
    })
  } else if(firmId && firmClientIds) {
    // firm non-admin search
    File.query()
    .where({_firm: firmId})
    .where(builder => {
      builder
      .whereIn('_client', firmClientIds)
      .orWhereNull('_client')
    })
    .whereNot('status', 'deleted')
    // .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`) // NOTE: this searches the prefix string
    .where(builder => {
      if (vectorQueryString) {
        builder.whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
      }
      if (specialQueryString) {
        builder.where('filename', 'like', `%${specialQueryString}%`)
      }
    })
    .orderBy('_id', 'desc')
    .then(files => {
      let totalFiles = [];

      totalFiles = [...files];

      console.log("Totalfiles", totalFiles);

      User.query()
        .select(["_id", "username", "firstname", "lastname"])
        .then(users => {
          if (vectorQueryString) {
            users = users.filter((user) => {
              const fullname = (user.firstname + " " + user.lastname).replace(/ /g, " & ").toLowerCase();
              return fullname.includes(vectorQueryString.toLowerCase());
            });
          } else {
            users = [];
          }
          console.log("users", users);
          if(users && users.length > 0) {
            const userIds = users.map(user => user._id);
            console.log("userIds", userIds);
            File.query()
              .where({_firm: firmId})
              .whereNot('status', 'deleted')
              .where(builder => {
                builder
                .whereIn('_client', firmClientIds)
                .orWhereNull('_client')
              })
              .orderBy('_id', 'desc')
              .then(files => {
                const newFiles = files.filter((file) => {
                  return userIds.includes(file._user);
                });
                console.log("newFiles", newFiles);
                totalFiles = [...totalFiles, ...newFiles];
                console.log("Totalfiles", totalFiles);
                callback({success: true, files: totalFiles})
              })
          } else {
            callback({success: true, files: totalFiles})
          }
        })
    })
  } else if(firmId) {
    // firm admin search
    File.query()
    .where({_firm: firmId})
    .whereNot('status', 'deleted')
    // .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`) // NOTE: this searches the prefix string
    .where(builder => {
      if (vectorQueryString) {
        builder.whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
      }
      if (specialQueryString) {
        builder.where('filename', 'like', `%${specialQueryString}%`)
      }
    })
    .orderBy('_id', 'desc')
    .then(files => {
      let totalFiles = [];

      totalFiles = [...files];
      User.query()
        .select(["_id", "username", "firstname", "lastname"])
        .then(users => {
          if (vectorQueryString) {
            users = users.filter((user) => {
              const fullname = (user.firstname + " " + user.lastname).replace(/ /g, " & ").toLowerCase();
              return fullname.includes(vectorQueryString.toLowerCase());
            });
          } else {
            users = [];
          }
          console.log("users", users);
          if(users && users.length > 0) {
            const userIds = users.map(user => user._id);
            console.log("userIds", userIds);
            File.query()
              .where({_firm: firmId})
              .whereNot('status', 'deleted')
              .orderBy('_id', 'desc')
              .then(files => {
                const newFiles = files.filter((file) => {
                  return userIds.includes(file._user);
                });
                totalFiles = [...totalFiles, ...newFiles];
                callback({success: true, files: totalFiles})
              })
          } else {
            callback({success: true, files: totalFiles})
          }
        })
    })
  } else {
    // global ADMIN search
    File.query()
    // .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`) // NOTE: this searches the prefix string
    .where(builder => {
      if (vectorQueryString) {
        builder.whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}:*')`)
      }
      if (specialQueryString) {
        builder.where('filename', 'like', `%${specialQueryString}%`)
      }
    })
    .orderBy('_id', 'desc') 
    .then(files => {
      let totalFiles = [];

      totalFiles = [...files];
      console.log("Totalfiles", totalFiles);

      User.query()
        .select(["_id", "username", "firstname", "lastname"])
        .then(users => {
          users = users.filter((user) => {
            const fullname = (user.firstname + " " + user.lastname).replace(/ /g, " & ").toLowerCase();
            return fullname.includes(vectorQueryString.toLowerCase());
          })
          console.log("users", users);
          if(users && users.length > 0) {
            const userIds = users.map(user => user._id);
            console.log("userIds", userIds);
            File.query()
              .orderBy('_id', 'desc')
              .then(files => {
                const newFiles = files.filter((file) => {
                  return userIds.includes(file._user);
                });

                console.log("newFiles", newFiles);

                totalFiles = [...totalFiles, ...newFiles];
                console.log("Totalfiles", totalFiles);
                callback({success: true, files: totalFiles})
              })
          } else {
            callback({success: true, files: totalFiles})
          }
        })
    })
  }
}

exports.list = (req, res) => {
  File.query()
  .orderBy('_id', 'desc')
  .whereNot("status", "deleted")
  .then(files => {
    res.send({success: true, files})
  })
  .catch(err => {
    res.send({success: false, message: 'Invalid server error'});
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of files queried from the array of _id's passed in the query param
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
    // File.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, files) => {
    //     if(err || !files) {
    //       res.send({success: false, message: `Error querying for files by ${["_" + req.params.refKey]} list`, err});
    //     } else if(files.length == 0) {
    //       File.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, files) => {
    //         if(err || !files) {
    //           res.send({success: false, message: `Error querying for files by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, files});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, files});
    //     }
    // })
    File.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, files) => {
        if(err || !files) {
          res.send({success: false, message: `Error querying for files by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, files});
        }
    })
  }
}

exports.listByRefs = async (req, res) => {
  console.log("file list by refs")
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   * TODO: server side pagination
   */
   // build query
  let query = {}
  let clientPermissionId = null;
  let firmPermissionId = null;
  const refKey = req.params.refKey
  if(!refKey.includes('~')) {
    query[refKey] = req.params.refId === 'null' ? null : req.params.refId
  } else {
    /**
     * The query includes a tilde (~). This is a special field that allows us to do 
     * custom overrides, which can be sub queries or additional permission checks.
     */
    if(refKey == '~firm') {
      /**
       * This might need to be renamed, but it means we are fetching by firm with permission.
       * Meaning that admins get to query all firm files and regular staff can only query their client's files (and files where _client === null).
       */
      // Save the firm id for the permission checks below.
      firmPermissionId = req.params.refId
      // Add _firm to the query.
      query['f._firm'] = firmPermissionId
    } else if(refKey == '~client') {
      /**
       * Fetching by client with permission. Only allow clients to fetch their own files.
       */
      // Save the client id for the permission checks below.
      clientPermissionId = req.params.refId
      // Add _client to the query.
      query['f._client'] = clientPermissionId
      // Client is requesting their own files, only allow visible. Technically admins should be able to see hidden files
      // but if they are viewing things as the client they should only see what the client sees.
      // query.status = 'visible'
    }
  }
  // test for optional additional parameters

  const nextParams = req.params['0'];
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    let tagIds = [];

    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {

        // special catch for tag queries
        // they should be separated by commas
        if(nextParams.split("/")[i] == "_tags") {
          // raw tag id: allow multiple tags in query
          // console.log(nextParams.split("/")[i+1].split(","))

          tagIds = tagIds.concat(nextParams.split("/")[i+1].split(","))

        } else if(nextParams.split("/")[i] == "tags") {
          // case: passed in the tag STRINGS
          // we need to first query the tag objects from their ids before fetching the file objects
          let tagNames = nextParams.split("/")[i+1].split(",")
          query['f.tags'] = tagNames;
          // we will catch for thiss down below and do some additional db calls
        } else if(nextParams.split("/")[i].includes("~")) {
          // See line 160 above for further explanation.
          if(nextParams.split("/")[i] == "~firm") {
            firmPermissionId = nextParams.split("/")[i+1]
            query['f._firm'] = nextParams.split("/")[i+1]
          } else if(nextParams.split("/")[i] == "~client") {
            clientPermissionId = nextParams.split("/")[i+1]
            query['f._client'] = nextParams.split("/")[i+1]
          }
        } else {
          query[`f.${nextParams.split("/")[i]}`] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
        }
      }
    }

    // Put the initial query together. Below we'll do checks and add to the query as needed.
    const fileStatus = query['f.status'];
    if (query && query['f._personal']) {
      query['f._personal'] = query['f._personal'].replace('personal', '');
    }
    delete query['f.status'];
    let FileQuery = File.query().from('files as f')
    //.leftJoin('folderpermission as fp', 'fp._folder', 'f._id')
    .where(builder => {
      if (fileStatus === "folder-only") {
        builder.where({ 'f._firm': query['f._firm'], 'f.category': 'folder' });
        if (query['f._client'] && query['f._client'] != null && query['f._client'] !== "null") {
          builder.where({ 'f._client': query['f._client'] });
        } else if (query['f._personal'] && query['f._personal'] != null && query['f._personal'] !== "null") {
          builder.where({ 'f._personal': query['f._personal'] });
        } else {
          builder.where(builder => {
            builder.where({ 'f._personal': null }).orWhere({ 'f._personal': '' });
          });
          builder.whereNull('f._client');
        }
        builder.whereNotIn('f.status', ['archived', 'deleted'])
      } else if (fileStatus === "not-archived") {
        builder.where(query);
        builder.whereNotIn('f.status', ['archived', 'deleted'])
      } else if (fileStatus === "portal-view") {
        builder.where(query);
        builder.whereIn("f.status", ["visible", "locked"])
      } else {
        builder.whereNot({ 'f.status': 'deleted' })
        builder.where(query);
      }
    })
    // .select(['f.*', raw('row_to_json(fp) as permission')])
    // .groupBy([
    //   'f._id'
    //   ,' fp._id'
    // ])
    // .orderBy('f._id', 'desc');

    if(tagIds && tagIds.length > 0) {
      let rawQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
      FileQuery = FileQuery.whereRaw(...rawQuery)
    }
    
    // let TempQuery = FileQuery.clone();
    // const temp = await TempQuery.groupBy('_id').count('_id as total');

    // console.log('filesCount', temp.length);
    // if(temp.length <= 0 ) {
    //   res.send({success: true, files: []}); return;
    // }

    // console.log('query', query);
    // FileQuery
    //   .then(files => {
    //     res.send({success: true, files});
    //   })
    //   .catch(err => {
    //     console.log('error fetching files', err);
    //     res.send({success: false, message: "Internal server error"});
    //   })

    // return;

    if(!!query._client && !!(req.user && req.user._id)) {
      req.user._client = query._client
    }

    if(firmPermissionId && fileStatus != "portal-view") {
      console.log("debug2");
      console.log('firmPermissionId', firmPermissionId);

      if(req.firm && req.firm._id  && (req.firm._id == firmPermissionId)) {
        FileQuery
        .asCallback((err,files) => {
          if(err || !files) {
            logger.error("ERROR: ")
            logger.info(err)
            res.send({success: false, message: err || "There was a problem finding the requested files."})
          } else {
            res.send({success: true, files})
          }
        })
      } else {
        // restrict query by firm according to the user's permission level.
        exports.utilListByFirmPermission(req.user, firmPermissionId, FileQuery, async (result) => {
          res.send(result);
        });
      }

    } else if(clientPermissionId) {
      console.log("debug3");
      // restrict query by client according to the user's permission level.
      exports.utilListByClientPermission(req.user, clientPermissionId, FileQuery, async (result) => {
        res.send(result);
      });
    } else if(req.user.admin) {
      console.log("debug4");
      res.send({success: true, files: []})
    } else {
      logger.info("user does not have permission");
      res.send({success: false, message: "You do not have permission to access this API route."})
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
    File.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, files) => {
      if(err || !files) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , files: files
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    File.find(mongoQuery).exec((err, files) => {
      if(err || !files) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, files: files });
      }
    });
  }
}

exports.getById = (req, res) => {
  
  if(req.firm && req.firm._id) {
    File.query().findById(req.params.id)
    .whereNot("status", "deleted")
    .then(file => {
      if(file && file._id) {
        if(file._firm == req.firm._id) {
          file.publicUrl = `https://${appUrl}/preview/${file._id}`

          if(file._client) {
            if(file.category == 'folder') {
              file.fileUrl = `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._id}/folder/`;
            } else {
              file.fileUrl = file._folder ? 
              `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._folder}/folder/${file._id}` 
              :
              `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._id}`
            }
          } else {
            if(file.category == "folder") {
              file.fileUrl = `https://${appUrl}/firm/${file._firm}/files/public/${file._id}/folder/`;
            } else {
              file.fileUrl = file._folder ? 
              `https://${appUrl}/firm/${file._firm}/files/public/${file._folder}/folder/${file._id}`
              :
              `https://${appUrl}/firm/${file._firm}/files/public/${file._id}`
            }
          }
          res.send({success: true, file});
        } else {
          res.send({success: false, message: "You do not have permisson to update this firm file."});
        }
      } else {
        res.status(404);
        res.send({success: false, message: "File not found"})
      }
    });
  } else if(req.isAuthenticated()) {
    File.query().findById(req.params.id)
    .whereNot("status", "deleted")
    .then(file => {
      if(file && file._id) {
        permissions.utilCheckFirmPermission(req.user, file._firm, "access", (permission) => {
          if(!permission) {
            permissions.utilCheckFirmPermission(req.user, file._firm, "client", (permission) => {
              if(!permission) {
                res.send({success: false, message: "You do not have permisson to update this firm file."})
              } else {
                res.send({success: true, file});
              }
            })
          } else {
            file.publicUrl = `https://${appUrl}/preview/${file._id}`

            if(file._client) {
              if(file.category == 'folder') {
                file.fileUrl = `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._id}/folder/`;
              } else {
                file.fileUrl = file._folder ? 
                `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._folder}/folder/${file._id}` 
                :
                `https://${appUrl}/firm/${file._firm}/files/${file._client}/workspace/${file._id}`
              }
            } else {
              if(file.category == "folder") {
                file.fileUrl = `https://${appUrl}/firm/${file._firm}/files/public/${file._id}/folder/`;
              } else {
                file.fileUrl = file._folder ? 
                `https://${appUrl}/firm/${file._firm}/files/public/${file._folder}/folder/${file._id}`
                :
                `https://${appUrl}/firm/${file._firm}/files/public/${file._id}`
              }
            }
            res.send({success: true, file});
          }
        })
      } else {
        res.status(404);
        res.send({success: false, message: "File not found"})
      }
    });
  } else {
    res.send({success: false, message: "You do not have permisson to update this firm file."})
  }
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get file schema ');
  res.send({success: true, schema: File.jsonSchema});
}


exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get file default object');
  res.send({success: true, defaultObj: File.defaultObject});
  // res.send({success: false})
}

exports.utilDownloadFile = (req, file, res) => {
  if(!file) {
    res.status(404);
    res.send("File not found.")
  } else if(file.status == "deleted") {

    // catch for "deleted" files and send the deleted file icon instead
    // console.log("file deleted, return SVG")
    // let filePath = require('path').join(__dirname, '../../static/img/deleted.svg');
    // console.log("PATH", filePath)
    // res.writeHead(200);
    // fs.createReadStream(filePath).pipe(res);

    res.status(404);
    res.send("File not found.")

  } else {

    // set headers to allow certain browsers (ie, IE) to download files. doesn't appear to affect images and things used by the app itself or file previews.
    res.header(`Content-Disposition`, contentDisposition(file.filename))
    //res.header(`Content-Type`, file.contentType);

    console.log('file', file);
    // generate qualified name with folders
    const fileNameWithFolders = fileUtils.buildFileNameWithFolders(file)

    // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
    storage.bucket(bucketName).file(fileNameWithFolders).createReadStream({
      validation: false
      // note: https://github.com/googleapis/nodejs-storage/issues/709
    })
    .on('error', err => {
      console.log("ERROR", err);
      // what happens to the res though on an error?
      res.status(404);
      res.send("File not found.")
    })
    .on('end', () => {
      console.log("file downloaded");
      // const type = req.query;
      // exports.firstTimeEventChecking(type, req, file);
      viewDownloadsCtrl.viewDownloadChecking(req, file, callback => {
        logger.info(callback);
      });
    })
    .pipe(res);
  }
}

exports.downloadFile = (req, res) => {
  console.log("downloading file object from google cloud storage");
  // TODO: requiring 'firmId' or other to try to inject some additional security into this
  // ^ this is now required, and clientId is optional. need to catch and apply permissions.

  // NOTE: since this works, we now have the ability to NOT change uploaded file names if they want.
  // Since the filename on gcloud is just the fileId plus the file extension, we can change the name
  // all we want and gcloud doesn't have to know anything about it.
  
  const { firmId, clientId, fileId, filename } = req.params;
  let fileQuery = {
    _firm: parseInt(firmId)
    , _id: parseInt(fileId)
    //, filename: filename
  }
  if(clientId && clientId !== 'firm') {
    // If no client id is associated with the file the frontend will pass 'firm' in its place.
    // Only include the clientId in the query if it doesn't equal 'firm'.
    fileQuery._client = parseInt(clientId)
  }

  File.query()
  .findOne(fileQuery)
  .then(file => {

    if (file && file.fileExtension && file.fileExtension.indexOf('doc') > -1 && req.query && req.query.viewingas === "PDFFormat") {
      // exports.utilDownloadDocxToPDF('file', file, req, res);
      exports.utilConvertDocxToPDF("file", file._id, response => {
        if (response && response.success) {
          res.header(`Content-Disposition`, contentDisposition(response.filename));
          res.send(response.file.fileBuffer);
        } else {
          res.status(404);
          res.send("File not found.")
        }
      });
    } else {
      exports.utilDownloadFile(req, file, res);
    }

    // if(file) {
    //   // generate qualified name with folders
    //   let fileNameWithFolders = `${req.params.firmId}/`;
    //   if(req.params.clientId) {
    //     fileNameWithFolders += `${req.params.clientId}/`
    //   }
    //   fileNameWithFolders += `${file._id}${file.fileExtension}`

    //   // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
    //   storage.bucket(bucketName).file(fileNameWithFolders).createReadStream()
    //   .on('error', err => {
    //     console.log("ERROR", err);
    //     // what happens to the res though on an error?
    //   })
    //   .on('end', () => {
    //     console.log("file downloaded")
    //   })
    //   .pipe(res);
    // } else {
    //   res.status(404);
    //   res.send("File not found.")
    // }
  });
}

exports.create = (req, res) => {
  logger.info('creating files from files controller');
  exports.utilCreateFile(req, res);
}

exports.createV2 = (req, res) => {
  logger.info('creating v2 files from files controller');
  exports.utilCreateFile(req, res, null, true);
}

exports.utilCreateFile = (req, res, expoCallback, isV2 = false) => {
  logger.info('creating mulitple new files');
  console.log("uploading via file upload");
  console.log(req.body)

  // capture IP address of the uploader so we can save it on the file object
  /**
   * examples:
   * ::1 - localhost
   * ::ffff:99.203.20.149 - from phone
   * ::ffff:98.101.181.226 - in office
   */
  let uploadIp = "";
  let multipleFile = []; 
  let viewingAs;
  if(req.ip && typeof(req.ip) == 'string' ) {
    uploadIp = req.ip;
  }
  let firm;
  let folderObjectId = {}
  let fileObjectKeys = {
    uploadIp
  }; // additional keys to add to the saved file object(s)
  let totalChunk = 0; 
  let currentChunk = 0;
  let versionOrder = null;
  let fileRequestReceivers = [];
  
  let form = new multiparty.Form(); //for parsing multipart data into things we can use
  // TODO: we need robust restrictions in place for this method

  //SOURCE: https://github.com/expressjs/node-multiparty
  form.on('error', err => {
    console.log('Error parsing form: ' + err.stack);
    res.send({success: false, message: "Failed to upload file. Please try again."});
    return;
  })
  form.on('field', (name, value) => {
    console.log("field", name, value);
    if (name && name.includes("_parentId")) {
      folderObjectId[name] = value ? value : null;
    } else if (name === "_client") {
      // sometimes, post _client value is a undefined it is causing an error because is not allowed to insert undefined in integer datatype
      // valid insert 0 or null
      fileObjectKeys[name] = value ? value : null;
    } else if (name === "_folder") {
      // _folder is a string data type
      // sometimes, post _folder value is a null or undefined but declared as string datatype it is cause an error routing
      fileObjectKeys[name] = value ? value === "undefined" || value === "null" ? "" : value : "";
    } else if (name === "viewingAs") {
      // do nothing
      viewingAs = value;
    } else if (name === "ParentID") { 
      fileObjectKeys[name] = value ? value : null
    } else if(name === "YellowParentID") {
      fileObjectKeys[name] = value ? value : null
    } else if (name === "uploadCompanyName") {
      req.body.uploadCompanyName = value ? value : "";
    } else if (name === "uploadEmailAddress") {
      req.body.uploadEmailAddress = value ? value : "";
    } else if (name === "chunk") {
      totalChunk = value ? value : 0;
    } else if (name === "countChunk") {
      currentChunk = value ? value : 0;
    } else if (name === "versionOrder") {
      versionOrder = value;
    } else if (name && name.indexOf("file-request-receiver") > -1 && value) {
      fileRequestReceivers.push({ email: value });
    } else {
      fileObjectKeys[name] = value ? value : "";
    }
    if(name === '_firm') firm = value ? value : null;
  });
  // form.on('progress', (bytesReceived, bytesExpected) => {
  //   // maybe useful for debugging the large files timing out.
  //   console.log(`bytesReceived: ${bytesReceived}, bytesExpected: ${bytesExpected}` )
  // })
  form.parse(req, async (err, fields, files) => {
    console.log("RETURN FORM PARSE");
    console.log(err);
    console.log(fields);
    console.log(files);
    if(err) {
      logger.error('ERROR: ')
      logger.info(err)
      if (expoCallback) {
        expoCallback({success: false, message: err})
      } else {
        res.send({success: false, message: err})
      }
    } else if(!files || !files[0]) {
      logger.error("NO FILE");
      if (expoCallback) {
        expoCallback({success: false, message: "No file present in request"})
      } else {
        res.send({success: false, message: "No file present in request"})
      }
    } else {
      let fUniqueIds = [];
      // // test by forcing timeouts
      // setTimeout(() => {
      //   res.send({success: true, files: []})
      // }, 2000)
      // return;

      // Sending the response immediately to avoid timeouts on large files.
      if (viewingAs !== "outlook" && !expoCallback) {

        Object.keys(files).map(f => {
          fUniqueIds.push(uuidv4());
        })

        if(isV2) {
          res.send ({success: true, files: [...fUniqueIds]})
        } else {
          res.send ({success: true, files: []})
        }
      }

      if (viewingAs === "outlook" && fileObjectKeys && !fileObjectKeys._client && fileObjectKeys.status != "visible") {
        fileObjectKeys.status = "visible";
      }

      console.log('fileObjectKeys', fileObjectKeys);

      let socketId; // Depending on where this call is coming from, we either want to send updates to req.user._id or to the sharelink hex.
      if(req.user) {
        socketId = req.user._id
      } else if(req.params.hex) {
        socketId = req.params.hex // A user that is not logged in is uploading these files via sharelink.
      } else if(!!fileObjectKeys.uuid) {
        socketId = fileObjectKeys.uuid
      }
      let multipleFiles = [];

      let mClient = {};
      let mYellowParentID;
      let mParentID;
      
      // && fileObjectKeys.mangoCompanyID && fileObjectKeys.mangoClientID

      if(fileObjectKeys._client)
        mClient = await Client.query().findById(fileObjectKeys._client).then(client => client).catch(err => null);

      if(fileObjectKeys.YellowParentID)
        mYellowParentID = await File.query().findById(fileObjectKeys.YellowParentID).then(newFile => newFile).catch(err => null)

      if(fileObjectKeys.ParentID)
        mParentID = await File.query().findById(fileObjectKeys.ParentID).then(newFile => newFile).catch(err => null);

      console.log('this is the files', files);

      console.log('fileObjectKeys', fileObjectKeys);

      // Switched from async.each to async.eachOf so we can use index.
      // index is necessary to keep track of individual file progress.
      async.eachOf(files, (file, index, callback) => {
        // console.log(file);

        let newFile = {...fileObjectKeys}; //for setting fields

        if (files && (files.length === 1 || files.length === index + 1) && versionOrder) {
          newFile.versionOrder = versionOrder;
        }

        if(!!newFile.uuid) delete newFile.uuid;

        logger.debug('new file so far', newFile);
        logger.debug("file object found, creating File");


        // {
        //   'content-disposition': 'form-data; name="file"; filename="test_2.jpg"'
        //   ,'content-type': 'image/jpeg'
        // }

        //get some info about the file
        let contentType = file[0].headers['content-type'];
        console.log("CONTENT TYPE: " + contentType);

        let fileExtension = file[0].originalFilename.substring(file[0].originalFilename.lastIndexOf('.'), file[0].originalFilename.length);
        console.log("FILE EXTENSION: " + fileExtension);
    
        /**
         * NOTE: This is no longer necessary and has been removed.
         * Find the substring in the file name before the first "." and add a random string to the end, while preserving the extension.  
         * This works with complicated file names like 2011-07-14.22.12.jpg  which will become 2011-07-1420_d22c3b.22.12.jpg
         * 
         */
        newFile.filename = file[0].originalFilename;
        newFile.fileExtension = fileExtension;
        newFile.contentType = contentType;
        if(contentType.includes('pdf') || contentType.includes('text')) {
          newFile.category = 'document'
        } else if(contentType.includes('image')) {
          newFile.category = 'image'
        } else if(contentType.includes('video')) {
          newFile.category = 'video'
        } else if(fileExtension.includes('docx') || fileExtension.includes('doc')) {
          newFile.category = 'microsoft word'
        } else if(fileExtension.includes('xlsx') || fileExtension.includes('xls')) {
          newFile.category = 'microsoft excel'
        }

        // change parent folder
        if (file && file[0] && folderObjectId[`${file[0].fieldName}_parentId`]) {
          console.log("change parent folder", folderObjectId[`${file[0].fieldName}_parentId`]);
          newFile._folder = folderObjectId[`${file[0].fieldName}_parentId`];
        }

        // TODO: ADD BACK LATER!!!
        newFile._user = req.user ? req.user._id : null;
        
        // newFile.rawUrl = 'https://s3.amazonaws.com/' + "CHANGE" + '/' + newFile._id + fileExtension;
        // NOTE: newFile._id does not yet exist here. Every rawUrl ends in /o/undefined${fileExtension}.
        newFile.rawUrl = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${newFile._id}${fileExtension}`
        
        // const stats = fs.statSync(file[0].path);
        // console.log("stats", stats)
        // console.log("stats", file[0].path)

        newFile.mangoClientID = mClient && mClient.mangoClientID ? mClient.mangoClientID : null;
        newFile.mangoCompanyID = mClient && mClient.mangoCompanyID ? mClient.mangoCompanyID : null;  

        newFile.YellowParentID = mYellowParentID && mYellowParentID.DMSParentID ? mYellowParentID.DMSParentID : null;
        newFile.ParentID = mParentID && mParentID.DMSParentID ? mParentID.DMSParentID : null; 
        
        newFile.uniqueId = !!fUniqueIds[index] ? fUniqueIds[index] : '';

        const fsStats = fs.statSync(file[0].path);
        newFile.fileSize = fsStats.size;

        File.query()
        .insert(newFile)
        .returning("*")
        .then(newFile => {
          console.log('this is the newFile', newFile);
          if(err || !newFile) {
            console.log("error saving initial file object");
            console.log(err);
            callback({success: false, err: err, message: "Error saving initial file object"});
          } else {
            //create bucket and object
            console.log('creating new file from file object');
            //s3 filename !== file filename. just save the mongo._id as filename on backend to prevent collisions.
            const fileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);

            // store the file in new variable
            // multipleFile.push(newFile);

            // NOTES: unlike S3, we should create the buckets manually, since subsequent calls to create it will fail vs returning an "ok"
            // storage.createBucket(bucketName, {
                //   location: 'us'
                // }).then(() => {
                //   console.log("CREATED BUCKET")

            // google makes it really hard to view the actual docs of the api
            // link here: https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/Bucket
            // https://googleapis.dev/nodejs/storage/latest
           
            // define the destination for the file.
            const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);
            // get file stats.
            const stats = fs.statSync(file[0].path);
            // setup streamProgress so we can get progressPercent.
            const streamProgress = progress({
              length: stats.size,
              time: 200 // The interval at which events are emitted in milliseconds.
            });
            streamProgress.on('progress', progress => {
              console.log("PROGRESS!", progress);
              // Send the progress of the current file with its index so we can display it on the front end.
              if(socketId) {
                req.io.to(socketId).emit('upload_progress', Math.floor(progress.percentage), index);
              }
            })

            // storage.bucket(bucketName).upload(file[0].path, {
            //   destination: fileNameWithFolders
            //   // destination: filename
            //   // destination: `test/${filename}` // actually super easy, creates the folder on the fly!
            //   , gzip: true // should compress file on the fly
            //   // metadata
            // }).then(resp => {
            //   console.log("UPLOADED FILE")
            //   console.log(resp);
            //   multipleFiles.push(newFile);
            //   callback();
            //   // callback({success: true})
            //   // res.send({success: false, message: 'testing'})
            // })
            /**
             * NOTE: storage.bucket(bucketName).upload(...) is a convenience method that wraps File#createWriteStream
             * More info: https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/Bucket#upload
             * and: https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createWriteStream
             * 
             * We need to use the standard method so we can pipe to streamProgress.
             */             

            fs.createReadStream(file[0].path)
            .pipe(streamProgress) // pipe to the method above so we can keep track of upload progress via the socket connection.
            .pipe(fileDestination.createWriteStream({ gzip: true }))
            .on('error', err => {
              logger.error("ERROR: in createReadStream ")
              logger.info(err)
              req.io.to(socketId).emit('upload_progress_error', err, index)
              // NOTE: We could use the socket and index here to notify the front end that a specific file has an error.
              // We also may want to use async.reflect so we can continue with other files in the event of an error.
              callback();
              // callback({success: false, message: err})
            })
            .on('finish', () => {
              logger.info("Finished uploading file", newFile)
              multipleFiles.push(newFile);
              callback();
              // The file upload is complete.
            });
          } 
        })
        .catch(err => {
          callback();
        })
      }, (err) => {
        console.log('done');
        if(err) {
          logger.error('ERROR: ');
          logger.info(err)
          if(socketId) {
            req.io.to(socketId).emit('upload_finished_error', err)
          }
        } else {
          // res.send({success: true, files: multipleFiles});
          // since we've already sent the response, we'll send the final update via the socket connection.
          
          //notifications
          if(socketId) {
            //req.io.to(socketId).emit('upload_finished', multipleFiles);

            if (viewingAs === "outlook") {
              res.send({ success: true, files: multipleFiles });
            } else {
              req.io.to(socketId).emit('upload_finished', multipleFiles);
            }

            if (expoCallback) {
              expoCallback({ success: true, files: multipleFiles, fileRequestReceivers });
            }

            req.body.files = multipleFiles;
            req.body.nocallback = true;
            if (viewingAs === "workspace" || viewingAs === "outlook") {
              // workspaces
              activityCtrl.createOnStaffFileUpload(req, res);
            } else if (viewingAs === "portal") {
              // portal
              activityCtrl.createOnClientFileUpload(req, res);
            }
          }

          // mango billing
          Firm.query()
          .findById(firm)
          .then((firm) => {
            if(multipleFiles && multipleFiles.length) {
              multipleFiles.forEach(file => {
                exports.notifyDriveMapperOnFileChanges(file && file._id);
                if(!file._client) {
                  console.log('this is on callback', file);
                  //callback(null, file)
                } else if (firm.mangoCompanyID && firm.mangoApiKey) {
                  const MANGO_CREATE_FILE = mangobilling.MANGO_CREATE_FILE;
                  let uniqueName = `${Math.floor(Math.random()*16777215).toString(16)}-${Math.floor(Math.random()*16777215).toString(16)}_${file.filename}`;
                  /*uniqueName = uniqueName.replace(/ /g, "_");*/

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

                  console.log('MANGO_CREATE_FILE', MANGO_CREATE_FILE);
                  console.log('requestBody', requestBody);

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
                  //         console.log('file file', file);
                  //         //callback(null, file);
                  //       })
                  //       .catch(err => {
                  //         console.log('MANGO_CREATE_FILE ERROR', err);
                  //         //callback(null, file);
                  //       })
                  //   } else {
                  //     console.log('MANGO dmsParentID does not exists');
                  //     //callback(null, file);
                  //   }
                  // })
                  // .catch((err) => {
                  //   console.log('MANGO_CREATE_FILE ERROR', err);
                  //   //callback(null, file);
                  // })
                }
              });
            }
          });
        }
      })
    }
  })
}

// allows us to save a base64string in the same way we save other files.
exports.utilCreateFromBase64 = (base64String, filePointers, existingReturnedFileId, callback) => {
  console.log("Creating file from base64 string.");

  let newFile = {...filePointers}; //for setting fields

  // logger.debug('new file so far')
  // console.log(newFile);
  // logger.debug("file object found, creating File");

  // NOTE: newFile._id does not yet exist here. Every rawUrl ends in /o/undefined${fileExtension}.
  newFile.rawUrl = `https://www.googleapis.com/storage/v1/b/${bucketName}/o/${newFile._id}${newFile.fileExtension}`
  
  if (existingReturnedFileId) {
    File.query()
    .findById(existingReturnedFileId)
    .then(file => {
      if (file) {
        callback({success: true, file});
      } else {
        console.log(err);
        callback({success: false, err: err, message: "Error saving initial file object"});
      }
    })
  } else {
    File.query()
    .insert(newFile)
    .returning('*')
    .asCallback((err, file) => {
      if(err || !file) {
        console.log("error saving initial file object");
        console.log(err);
        callback({success: false, err: err, message: "Error saving initial file object"});
      } else {
        // create bucket and object
        const fileNameWithFolders = fileUtils.buildFileNameWithFolders(file)
        // convert the base64string to a buffer.
          const fileBuffer = Buffer.from(base64String, 'base64')
          // convert the buffer to a readable stream.
          const fileStream = exports.utilConvertBufferToStream(fileBuffer);
        // define the destination for the file.
        const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);
    
        fileStream
        .pipe(fileDestination.createWriteStream({ gzip: true }))
        .on('error', err => {
          logger.error("ERROR: in createReadStream ")
          logger.info(err)
          callback({success: false, message: err})
        })
        .on('finish', () => {
          logger.info("Finished uploading file", file)
          callback({success: true, file});
          // The file upload is complete.
        });
      }
    })
  }
}

exports.update = (req, res) => {
  logger.info('updating file');

  const fileId = parseInt(req.params.id) // has to be an int
  const viewingAs = req.body.viewingAs;

  let folderPermission;
  if(req.body.permission && req.body.permission._id) {
    folderPermission = _.cloneDeep(req.body.permission);
  }

  delete req.body.permission;
  delete req.body.lastUpload;
  delete req.body.consumedStorage;

  delete req.body.fullname;
  delete req.body.username;
  delete req.body.publicUrl;
  delete req.body.fileUrl;
  delete req.body.viewingAs;
  
  File.query()
  .findById(fileId).then(file => {

    const oldFileNameWithFolders = fileUtils.buildFileNameWithFolders(file)

    // // check _client && if true, run utilCheckClientPermission level admin
    // else 
    if(file && file._client) {
      const checkClientPermissions = (response) => {
        if (viewingAs === "portal") {
          permissions.utilCheckClientContactPermission(req.user, file._client, file._firm, "rename", permission => {
            console.log('client contact permission 1', permission);
            response(permission);
          });
        } else {
          permissions.utilCheckClientPermission(req.user, file._client, "access", permission => {
            console.log('client permission 1', permission);
            response(permission);
          });
        }
      }

      checkClientPermissions(permission => {
        if(!permission) {
          logger.info("user does NOT have permission.");
          res.send({success: false, message: "You do not have permission to update this client file."}); 
        } else {
          req.body.updated_at = new Date(); 
          File.query()
          .findById(fileId)
          .update(req.body) //valiation? errors?? 
          .returning('*') // doesn't do this automatically on an update
          .then(newFile => {
            console.log("File", newFile)
            
            const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);
            let actionText = "";

            // rename file name
            if (newFile.filename !== file.filename) {
              actionText = `Rename to ${newFile.filename} by %USER%`;

              Firm.query()
              .findById(file._firm)
              .then((firm) => {
                console.log('this is my firm', firm);
                if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {

                  const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;

                  const requestBody = {
                    "CompanyID": newFile.mangoCompanyID,
                    "ClientID": newFile.mangoClientID,
                    "ParentID": newFile.ParentID,
                    "YellowParentID": newFile.YellowParentID,
                    "dmsParentID": newFile.DMSParentID,
                    "FName": newFile.filename
                  }

                  console.log('requestBody', requestBody);

                  // axios({
                  //   method: 'PUT',
                  //   url: MANGO_UPDATE_FILE,
                  //   data: requestBody,
                  //   headers: {
                  //     'vendorAPIToken': firm.mangoApiKey,
                  //     'Content-Type': 'application/json'
                  //   }
                  // })
                  // .then((mangoRes) => {
                  //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                  // })
                  // .catch((err) => {
                  //   console.log('MANGO_UPDATE_FILE ERROR', err);
                  // })
                }
              })
            }

            // updated visibility
            if (newFile.status !== file.status) {
              // archived or reinstate
              const actionStatus = newFile.status === "none" ? "Reinstate" : newFile.status === "archived" ? "Archived" : "";
              actionText = actionStatus ? `${actionStatus} by %USER%` : `Changed visibility to ${newFile.status} by %USER%`;
            }

            // moved physical file
            if (newFileNameWithFolders !== oldFileNameWithFolders) {
              actionText = `Moved to %CLIENT% by %USER%`;
            }

            // file activity
            if (actionText) {
              fileActivityCtrl.utilCreateFromResource(
                req
                , newFile._id, newFile._firm, newFile._client, req.user ? req.user._id : null
                , newFile.status, actionText
                , "" // `/firm/${newFile._firm}/workspaces/${newFile._client}/files/${newFile._id}`
                , "" // `/portal/${newFile._client}/files/${newFile._id}`
              );
            }             

            newFile.permission = folderPermission;
            console.log('this is the newFile with permission', newFile, permission);

            if(newFileNameWithFolders !== oldFileNameWithFolders && newFile.category !== "folder") {
              console.log("Need to update Gcloud file path 1")
              storage.bucket(bucketName)
              .file(oldFileNameWithFolders)
              .move(newFileNameWithFolders)
              .then(result => {
                console.log("moved physical file 1");
                res.send({success: true, file: newFile});
                exports.notifyDriveMapperOnFileChanges(newFile && newFile._id);
              })
              .catch(err => {
                console.log('storage error', err);
                res.send({success: true, file: newFile});
              })
            } else {
              // no gcloud changes needed
              res.send({success: true, file: newFile});
              exports.notifyDriveMapperOnFileChanges(newFile && newFile._id);
            }           
          })
        }
      });
    }
    // check _firm utilCheckFirmPermission level access 
    else if(file && file._firm) {
      permissions.utilCheckFirmPermission(req.user, file._firm || null, "access", permission => {
        if(!permission) {
          logger.info("user does NOT have permission.")
          res.send({success: false, message: "You do not have permisson to update this firm file."})
        } else {
          req.body.updated_at = new Date(); 
          File.query()
          .findById(fileId)
          .update(req.body) //valiation? errors?? 
          .returning('*') // doesn't do this automatically on an update
          .then(newFile => {
            console.log("File", newFile)

            const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);
            let actionText = "";

            // rename file name
            if (newFile.filename !== file.filename) {
              actionText = `Rename to ${newFile.filename} by %USER%`;

              Firm.query()
                .findById(file._firm)
                .then((firm) => {
                  console.log('this is my firm', firm);
                  if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {

                    const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;

                    const requestBody = {
                      "CompanyID": newFile.mangoCompanyID,
                      "ClientID": newFile.mangoClientID,
                      "ParentID": newFile.ParentID,
                      "YellowParentID": newFile.YellowParentID,
                      "dmsParentID": newFile.DMSParentID,
                      "FName": newFile.filename
                    }

                    console.log('requestBody', requestBody);

                    // axios({
                    //   method: 'PUT',
                    //   url: MANGO_UPDATE_FILE,
                    //   data: requestBody,
                    //   headers: {
                    //     'vendorAPIToken': firm.mangoApiKey,
                    //     'Content-Type': 'application/json'
                    //   }
                    // })
                    // .then((mangoRes) => {
                    //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                    // })
                    // .catch((err) => {
                    //   console.log('MANGO_UPDATE_FILE ERROR', err);
                    // })
                  }
                })
            }
                        
            // updated visibility
            if (newFile.status !== file.status) {
              // archived or reinstate
              const actionStatus = newFile.status === "none" ? "Reinstate" : newFile.status === "archived" ? "Archived" : "";
              actionText = actionStatus ? `${actionStatus} by %USER%` : `Changed visibility to ${newFile.status} by %USER%`;
            }

            // moved physical file
            if (newFileNameWithFolders !== oldFileNameWithFolders && newFile._client) {
              actionText = `Moved to %CLIENT% by %USER%`;
            }

            // file activity
            if (actionText) {
              fileActivityCtrl.utilCreateFromResource(
                req
                , newFile._id, newFile._firm, newFile._client, req.user ? req.user._id : null
                , newFile.status, actionText
                , "" // `/firm/${newFile._firm}/files/${newFile._id}`
                , ""                
              );
            }

            newFile.permission = folderPermission;

            if(newFileNameWithFolders !== oldFileNameWithFolders && newFile.category !== "folder") {
              console.log("Need to update Gcloud file path 2")
              storage.bucket(bucketName)
              .file(oldFileNameWithFolders)
              .move(newFileNameWithFolders)
              .then(result => {
                console.log("moved physical file 2");
                // console.log("DONE WITH MOVE!!", result);
                res.send({success: true, file: newFile});
                exports.notifyDriveMapperOnFileChanges(newFile && newFile._id);
              })
              .catch(err => {
                console.log('storage error', err);
                res.send({success: true, file: newFile});
              })

            } else {
              // no gcloud changes needed
              res.send({success: true, file: newFile});
              exports.notifyDriveMapperOnFileChanges(newFile && newFile._id);
            }
          })
        }
      });
    }
  })
  .catch(err => {
    res.send({success: false, message: 'Internal server error'});
  })
}

// exports.bulkUpdateStatus = (req, res) => {

//   const { status, filesId } = req.body;

//   async.map(filesId, (fileId, callback) => {

//     File.query()
//     .findById(fileId).then(file => {
//       const oldFileNameWithFolders = fileUtils.buildFileNameWithFolders(file);

//           // check _client && if true, run utilCheckClientPermission level admin
//       if(file && file._client) {
//         permissions.utilCheckClientPermission(req.user, file._client, "access", permission => {
//           if(!permission) {
//             logger.info("user does NOT have permission.");
//             res.send({success: false, message: "You do not have permission to update this client file."}); 
//           } else {
//             File.query()
//             .findById(fileId)
//             .update({ status: status, updated_at: new Date() }) //valiation? errors?? 
//             .returning('*') // doesn't do this automatically on an update
//             .then(file => {
//               console.log("File", file)
//               const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(file) 
//               if(newFileNameWithFolders !== oldFileNameWithFolders) {
//                 console.log("Need to update Gcloud file path 1")
//                 storage.bucket(bucketName)
//                 .file(oldFileNameWithFolders)
//                 .move(newFileNameWithFolders)
//                 .then(result => {
//                   console.log("moved physical file 3");
//                   // res.send({success: true, file})
//                   callback(null, file);
//                 })

//               } else {
//                 // no gcloud changes needed
//                 // res.send({success: true, file})
//                 callback(null, file);
//               }
//             })
//           }
//         }); 
//       }
//       // check _firm utilCheckFirmPermission level access 
//       else if(file && file._firm) {
//         permissions.utilCheckFirmPermission(req.user, file._firm || null, "access", permission => {
//           if(!permission) {
//             logger.info("user does NOT have permission.")
//             res.send({success: false, message: "You do not have permisson to update this firm file."})
//           } else {
//             File.query()
//             .findById(fileId)
//             .update({ status: status, updated_at: new Date() }) //valiation? errors?? 
//             .returning('*') // doesn't do this automatically on an update
//             .then(file => {
//               console.log("File", file)
//               const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(file) 
//               if(newFileNameWithFolders !== oldFileNameWithFolders) {
//                 console.log("Need to update Gcloud file path 2")
//                 storage.bucket(bucketName)
//                 .file(oldFileNameWithFolders)
//                 .move(newFileNameWithFolders)
//                 .then(result => {
//                   console.log("moved physical file 4");
//                   // console.log("DONE WITH MOVE!!", result);
//                   // res.send({success: true, file})
//                   callback(null, file);
//                 })

//               } else {
//                 // no gcloud changes needed
//                 // res.send({success: true, file})
//                 callback(null, file);
//               }
//             })
//           }
//         });
//       }

//     })
//   }, (err, files) => {
      
//     // remove null from array, since every loop need a mapCallBack 
//     files = files.filter(file => file);
//     logger.error(files);
//     res.send({ success: true, data: files });
//   });
// }

exports.bulkUpdate = (req, res) => {
  logger.info('START upload files');

  const { filesId, portal, firmId, action, clientId, _personal } = req.body;
  
  // start loader 
  if (portal) {
    if (firmId) {
      Firm.query().findById(firmId) 
        .then(firm => {
          if (firm) {
            if (firm.allowDeleteFiles) {
              req.io.to(req.user._id).emit('file_update_progress_start', true);
              exports.bulkUpdateProcess(req, "", bulkUpdateResult => {
                callback(null, file);
              });
            } else {
              res.send({ success: false, message: "You do not have permission to delete this client file." });
            }
          } else {
            res.send({ success: false, message: "You do not have permission to delete this client file." });
          }
        });
    } else {
      res.send({ success: false, message: "You do not have permission to delete this client file." });
    }
  } else {
    req.io.to(req.user._id).emit('file_update_progress_start', true);
    if (action === "move") {
      File.query().findById(filesId[0]).then(file => {
        
        const getCurrentLocation = (callback) => {
          console.log("getCurrentLocation", file._client, clientId)
          console.log("getCurrentLocation", file._personal, _personal)
          if (file && file._client && file._client != clientId) {
            Client.query().findById(file._client).then(client => {
              if (client) {
                callback(client.name);
              } else {
                callback();
              }
            })
          } else if (file && file._personal && file._personal != _personal) {
            User.query().findById(file._personal).then(user => {
              if (user) {
                callback(`${user.firstname} ${user.lastname}`);
              } else {
                callback();
              }
            });
          } else if ((!file._client && clientId) || (!file._personal && _personal)) {
            callback("General Files");
          } else {
            callback(); 
          }
        }

        getCurrentLocation(result => {
          console.log("currentPlace", result)
          exports.bulkUpdateProcess(req, result, bulkUpdateResult => {
            res.send({ data: [], success: true });
          });
        });
      });
    } else {
      exports.bulkUpdateProcess(req, "", bulkUpdateResult => {
        res.send({ data: [], success: true });
      });
    }
  }
}

exports.bulkUpdateProcess = (req, currentPlace, bulkCallback) => {
  
  const { firmId, clientId, filesId, _folder, _personal, status, action, portal, viewingAs } = req.body;
  let progress = 0;

  exports.getAllConnectedFileIdAnyStatus(filesId, [], response => {

    req.io.to(req.user._id).emit('file_all_connected_files', response);
    if (response && response.length) {

      // get firm
      Firm.query().findById(firmId)
      .asCallback((err, firm) => {

        // get client
        Client.query().findById(clientId)
        .asCallback((err, client) => {

          // map fileIds
          async.mapSeries(response, (fileId, callback) => {

            File.query().findById(fileId)
            .asCallback((err, file) => {
              if (!err && file) {
 
                const oldFileNameWithFolders = fileUtils.buildFileNameWithFolders(file);
                let newFile = file;
                let fromUserString = "";
    
                // send progress status
                progress++;
                req.io.to(req.user._id).emit('file_update_status', {
                  filename: file.filename
                  , status: file.status
                  , category: file.category
                  , percent: parseInt((100 / response.length) * progress)
                  , response
                });
    
                // date update
                newFile.updated_at = new Date();

                // add mango details if file associated with client
                if (client) {
                  newFile.mangoClientID = client.mangoClientID;
                  newFile.mangoCompanyID = client.mangoCompanyID;
                  
                  // add file in mangobilling
                  if (!newFile.DMSParentID && firm && firm.mangoCompanyID && firm.mangoApiKey) {
                    const MANGO_CREATE_FILE = mangobilling.MANGO_CREATE_FILE;
                    let uniqueName = `${Math.floor(Math.random()*16777215).toString(16)}-${Math.floor(Math.random()*16777215).toString(16)}_${newFile.filename}`;
                    const requestBody = {
                      "CompanyID": newFile.mangoCompanyID,
                      "IShareCompanyID": newFile._firm,
                      "IShareDMSParentID": newFile._id,
                      "IShareClientID": newFile._client,
                      "ClientID": newFile.mangoClientID,
                      "FName": newFile.filename,
                      "ParentID": newFile.ParentID,
                      "YellowParentID": newFile.YellowParentID,
                      "ISharePublicFileUrl": `https://${appUrl}/api/files/download/${file._firm}/${file._client}/${file._id}/${file.filename}`,
                      "UniqueName": uniqueName,
                      "FileType": newFile.fileExtension,
                      "Size": newFile.fileSize ? (parseInt(file.fileSize) / 1000) + "kb" : "0kb",
                      "ShowInPortal": true
                    }
 
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
                    //       .findById(newFile._id)
                    //       .update({
                    //         filename: newFile.filename,
                    //         DMSParentID: mangoRes.data.dmsParentID
                    //       })
                    //       .returning('*')
                    //       .then((file) => {
                    //         console.log('file file', file);
                    //       })
                    //   }
                    // })
                    // .catch((err) => {
                    //   console.log('MANGO_CREATE_FILE ERROR', err);
                    // })
                  }
                } else {
                  newFile.mangoClientID = null;
                }
    
                if (action === "move") {
                  newFile._personal = _personal;
                  newFile._client = clientId || null;
    
                  if (currentPlace) {
                    fromUserString = `Moved from ${currentPlace} by %USER%`;
                  } else {
                    fromUserString = "Moved by %USER%";
                  }
    
                  if (filesId.includes(fileId)) {
                    newFile._folder = _folder;

                    if(_folder) {
                      File.query()
                      .findById(_folder)
                      .then(folder => {
                        newFile.YellowParentID = !folder.YellowParentID && !folder.ParentID ? folder.DMSParentID : folder.YellowParentID;
                        newFile.ParentID = folder.DMSParentID;
                      });
                    } else {
                      newFile.YellowParentID = null;
                      newFile.ParentID = null
                    }
                  }
                } else if (action === "status") {

                  if (newFile && newFile._folder) {
                    if (!response.includes(parseInt(newFile._folder))) {
                      newFile._folder = null;
                    }
                  }

                  newFile.status = status;
                  if (status === "visible") {
                    fromUserString = "Reinstated by %USER%";
        
                  } else if (status === "archived") {
                    fromUserString = "Archived by %USER%";
        
                  } else if (status === "deleted") {
                    fromUserString = "Deleted by %USER%";
        
                    newFile.filename = "deleted_" + Math.floor(Math.random()*16777215).toString(16) + ".svg";
                    newFile.fileExtension = '.svg';
                    newFile.contentType = 'image/svg+xml';
                  }
                }

                logger.error("newFIle", newFile);

                // add change to file activity
                fileActivityCtrl.utilCreateFromResource(
                  req
                  , newFile._id, newFile._firm, newFile._client, req.user ? req.user._id : null
                  , newFile.status, fromUserString
                  , "" // file._client ? `/firm/${file._firm}/workspaces/${file._client}/files/${file._id}` : `/firm/${file._firm}/files/${file._id}`
                  , "" // file._client ? `/portal/${file._client}/files/${file._id}` : ""
                );

                function CheckPermission(resPermission) {
                  if (viewingAs === "portal" && file && file._client) {
                    permissions.utilCheckClientContactPermission(req.user, file._client, file._firm, action, permission => {
                      console.log('client contact permission', permission);
                      resPermission(permission);
                    });
                  } else if (file && file._client) {
                    permissions.utilCheckClientPermission(req.user, file._client, "access", permission => {
                      console.log('client permission', permission);
                      resPermission(permission);
                    });
                  } else if (file && file._firm) {
                    permissions.utilCheckFirmPermission(req.user, file._firm || null, "access", permission => {
                      console.log('firm permission', permission);
                      resPermission(permission);
                    });
                  }
                }

                CheckPermission(permission => {
                  if (permission) {
                    File.query().findById(fileId)
                    .update(newFile)
                    .returning("*")
                    .then(resFile => {

                      if (resFile && resFile.status === "deleted" && action === "status" && resFile.status === "deleted") {
                        const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(resFile) 
                         if(newFileNameWithFolders !== oldFileNameWithFolders && resFile.category != "folder") {
                           console.log("Need to update Gcloud file path 1")
                           storage.bucket(bucketName)
                           .file(oldFileNameWithFolders)
                           .move(newFileNameWithFolders)
                           .then(result => {
                             console.log("moved physical file 5");
                             // res.send({success: true, file})
                             callback(null, resFile);
                           });
                         } else {
                           // no gcloud changes needed
                           callback(null, resFile);
                         }
                        // update mango billing
                        if (resFile.DMSParentID && firm && firm.mangoCompanyID && firm.mangoApiKey) {
                          const MANGO_DELETE_FILE = mangobilling.MANGO_DELETE_FILE.replace(':clientId', resFile.mangoClientID).replace(':companyId', resFile.mangoCompanyID);      
                          const requestBody = [resFile.DMSParentID]
                          // axios({
                          //   method: 'DELETE',
                          //   url: MANGO_DELETE_FILE,
                          //   data: requestBody,
                          //   headers: {
                          //     'vendorAPIToken': firm.mangoApiKey,
                          //     'Content-Type': 'application/json'
                          //   }
                          // })
                          // .then((mangoRes) => {
                          //   console.log('MANGO_DELETE_FILE RESPONSE', mangoRes.data);
                          // })
                          // .catch((err) => {
                          //   console.log('MANGO_DELETE_FILE ERROR', err);
                          // });
                        }

                        if (resFile.category != "folder") {
                          // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
                          storage.bucket(bucketName).file(oldFileNameWithFolders).delete({
                            validation: false
                            // note: https://github.com/googleapis/nodejs-storage/issues/709
                          }, (err, response) => {
                            console.log('deleted successfully');
                            callback(null, file);
                          });
                        }
                      } else if (resFile && resFile.DMSParentID && firm && firm.mangoCompanyID && firm.mangoApiKey) {
                        const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;
                        const requestBody = {
                          "CompanyID": file.mangoCompanyID,
                          "ClientID": file.mangoClientID,
                          "ParentID": file.ParentID,
                          "YellowParentID": file.YellowParentID,
                          "dmsParentID": file.DMSParentID,
                          "FName": file.filename,
                        }

                        if (action === "status" && resFile.status === "archived") {
                          requestBody.isArchived = true;
                        } else if (action === "status" && resFile.status === "visible") {
                          requestBody.isArchived = false;
                        }

                        // axios({
                        //   method: 'PUT',
                        //   url: MANGO_UPDATE_FILE,
                        //   data: requestBody,
                        //   headers: {
                        //     'vendorAPIToken': firm.mangoApiKey,
                        //     'Content-Type': 'application/json'
                        //   }
                        // })
                        // .then((mangoRes) => {
                        //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                        // })
                        // .catch((err) => {
                        //   console.log('MANGO_UPDATE_FILE ERROR', err);
                        // })
                        
                        const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(resFile) 
                        if(newFileNameWithFolders !== oldFileNameWithFolders && resFile.category != "folder") {
                          console.log("Need to update Gcloud file path 1")
                          storage.bucket(bucketName)
                          .file(oldFileNameWithFolders)
                          .move(newFileNameWithFolders)
                          .then(result => {
                            console.log("moved physical file 5");
                            // res.send({success: true, file})
                            callback(null, resFile);
                          });
                        } else {
                          // no gcloud changes needed
                          callback(null, resFile);
                        }
                      } else {
                        const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(resFile) 
                        if(newFileNameWithFolders !== oldFileNameWithFolders && resFile.category != "folder") {
                          console.log("Need to update Gcloud file path 1")
                          storage.bucket(bucketName)
                          .file(oldFileNameWithFolders)
                          .move(newFileNameWithFolders)
                          .then(result => {
                            console.log("moved physical file 5");
                            // res.send({success: true, file})
                            callback(null, resFile);
                          });
                        } else {
                          // no gcloud changes needed
                          callback(null, resFile);
                        }
                      }

                      // drive mapper file changes
                      if (resFile && resFile._id) {
                        exports.notifyDriveMapperOnFileChanges(resFile._id);
                      }
                    })
                  } else {
                    callback(null, null)
                  }
                });
              } else {
                File.query()
                .findById(fileId)
                .update(newFile) //valiation? errors?? 
                .returning('*') // doesn't do this automatically on an update
                .asCallback((err, file) => {

                  console.log("console.log", err)
                  console.log("console.log", file)

                  storageResult.push(file);
                  if (file.category === "folder") {
                    File.query()
                    .where("_folder", file._id)
                    .whereNot("status", "deleted")
                    .then(files => {
                      const subFileIds = files.map(a => a._id);
                      if (subFileIds.length) {
                        exports.bulkUpdateProcess(req, currentPlace, bulkUpdateResult => {
                          callback(null, file);
                        });
                      } else {
                        callback(null, null);
                      }
                    });

                    if(action === "status" && file.status === "deleted") {
                      Firm.query()
                      .findById(file._firm)
                      .then((firm) => {
                        if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {
  
                          console.log('delete file firm.....');
                          const MANGO_DELETE_FILE = mangobilling.MANGO_DELETE_FILE.replace(':clientId', file.mangoClientID).replace(':companyId', file.mangoCompanyID);      
                          const requestBody = [newFile.DMSParentID]
  
                          // axios({
                          //   method: 'DELETE',
                          //   url: MANGO_DELETE_FILE,
                          //   data: requestBody,
                          //   headers: {
                          //     'vendorAPIToken': firm.mangoApiKey,
                          //     'Content-Type': 'application/json'
                          //   }
                          // })
                          // .then((mangoRes) => {
                          //   console.log('MANGO_DELETE_FILE RESPONSE', mangoRes.data);
                          // })
                          // .catch((err) => {
                          //   console.log('MANGO_DELETE_FILE ERROR', err);
                          // })
                        }
                      })

                      // axios({
                      //   method: 'POST',
                      //   url: `https://itweb-250314.uc.r.appspot.com/v1/file/${file._id}/notify`
                      // })
                      // .then(({ data }) => {
                      //   console.log('App Spot', data);
                      // })
                      // .catch((err) => {
                      //   console.log('App Spot err', err);
                      // })

                    } else if(action === "status" && file.status === "archived") {
                      Firm.query()
                      .findById(file._firm)
                      .then((firm) => {
                        if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {
  
                          // console.log('delete file firm.....');
                          // const MANGO_ARCHIVE_FILE = mangobilling.MANGO_ARCHIVE_FILE.replace(':clientId', file.mangoClientID).replace(':companyId', file.mangoCompanyID);      
                          // const requestBody = [newFile.DMSParentID]
  
                          // console.log('MANGO_ARCHIVE_FILE url', MANGO_ARCHIVE_FILE);

                          // axios({
                          //   method: 'DELETE',
                          //   url: MANGO_ARCHIVE_FILE,
                          //   data: requestBody,
                          //   headers: {
                          //     'vendorAPIToken': firm.mangoApiKey,
                          //     'Content-Type': 'application/json'
                          //   }
                          // })
                          // .then((mangoRes) => {
                          //   console.log('MANGO_ARCHIVE_FILE RESPONSE', mangoRes.data);
                          // })
                          // .catch((err) => {
                          //   console.log('MANGO_ARCHIVE_FILE ERROR', err);
                          // })

                          const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;
      
                          const requestBody = {
                            "CompanyID": file.mangoCompanyID,
                            "ClientID": file.mangoClientID,
                            "ParentID": file.ParentID,
                            "YellowParentID": file.YellowParentID,
                            "dmsParentID": file.DMSParentID,
                            "FName": file.filename,
                            "isArchived": true
                          }

                          console.log('requestBody', requestBody);
  
                          // axios({
                          //   method: 'PUT',
                          //   url: MANGO_UPDATE_FILE,
                          //   data: requestBody,
                          //   headers: {
                          //     'vendorAPIToken': firm.mangoApiKey,
                          //     'Content-Type': 'application/json'
                          //   }
                          // })
                          // .then((mangoRes) => {
                          //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                          // })
                          // .catch((err) => {
                          //   console.log('MANGO_UPDATE_FILE ERROR', err);
                          // })
                        }
                      })

                      // axios({
                      //   method: 'POST',
                      //   url: `https://itweb-250314.uc.r.appspot.com/v1/file/${file._id}/notify`
                      // })
                      // .then(({ data }) => {
                      //   console.log('App Spot', data);
                      // })
                      // .catch((err) => {
                      //   console.log('App Spot err', err);
                      // })

                    } else if (action === "status" && file.status == "visible") { 
                      Firm.query()
                      .findById(file._firm)
                      .then((firm) => {
                        if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {
  
                          const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;
        
                          const requestBody = {
                            "CompanyID": file.mangoCompanyID,
                            "ClientID": file.mangoClientID,
                            "ParentID": file.ParentID,
                            "YellowParentID": file.YellowParentID,
                            "dmsParentID": file.DMSParentID,
                            "FName": file.filename,
                            "isArchived": false
                          }

                          console.log('requestBody', requestBody);
  
                          // axios({
                          //   method: 'PUT',
                          //   url: MANGO_UPDATE_FILE,
                          //   data: requestBody,
                          //   headers: {
                          //     'vendorAPIToken': firm.mangoApiKey,
                          //     'Content-Type': 'application/json'
                          //   }
                          // })
                          // .then((mangoRes) => {
                          //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                          // })
                          // .catch((err) => {
                          //   console.log('MANGO_UPDATE_FILE ERROR', err);
                          // })
                        }
                      })
                    } 
                  } else if (action === "status" && file.status === "deleted") {
                    Firm.query()
                    .findById(file._firm)
                    .then((firm) => {
                      if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {

                        console.log('delete file firm.....');

                        const MANGO_DELETE_FILE = mangobilling.MANGO_DELETE_FILE.replace(':clientId', file.mangoClientID).replace(':companyId', file.mangoCompanyID);      
                        const requestBody = [newFile.DMSParentID]

                        // axios({
                        //   method: 'DELETE',
                        //   url: MANGO_DELETE_FILE,
                        //   data: requestBody,
                        //   headers: {
                        //     'vendorAPIToken': firm.mangoApiKey,
                        //     'Content-Type': 'application/json'
                        //   }
                        // })
                        // .then((mangoRes) => {
                        //   console.log('MANGO_DELETE_FILE RESPONSE', mangoRes.data);
                        // })
                        // .catch((err) => {
                        //   console.log('MANGO_DELETE_FILE ERROR', err);
                        // })
                      }
                    })

                    // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
                    if (file.category != "folder") {
                      storage.bucket(bucketName).file(oldFileNameWithFolders).delete({
                        validation: false
                        // note: https://github.com/googleapis/nodejs-storage/issues/709
                      }, (err, response) => {
                        callback(null, file);
                      });
                    }
                    
                    // axios({
                    //   method: 'POST',
                    //   url: `https://itweb-250314.uc.r.appspot.com/v1/file/${file._id}/notify`
                    // })
                    // .then(({ data }) => {
                    //   console.log('App Spot', data);
                    // })
                    // .catch((err) => {
                    //   console.log('App Spot err', err);
                    // })

                  } else if (action === "status" && file.status === "archived") {
                    Firm.query()
                    .findById(file._firm)
                    .then((firm) => {
                      if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {
                        
                        const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;

                        const requestBody = {
                          "CompanyID": file.mangoCompanyID,
                          "ClientID": file.mangoClientID,
                          "ParentID": file.ParentID,
                          "YellowParentID": file.YellowParentID,
                          "dmsParentID": file.DMSParentID,
                          "FName": file.filename,
                          "isArchived": true
                        }

                        console.log('requestBody', requestBody);

                        // axios({
                        //   method: 'PUT',
                        //   url: MANGO_UPDATE_FILE,
                        //   data: requestBody,
                        //   headers: {
                        //     'vendorAPIToken': firm.mangoApiKey,
                        //     'Content-Type': 'application/json'
                        //   }
                        // })
                        // .then((mangoRes) => {
                        //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                        // })
                        // .catch((err) => {
                        //   console.log('MANGO_UPDATE_FILE ERROR', err);
                        // })
                      }
                      callback(null, file);
                    })

                    // axios({
                    //   method: 'POST',
                    //   url: `https://itweb-250314.uc.r.appspot.com/v1/file/${file._id}/notify`
                    // })
                    // .then(({ data }) => {
                    //   console.log('App Spot', data);
                    // })
                    // .catch((err) => {
                    //   console.log('App Spot err', err);
                    // })

                  } else if (action === "status" && file.status == "visible") { 
                    Firm.query()
                    .findById(file._firm)
                    .then((firm) => {
                      if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {

                        const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;
      
                        const requestBody = {
                          "CompanyID": file.mangoCompanyID,
                          "ClientID": file.mangoClientID,
                          "ParentID": file.ParentID,
                          "YellowParentID": file.YellowParentID,
                          "dmsParentID": file.DMSParentID,
                          "FName": file.filename,
                          "isArchived": false
                        }

                        console.log('requestBody', requestBody);

                        // axios({
                        //   method: 'PUT',
                        //   url: MANGO_UPDATE_FILE,
                        //   data: requestBody,
                        //   headers: {
                        //     'vendorAPIToken': firm.mangoApiKey,
                        //     'Content-Type': 'application/json'
                        //   }
                        // })
                        // .then((mangoRes) => {
                        //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                        // })
                        // .catch((err) => {
                        //   console.log('MANGO_UPDATE_FILE ERROR', err);
                        // })
                      }
                      callback(null, file);
                    })
                  } else {

                    Firm.query()
                    .findById(file._firm)
                    .then((firm) => {
                      if(firm.mangoCompanyID && firm.mangoApiKey && file.DMSParentID) {

                        const MANGO_UPDATE_FILE = mangobilling.MANGO_UPDATE_FILE;
      
                        const requestBody = {
                          "CompanyID": newFile.mangoCompanyID,
                          "ClientID": newFile.mangoClientID,
                          "ParentID": newFile.ParentID,
                          "YellowParentID": newFile.YellowParentID,
                          "dmsParentID": newFile.DMSParentID,
                          "FName": newFile.filename
                        }

                        console.log('requestBody', requestBody);

                        // axios({
                        //   method: 'PUT',
                        //   url: MANGO_UPDATE_FILE,
                        //   data: requestBody,
                        //   headers: {
                        //     'vendorAPIToken': firm.mangoApiKey,
                        //     'Content-Type': 'application/json'
                        //   }
                        // })
                        // .then((mangoRes) => {
                        //   console.log('MANGO_UPDATE_FILE RESPONSE', mangoRes.data);
                        // })
                        // .catch((err) => {
                        //   console.log('MANGO_UPDATE_FILE ERROR', err);
                        // })
                      }
                    })

                    const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(file) 
                    if(newFileNameWithFolders !== oldFileNameWithFolders && file.category != "folder") {
                      console.log("Need to update Gcloud file path 1")
                      storage.bucket(bucketName)
                      .file(oldFileNameWithFolders)
                      .move(newFileNameWithFolders)
                      .then(result => {
                        console.log("moved physical file 5");
                        // res.send({success: true, file})
                        callback(null, file);
                      })
                      .catch(err => {
                        console.log('storage error', error);
                        callback(null, file);
                      })
                    } else {
                      // no gcloud changes needed
                      callback(null, file);
                    }
                  }
                })    
              }
            });
    
          }, (err, result) => {
            
            console.log('debugging 1', err, result);
            if (err && !result) {
              req.io.to(req.user._id).emit('file_update_progress_end', action, []);
              bulkCallback();
            } else if (result) {
              req.io.to(req.user._id).emit('file_update_progress_end', action, result);
              bulkCallback();
            }
          });
        });
      });
    } else {
      req.io.to(req.user._id).emit('file_update_progress_end', action, response);
      bulkCallback();
    }
  });
};

exports.bulkDeleteFiles = (req, res) => {
  const { status, filesId } = req.body;

  async.map(filesId, (fileId, callback) => {

    File.query()
    .findById(fileId).then(oldFile => {

      // check _client && if true, run utilCheckClientPermission level admin
      if(oldFile && oldFile._client) {
        permissions.utilCheckClientPermission(req.user, oldFile._client, "access", permission => {
          if(!permission) {
            logger.info("user does NOT have permission.");
            res.send({success: false, message: "You do not have permission to update this client file."}); 
          } else {
            File.query()
            .findById(fileId)
            .update({ 
              'status':'deleted'
              , filename: "deleted_" + Math.floor(Math.random()*16777215).toString(16) + ".svg"
              , fileExtension: '.svg'
              , contentType: 'image/svg+xml'
            }) //valiation? errors?? 
            .returning('*') // doesn't do this automatically on an update
            .then(file => {
              // console.log("File", file)
              // const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(file) 
              // if(newFileNameWithFolders !== oldFileNameWithFolders) {
              //   console.log("Need to update Gcloud file path 1")
              //   storage.bucket(bucketName)
              //   .file(oldFileNameWithFolders)
              //   .move(newFileNameWithFolders)
              //   .then(result => {
              //     console.log("moved physical file");
              //     // res.send({success: true, file})
              //     callback(null, file);
              //   })

              // } else {
              //   // no gcloud changes needed
              //   // res.send({success: true, file})
              //   callback(null, null);
              // }
              if(!file) {
                callback(null, null);
              } else {
                console.log("updated file object", file)
  
                // now delete the actual file object from gcloud
                // ref: https://cloud.google.com/storage/docs/deleting-objects#storage-delete-object-nodejs
                // better ref: https://googleapis.dev/nodejs/storage/latest/File.html#delete
  
                // generate qualified name with folders.
                const fileNameWithFolders = fileUtils.buildFileNameWithFolders(oldFile)
                // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
                storage.bucket(bucketName).file(fileNameWithFolders).delete({
                  validation: false
                  // note: https://github.com/googleapis/nodejs-storage/issues/709
                }, (err, response) => {
                  if(err) {
                    console.log("ERR!", err);
                    console.log("FILE marked as deleted but error deleting gcloud object")
                    callback(null, file);
                  } else {
                    console.log("RESPONSE", response);
                    callback(null, file);
                  }
                })
              }

            })
          }
        }); 
      }
      // check _firm utilCheckFirmPermission level access 
      else if(oldFile && oldFile._firm) {
        permissions.utilCheckFirmPermission(req.user, oldFile._firm || null, "access", permission => {
          if(!permission) {
            logger.info("user does NOT have permission.")
            res.send({success: false, message: "You do not have permisson to update this firm file."})
          } else {
            File.query()
            .findById(fileId)
            .update({ 
              'status':'deleted'
              , filename: "deleted_" + Math.floor(Math.random()*16777215).toString(16) + ".svg"
              , fileExtension: '.svg'
              , contentType: 'image/svg+xml'
            }) //valiation? errors?? 
            .returning('*') // doesn't do this automatically on an update
            .then(file => {
              // console.log("File", file)
              // const newFileNameWithFolders = fileUtils.buildFileNameWithFolders(file) 
              // if(newFileNameWithFolders !== oldFileNameWithFolders) {
              //   console.log("Need to update Gcloud file path 2")
              //   storage.bucket(bucketName)
              //   .file(oldFileNameWithFolders)
              //   .move(newFileNameWithFolders)
              //   .then(result => {
              //     console.log("moved physical file");
              //     // console.log("DONE WITH MOVE!!", result);
              //     // res.send({success: true, file})
              //     callback(null, file);
              //   })

              // } else {
              //   // no gcloud changes needed
              //   // res.send({success: true, file})
              //   callback(null, file);
              // }

              if(!file) {
                callback(null, null);
              } else {
                console.log("updated file object", file)
  
                // now delete the actual file object from gcloud
                // ref: https://cloud.google.com/storage/docs/deleting-objects#storage-delete-object-nodejs
                // better ref: https://googleapis.dev/nodejs/storage/latest/File.html#delete
  
                // generate qualified name with folders.
                const fileNameWithFolders = fileUtils.buildFileNameWithFolders(oldFile)
                // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
                storage.bucket(bucketName).file(fileNameWithFolders).delete({
                  validation: false
                  // note: https://github.com/googleapis/nodejs-storage/issues/709
                }, (err, response) => {
                  if(err) {
                    console.log("ERR!", err);
                    console.log("FILE marked as deleted but error deleting gcloud object")
                    callback(null, file);
                  } else {
                    console.log("RESPONSE", response);
                    callback(null, file);
                  }
                })
              }
            })
          }
        });
      }

    })
  }, (err, files) => {
      
    // remove null from array, since every loop need a mapCallBack 
    files = files.filter(file => file);
    logger.error(files);
    res.send({ success: true, data: files });

    exports.getAllConnectedFileIdAnyStatus(filesId, [], response => {
      if (response && response.length) {
        response.map(fileId => {
          exports.notifyDriveMapperOnFileChanges(fileId);
          return fileId;
        });
        FileSynchronization.query().whereIn('_file', response).del().returning("*").asCallback((fsErr, fileSync) => {
          console.log("delete FileSynchronization", fsErr, fileSync);
        });
      } else if (filesId && filesId.length) {
        filesId.map(fileId => {
          exports.notifyDriveMapperOnFileChanges(fileId);
          return fileId;
        });
        FileSynchronization.query().whereIn('_file', filesId).del().returning("*").asCallback((fsErr, fileSync) => {
          console.log("delete FileSynchronization", fsErr, fileSync);
        });
      }
    });
  });
}

exports.delete = (req, res) => {
  logger.warn("deleting file");

  /**
   * where can a file be referenced?
   * clientTask
   * clientTaskResponse
   * note
   * clientNote
   * firm
   * shareLink
   * quickTask (as returnedFiles, unsignedFiles)
   */

  // rather than actually delete and risk breaking a lot of stuff, we will do the following:
  // 1. delete actual file in glcoud, and reassign to some generic "delete" file
  // 2. mark status as "deleted"
  // 3. then, on front end, catch for files with that status everywhere

  // 1. get file
  const fileId = parseInt(req.params.id) // has to be an int
  File.query()
  .findById(fileId)
  .asCallback((err, oldFile) => {
    if(err || !oldFile) {
      res.send({success: false, message: err})
    } else {
      // 2. check permission
      console.log("found file, checking permission");
      permissions.utilCheckFirmPermission(req.user, oldFile._firm || null, "access", permission => {
        if(!permission) {
          logger.info("user does NOT have permission.")
          res.send({success: false, message: "You do not have permisson to delete this firm file."})
        } else {
          // 3. update file status and info
          File.query()
          .findById(fileId)
          .update({
            'status':'deleted'
            , filename: "deleted_" + Math.floor(Math.random()*16777215).toString(16) + ".svg"
            , fileExtension: '.svg'
            , contentType: 'image/svg+xml'
          })
          .returning('*') // doesn't do this automatically on an update
          .asCallback((err, file) => {
            if(err || !file) {
              res.send({success: false, message: err})
            } else {
              console.log("updated file object", file)

              // now delete the actual file object from gcloud
              // ref: https://cloud.google.com/storage/docs/deleting-objects#storage-delete-object-nodejs
              // better ref: https://googleapis.dev/nodejs/storage/latest/File.html#delete

              // generate qualified name with folders.
              const fileNameWithFolders = fileUtils.buildFileNameWithFolders(oldFile)
              // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
              storage.bucket(bucketName).file(fileNameWithFolders).delete({
                validation: false
                // note: https://github.com/googleapis/nodejs-storage/issues/709
              }, (err, response) => {
                if(err) {
                  console.log("ERR!", err);
                  console.log("FILE marked as deleted but error deleting gcloud object")
                  res.send({success: false, message: err.message, file})
                } else {
                  console.log("RESPONSE", response);
                  res.send({success: true, file})
                }
              })

              exports.getAllConnectedFileIdAnyStatus([fileId], [], response => {
                if (response && response.length) {
                  response.map(item => {
                    exports.notifyDriveMapperOnFileChanges(item);
                    return item;
                  });
                  FileSynchronization.query().whereIn('_file', response).del().returning("*").asCallback((fsErr, fileSync) => {
                    console.log("delete FileSynchronization 3", fsErr, fileSync)
                  });
                } else {
                  exports.notifyDriveMapperOnFileChanges(fileId);
                  FileSynchronization.query().where({ _file: fileId }).del().returning("*").asCallback((fsErr, fileSync) => {
                    console.log("delete FileSynchronization 3", fsErr, fileSync)
                  });
                }                
              });
            }
          })
        }
      });
    }
  })
}

exports.utilListByClientPermission = (user, clientId, FileQuery, callback) => {
  logger.info('Fetching files by client permission');

  permissions.utilCheckClientPermission(user, clientId, "client", clientPermission => {
    console.log("files by client permission check", clientPermission)
    console.log('clientPermission', clientPermission);
    if(clientPermission) {
      logger.info('fetching files as client');
      // User has at least "client" level permission. Execute the query.
      FileQuery
      .asCallback((err, files) => {
        if(err || !files) {
          logger.error("ERROR: ")
          logger.info(err)
          callback({success: false, message: err || "There was a problem finding the requested files."})
        } else {
          console.log('get client files', files);
          callback({success: true, files})
        }
      })
    } else {
      // User doesn't have permission.
      callback({success: false, message: "You do not have permission to access this api route."});
    }
  })
}

exports.utilListByFirmPermission = (user, firmId, FileQuery, callback) => {
  logger.info('Fetching files by firm permission');
  // Check for "admin" level permission (super admins and staff owners)
  permissions.utilCheckFirmPermission(user, firmId, "access", permission => {
    console.log('req.user', user);
    if(!permission) {
      logger.info('User does not have permission to access files by firmId: ', firmId);
      callback({success: false, message: "You do not have permission to access this api route."});
    } else {
      if(user.admin || user.owner) {
        FileQuery
        .asCallback((err,files) => {
          if(err || !files) {
            logger.error("ERROR: ")
            logger.info(err)
            callback({success: false, message: err || "There was a problem finding the requested files."})
          } else {
            callback({success: true, files})
          }
        })
      } else {
        if(!!user._client) {
          staffClientsCtrl.utilGetByFirmAndUser(user._id, firmId, result => {
            if(result.success) {
              let firmUserClientIds = result.staffClients.map(sc => sc._client)
              FileQuery
              .where(builder => {
                builder
                .whereIn('_client', firmUserClientIds)
                .orWhereNull('_client')
              })
              .asCallback((err,files) => {
                if(err || !files) {
                  callback({success: false, message: err || "There was a problem finding the requested files."})
                } else {
                  callback({success: true, files})
                }
              })
            } else {
              callback({success: false, message: err || "There was a problem finding the requested files."})
            }
          })
        } else {
          FileQuery
          // .where({
          //   _client: null
          // })
          .asCallback((err,files) => {
            if(err || !files) {
              callback({success: false, message: err || "There was a problem finding the requested files."})
            } else {
              callback({success: true, files})
            }
          })
        }
      }
    }
  });

  // permissions.utilCheckFirmPermission(user, firmId, "admin", adminPermission => {
  //   console.log("files by firm admin permission check", adminPermission)
  //   if(adminPermission) {
  //     logger.info('fetching files as admin');
  //     // User has "admin" level permission. Don't limit the query.
  //     FileQuery
  //     .asCallback((err,files) => {
  //       if(err || !files) {
  //         logger.error("ERROR: ")
  //         logger.info(err)
  //         callback({success: false, message: err || "There was a problem finding the requested files."})
  //       } else {
  //         callback({success: true, files})
  //       }
  //     })
  //   } else {
  //     // User is not an admin. Check for access level permission (staffClients)
  //     permissions.utilCheckFirmPermission(user, firmId, "access", accessPermission => {
  //       logger.info("files by firm access permission check", accessPermission)
  //       if(!accessPermission) {
  //         logger.info('User does not have permission to access files by firmId: ', firmId);
  //         callback({success: false, message: "You do not have permission to access this api route."});
  //       } else {
  //         logger.info('fetching files as staff');
  //         // User has "access" level permission. Limit the query to files belonging to their assigned clients.
  //         staffClientsCtrl.utilGetByFirmAndUser(user._id, firmId, result => {
  //           if(result.success) {
  //             let firmUserClientIds = result.staffClients.map(sc => sc._client)
  //             FileQuery
  //             .where(builder => {
  //               builder
  //               .whereIn('_client', firmUserClientIds)
  //               .orWhereNull('_client')
  //             })
  //             .asCallback((err,files) => {
  //               if(err || !files) {
  //                 callback({success: false, message: err || "There was a problem finding the requested files."})
  //               } else {
  //                 callback({success: true, files})
  //               }
  //             })
  //           } else {
  //             callback({success: false, message: err || "There was a problem finding the requested files."})
  //           }
  //         })
  //       }
  //     })
  //   }
  // })
}

// NOTE: This method is no longer being used. It can probably be completely replaced by utilListByFirmPermission above.
exports.listByStaff = (req, res) => {
  /**
   * NOTE: This method is being used with more than just _staff as a query param
   * so it needed to be expanded. Now it can find files by _staff AND any other
   * fields that exist on file, even _tags.
   */
  const nextParams = req.params['0'];
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    let tagIds = [];
    let subQuery = {};
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {
        // special catch for tag queries
        // they should be separated by commas
        if(nextParams.split("/")[i] == "_tags") {
          // raw tag id: allow multiple tags in query
          // console.log(nextParams.split("/")[i+1].split(","))
          tagIds = tagIds.concat(nextParams.split("/")[i+1].split(","))
        } else {
          subQuery[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
        }
      }
    }
    logger.info('Find all files associated with this staff member:', req.params.staffId)
    Staff.query()
    .findById(req.params.staffId)
    .asCallback((err, staff) => {
      if(err) {
        res.send({success: false, message: "Error finding staff"});
      } else {
        permissions.utilCheckFirmPermission(req.user, staff._firm, "access", permission => {
          if(!permission) {
            logger.info("user does NOT have permission.")
            res.send({success: false, message: "You do not have permisson to update this firm file."})
          } else {
            let rawQuery = null
            if(tagIds.length > 0) {
              rawQuery = sqlUtils.buildArrayContainsQuery('_tags', tagIds)
            }
            if(staff.owner) {
              logger.info("Staff user is owner, fetch all firm files")
              if(rawQuery) {
                File.query()
                .where({_firm: staff._firm})
                .whereRaw(...rawQuery)
                .andWhere(subQuery)
                .orderBy('_id', 'desc')
                .asCallback((err, files) => {
                  if(err) {
                    console.log("ERROR")
                    console.log(err);
                    res.send({success: false, message: "trouble fetching all firm files"})
                  } else {
                    logger.info('success')
                    res.send({success: true, files})
                  }
                })
              } else {
                File.query()
                .where({_firm: staff._firm})
                .andWhere(subQuery)
                .orderBy('_id', 'desc')
                .asCallback((err, files) => {
                  if(err) {
                    console.log("ERROR")
                    console.log(err);
                    res.send({success: false, message: "trouble fetching all firm files"})
                  } else {
                    logger.info('success')
                    res.send({success: true, files})
                  }
                })
              }
            } else {
              logger.info("Staff user is NOT owner, fetch assigned client files")
              StaffClient.query()
              .where({_staff: req.params.staffId})
              .asCallback((err, staffClients) => {
                if(err) {
                  res.send({success: false, message: 'Error finding staffClients'})
                } else {
                  let clientIds = staffClients.map(sc => sc._client);
                  /**
                   * Fetch all files for the clients this staff member is assigned 
                   * OR where _client: null  to capture uploaded files from shareLinks 
                   */
                  if(rawQuery) {
                    File.query()
                    .whereIn('_client', clientIds)
                    .orWhere({_firm: staff._firm, _client: null})
                    .whereRaw(...rawQuery)
                    .andWhere(subQuery)
                    .orderBy('_id', 'desc')
                    .asCallback((err, files) => {
                      if(err) {
                        console.log("ERROR")
                        console.log(err);
                        res.send({success: false, message: "trouble fetching assigned client files"})
                      } else {
                        logger.info('success')
                        res.send({success: true, files})
                      }
                    })
                  } else {
                    File.query()
                    .whereIn('_client', clientIds)
                    .orWhere({_firm: staff._firm, _client: null})
                    .andWhere(subQuery)
                    .orderBy('_id', 'desc')
                    .asCallback((err, files) => {
                      if(err) {
                        console.log("ERROR")
                        console.log(err);
                        res.send({success: false, message: "trouble fetching assigned client files"})
                      } else {
                        logger.info('success')
                        res.send({success: true, files})
                      }
                    })
                  }
                }
              }) 
            }
          }
        })
      }
    })
  }
}

exports.utilGetBase64String = (fileId, callback) => {
  File.query()
  .findById(fileId)
  .asCallback((err, file) => {
    if(err || !file) {
      // No success
      return callback({ success: false, message: err || "Error retrieving file."})
    } else {
      // success, generate qualified name with folders
      const fileNameWithFolders = fileUtils.buildFileNameWithFolders(file);
      // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
      const selectedFile = storage.bucket(bucketName).file(fileNameWithFolders)
      selectedFile.download()
      .then((data) => {
        if(!data || !data[0]) {
          return callback({ success: false, message: "Error retrieving file."})
        } else {
          const contents = data[0]
          let base64string = contents.toString('base64')
          const fileObj = {
            data: base64string
            , fileExtension: file.fileExtension
            , filename: file.filename
          }
          return callback({ success: true, file: fileObj })
        }
      }).catch(error => {
        logger.error(error);
        callback({ success: false, message: "File could not be retrieved." });
      });
    }
  });
}

// Converts a buffer to a readable stream.
// More info: https://nodejs.org/api/stream.html
exports.utilConvertBufferToStream = buffer => {
  const stream = new Readable({
    read() {
      this.push(buffer);
      // pushing null signals the end of the stream. That's how the "finish" event is triggered.
      this.push(null);
    }
  });
  return stream;
}

exports.utilFileNotification = (req, user, firm, file, fromUserString, link, callback) => {

  let notification = {};
  notification._user = user._id;
  if (req && req.query && req.query.multiple) {
    notification.content = `${fromUserString} has ${req.query.type} files`; // customize output
  } else {
    notification.content = `${fromUserString} has ${req.query.type} file ${file.filename}`; // customize output
  }
  notification.link = link;
  Notification.query().insert(notification)
  .returning('*')
  .then(res => {
    if(res) {
      req.io.to(user._id).emit('receive_notification', notification);
      // send email notification
      const sendNotification = {
        sender: brandingName.email.noreply
        , link: link
        , content: res.content
        , subject: res.content
        , userlist: [user.username]
        , firm: firm
      }
      notificationsCtrl.utilNotification(sendNotification, notifCallback => {
        callback("sent success", notifCallback);
      });
    }
  });
}

exports.getRootFolder = async (folderId) => {
  if(folderId) {
    await File.query()
      .select(["_id", "_folder", "DMSParentID"])
      .findById(folderId)
      .then(async (selectedFolder) => {
        console.log('selectedFolder', selectedFolder);
        if(selectedFolder._folder) {
          await exports.getRootFolder(selectedFolder._folder);
        } else {
          RootFolder = selectedFolder;
        }
      })
  }
}

exports.createFolder = (req, res) => {
    logger.info('creating new folder');

  let { portal, _firm, _client, _personal } = req.body;

  console.log('_client', !!_client);

  if(!_client) {
    _client = null;
    delete req.body._client;
  }

  if (_personal === "general" || _personal === "personal") {
    delete req.body._personal;
  }

  if (portal && _client && req.user) {

    permissions.utilCheckClientPermission(req.user, _client, "client", permission => {
      logger.info("debug 1", permission);
      if (permission) {
        Firm.query().findById(_firm) 
          .then(firm => {
            if (firm) {
              if (firm.allowCreateFolder) {
                delete req.body.portal;
                File.query().insert(req.body)
                .returning('*')
                .then(files => {
                    if(!!files) {
                      Firm.query()
                        .findById(files._firm)
                        .then(async (firm) => {
                          console.log('firm', firm);
                          if(firm.mangoCompanyID && firm.mangoApiKey && _client) {
                            logger.info('----mango folder create----');
                            const MANGO_CREATE_FOLDER  = mangobilling.MANGO_CREATE_FOLDER;

                            let ParentFolder = null;
                            let _folder = files._folder;

                            if(!!_folder) {
                              ParentFolder = await File.query()
                                .findById(_folder)
                                .then((file) => {
                                  return file && file._id ? file : null;
                                });

                              if(ParentFolder._folder) {
                                await exports.getRootFolder(ParentFolder._folder);
                              } else {
                                RootFolder = ParentFolder;
                              }
                            } else {
                              RootFolder = null;
                              ParentFolder = null;
                            }

                            console.log('RootFolder',RootFolder);

                            const requestBody = {
                              "CompanyID": firm.mangoCompanyID,
                              "IShareCompanyID": firm._id,
                              "IShareDMSParentID": files._id,
                              "IShareClientID": files._client,
                              "ClientID": files.mangoClientID,
                              "FName": files.filename,
                              "ParentID": ParentFolder && ParentFolder.DMSParentID ? ParentFolder.DMSParentID : null,
                              "YellowParentID": RootFolder && RootFolder.DMSParentID ? RootFolder.DMSParentID : null,
                              "ShowInPortal": true
                            }

                            console.log('requestBody', requestBody);

                            // axios({
                            //   method: 'POST',
                            //   url: MANGO_CREATE_FOLDER,
                            //   data: requestBody,
                            //   headers: {
                            //     'vendorAPIToken': firm.mangoApiKey,
                            //     'Content-Type': 'application/json'
                            //   }
                            // })
                            // .then((mangoRes) => {
                            //   mangoRes = mangoRes.data;
                            //   console.log('mangoRes', mangoRes.data);

                            //   if(mangoRes && mangoRes.data && mangoRes.data.dmsParentID) {
                            //     const mangoFolder = mangoRes.data;
                            //     File.query()
                            //       .findById(files._id)
                            //       .update({
                            //         DMSParentID: mangoFolder.dmsParentID,
                            //         ParentID: mangoFolder.ParentID,
                            //         YellowParentID: mangoFolder.YellowParentID
                            //       })
                            //       .returning('*')
                            //       .then((files) => {
                            //         res.send({success: true, files: [files]});
                            //       })
                            //       .catch(err => {
                            //         res.send({success: true, files: [files]});
                            //       })
                            //   } else {
                            //     res.send({success: true, files: [files]});
                            //   }
                            // })
                            // .catch((err) => {
                            //   res.send({success: true, files: [files]})
                            // })
                            res.send({success: true, files: [files]})
                          } else {
                            res.send({success: true, files: [files]});
                          }
                        })
                        .catch(err => {
                          res.send({success: true, files: [files]});
                        })
                        exports.notifyDriveMapperOnFileChanges(files && files._id);
                    } else {
                      res.send({ success: false, message: "Could not save folder"});
                    }
                })
                .catch(err => {
                  res.status(500);
                  res.send({success: false, message: 'Internal server error'});
                })
              } else {
                res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
              }
            } else {
              res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
            }
          })
          .catch(err => {
            res.status(500)
            res.send({success: false, message: "Internal server error"});
          })
      } else {
        res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
      }
    });  
  } else if (_firm && req.user) {
    permissions.utilCheckFirmPermission(req.user, _firm || null, "access", permission => {
      logger.info("debug 2", permission);
      if (permission) {
        File.query().insert(req.body)
        .returning('*')
        .then(files => {
            if(!!files) {
              Firm.query()
              .findById(files._firm)
              .then(async (firm) => {
                console.log('firm', firm);
                if(firm.mangoCompanyID && firm.mangoApiKey && _client && files.mangoClientID) {
                  logger.info('----mango folder create----');
                  const MANGO_CREATE_FOLDER = mangobilling.MANGO_CREATE_FOLDER;

                  let ParentFolder = null;
                  let _folder = files._folder;

                  if(!!_folder) {
                    ParentFolder = await File.query()
                      .findById(_folder)
                      .then((file) => {
                        return file && file._id ? file : null;
                      });

                    if(ParentFolder._folder) {
                      await exports.getRootFolder(ParentFolder._folder);
                    } else {
                      RootFolder = ParentFolder;
                    }
                  } else {
                    RootFolder = null;
                    ParentFolder = null;
                  }

                  console.log('RootFolder',RootFolder);

                  const requestBody = {
                    "CompanyID": firm.mangoCompanyID,
                    "IShareCompanyID": firm._id,
                    "IShareDMSParentID": files._id,
                    "IShareClientID": files._client,
                    "ClientID": files.mangoClientID,
                    "FName": files.filename,
                    "ParentID": ParentFolder && ParentFolder.DMSParentID ? ParentFolder.DMSParentID : null,
                    "YellowParentID": RootFolder && RootFolder.DMSParentID ? RootFolder.DMSParentID : null,
                    "ShowInPortal": true
                  }

                  console.log('requestBody', requestBody);
                  res.send({success: true, files: [files]});
                  // axios({
                  //   method: 'POST',
                  //   url: MANGO_CREATE_FOLDER,
                  //   data: requestBody,
                  //   headers: {
                  //     'vendorAPIToken': firm.mangoApiKey,
                  //     'Content-Type': 'application/json'
                  //   }
                  // })
                  // .then((mangoRes) => {
                  //   mangoRes = mangoRes.data;
                  //   console.log('mangoRes', mangoRes.data);
                  //   if(mangoRes && mangoRes.data && mangoRes.data.dmsParentID) {
                  //     const mangoFolder = mangoRes.data;
                  //     File.query()
                  //       .findById(files._id)
                  //       .update({
                  //         DMSParentID: mangoFolder.dmsParentID,
                  //         ParentID: mangoFolder.ParentID,
                  //         YellowParentID: mangoFolder.YellowParentID
                  //       })
                  //       .returning('*')
                  //       .then((files) => {
                  //         res.send({success: true, files: [files]});
                  //       })
                  //       .catch(err => {
                  //         res.send({success: true, message: [files]});
                  //       })
                  //   } else {
                  //     res.send({success: true, files: [files]});
                  //   }
                  // })
                  // .catch((err) => {
                  //   res.send({success: true, files: [files]})
                  // })

                } else {
                  res.send({success: true, files: [files]});
                }
              })
              .catch(err => {
                res.send({success: true, files: [files]});
              })
              exports.notifyDriveMapperOnFileChanges(files && files._id);
            } else {
                res.send({ success: false, message: "Could not save folder"});
            }
        })
        .catch(err => {
          res.status(500);
          res.send({success: false, message: 'Internal server error'});
        })
      } else {
        res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
      }
    });
  } else if (req && req.firm) {
    console.log('req.firm', req.firm);
    Firm.query().findById(_firm) 
    .then(firm => {
      if (firm) {
        if (req.firm._id == firm._id) {
          File.query().insert(req.body)
          .returning('*')
          .then(files => {
              if(files) {
                Firm.query()
                  .findById(files._firm)
                  .then(async (firm) => {
                    console.log('firm', firm);
                    if(firm.mangoCompanyID && firm.mangoApiKey && files._client) {
                      logger.info('----mango folder create----');
                      const MANGO_CREATE_FOLDER  = mangobilling.MANGO_CREATE_FOLDER;

                      let ParentFolder = null;
                      let _folder = files._folder;

                      if(!!_folder) {
                        ParentFolder = await File.query()
                          .findById(_folder)
                          .then((file) => {
                            return file && file._id ? file : null;
                          });

                        if(ParentFolder._folder) {
                          await exports.getRootFolder(ParentFolder._folder);
                        } else {
                          RootFolder = ParentFolder;
                        }
                      } else {
                        RootFolder = null;
                        ParentFolder = null;
                      }

                      console.log('RootFolder',RootFolder);

                      const requestBody = {
                        "CompanyID": firm.mangoCompanyID,
                        "IShareCompanyID": firm._id,
                        "IShareDMSParentID": files._id,
                        "IShareClientID": files._client,
                        "ClientID": files.mangoClientID,
                        "FName": files.filename,
                        "ParentID": ParentFolder && ParentFolder.DMSParentID ? ParentFolder.DMSParentID : null,
                        "YellowParentID": RootFolder && RootFolder.DMSParentID ? RootFolder.DMSParentID : null,
                        "ShowInPortal": true
                      }

                      console.log('requestBody', requestBody);
                      res.send({success: true, files: [files]});
                      // axios({
                      //   method: 'POST',
                      //   url: MANGO_CREATE_FOLDER,
                      //   data: requestBody,
                      //   headers: {
                      //     'vendorAPIToken': firm.mangoApiKey,
                      //     'Content-Type': 'application/json'
                      //   }
                      // })
                      // .then((mangoRes) => {
                      //   mangoRes = mangoRes.data;
                      //   console.log('mangoRes', mangoRes.data);

                      //   if(mangoRes && mangoRes.data && mangoRes.data.dmsParentID) {
                      //     const mangoFolder = mangoRes.data;
                      //     File.query()
                      //       .findById(files._id)
                      //       .update({
                      //         DMSParentID: mangoFolder.dmsParentID,
                      //         ParentID: mangoFolder.ParentID,
                      //         YellowParentID: mangoFolder.YellowParentID
                      //       })
                      //       .returning('*')
                      //       .then((files) => {
                      //         res.send({success: true, files: [files]});
                      //       })
                      //   } else {
                      //     res.send({success: true, files: [files]});
                      //   }

                      // })
                      // .catch((err) => {
                      //   res.send({success: true, files: [files]})
                      // })

                    } else {
                      res.send({success: true, files: [files]});
                    }
                  })
                  exports.notifyDriveMapperOnFileChanges(files && files._id);
              } else {
                res.send({ success: false, message: "Could not save folder"});
              }
          });
        } else {
          res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
        }
      } else {
        res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
      }
    })
  } else {
    res.send({ success: false, message: "Access Denied: Your request includes unauthorized client permissions." });
  }
}

exports.getByRequestTask = (req, res) => {
 if (req.params.requestTaskId) {
    RequestTask.query().findById(req.params.requestTaskId)
      .then(json => {
        if (json && json._returnedFiles && json._returnedFiles.length) {
          File.query()
            .whereIn('_id', json._returnedFiles)
            .whereNot("status", "deleted")
            .then(files => {
              res.send({ success: true, files });
            });
        } else {
          res.send({ success: true, files: [] });
        }
      });
  } else {
    res.send({ success: false, message: "Files not found" });
  }
}


exports.uploadFiles = (req, res) => {
  logger.info("upload by request task hex");

  RequestTask.query().where({ hex: req.params.hex })
    .then(requestTask => {
      if (requestTask) {
        exports.utilCreateFile(req, res);
      }
    });
}

exports.getBase64String = (req, res) => {
  console.log('get base64 by id:', req.params.id);
  exports.utilGetBase64String(req.params.id, result => {
    if (result.success) {
      res.send({ success: true, file: result.file });
    } else {
      res.send({ success: false });
    }
  });
}

// TODO: make this as a global utility
async function getFileContent(fileData) {
  const fileName = fileUtils.buildFileNameWithFolders(fileData)
  const fileContent = await storage.bucket(bucketName).file(fileName).download()
  return fileContent[0]
}
// TODO: make this a a global utility and refactor
async function getFlatMap({ data, io, userId, prefix = "" }) {
  let flatMap = {}

  // traverse data to build the flat map
  for (let counter = 0; counter < data.length; counter++) {
    let item = data[counter]
    let fullPath = `${prefix}/${item.filename}`
    if (item.category !== "folder") {
      flatMap[fullPath] = await getFileContent(item)
    } else {
      let subData = await File.query().where({ _folder: item._id })
      if (subData.length) {
        let subFlatMap = await getFlatMap({data: subData, prefix: fullPath})
        flatMap = { ...flatMap, ...subFlatMap }
      } else {
        flatMap[fullPath.concat("/")] = Buffer.from([])
      }
    }

    // check if io and userId params are present then trigger websocket
    if (io && userId) {
      const percentage = Math.ceil(((counter + 1) / data.length) * 100)
      io.to(userId).emit("progress_status", percentage)
    }
  }

  return flatMap
}

// TODO: make this as a global utility
async function createZipFile(flatMap) {
  const zip = new AdmZip() // initialize zip

  //iterate through flat map to build the zip content
  for (let path in flatMap) {
    zip.addFile(path, flatMap[path])
  }

  return zip
}

exports.downloadFilesAndFoldersAsZip = async (req, res) => {
  try {
    const io = req.io
    io.to(req.user._id).emit('start_progress', "Downloading");

    const fileIds = req.params.fileIds ? JSON.parse(req.params.fileIds) : []

    if(!fileIds.length) {
      res.status(400).json({
        success:false,
        message: "Please provide fileIds"
      })
    }

    const data = await File.query().findByIds(fileIds)

    if (!data.length) {
      res.status(404).json({
        success: false,
        message: "Can't find records using the provided file ids"
      })
    }

    const flatMap = await getFlatMap({data, io, userId: req.user._id, prefix: "Files Zipped"})

    const zip = await createZipFile(flatMap)

    io.to(req.user._id).emit("finish_progress", "Download Complete")

    res.header("Content-Disposition", contentDisposition("Files Zipped.zip"));
    res.send(zip.toBuffer());
      
  } catch (error) {
    logger.error(error)
    res.status(500).json({ success: false, message: error})
  }
}

exports.downloadFileOrFolder = async (req, res) => {
  try {
    const fileId = req.params.fileId
    
    if(!fileId) {
      res.status(400).json({
        success: false,
        message: "Missing parameter fileId"
      })

      return;
    }

    const fileObject = await File.query().findById(fileId)

    if(!fileObject) {
      res.status(404).json({
        success: false,
        message: `Can't find file with and id of ${fileId}`
      })

      return;
    }

    if(fileObject.category !== "folder") {
      const fileBuffer  = await getFileContent(fileObject)
      res.header("Content-Disposition", contentDisposition(fileObject.filename))
      res.send(fileBuffer)
    }

    const contents = await File.query().where({_folder: fileId})
    
    const flatMap = await getFlatMap({data: contents, prefix: fileObject.filename})

    const zip = await createZipFile(flatMap)

    res.header("Content-Disposition", contentDisposition(`${fileObject.filename}.zip`));
    res.send(zip.toBuffer());

  } catch (error) {
    logger.error(error)
    res.status(500).json({ success: false, message: error})
  }
}

exports.bulkDownload = (req, res) => {
  let fileMap = {};
  async.mapSeries(req.body.fileIds, (fileId, cb) => {
    exports.utilGetBase64String(fileId, result => {
      if (result.success) {
        fileMap[fileId] = result.file;
        cb(null, result.file);
      } else {
        cb(true, null);
      }
    });
  }, (err, result) => {
    if (!err) {
      res.send({ success: true, files: result, fileMap });
    } else {
      res.send({ success: false, message: "failed to convert to base64" });
    }
  })
}

exports.bulkRestore = (req, res) => {
  const { fileIds, _firm } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm || null, "access", permission => {
    if(!permission) {
      logger.info("user does NOT have permission.")
      res.send({success: false, message: "You do not have permisson to update this firm file."})
    } else {

      const updObj = { status: "visible", contentType: "", _folder: null };
      File.query().whereIn("_id", fileIds).update(updObj).returning("*")
        .asCallback((err, files) => {
          if (err && !files) {
            console.log("bulkRestore", err);
            res.send({ success: false, message: "Failed to restore files" });
          } else {
            res.send({ success: true, data: files });
            fileIds.map(file => {
              exports.notifyDriveMapperOnFileChanges(file && file._id);
            });
          }
        });
    }
  });
}

exports.getClientFolders = (req, res) => {

  if (req.params.clientId) {
    const clientId = req.params.clientId;
    Client.query()
      .findById(clientId)
      .then((client) => {
        if(client && client._id) {
          if(client.status == 'deleted') {
            res.send({success: true, files: []});
          } else {
            File.query()
            .where({
              '_client': clientId,
              'status': 'visible'
            })
            .orderBy('_id', 'desc')
            .whereNot("status", "deleted")
            .whereNot("status", "archived")
            .select([...fileColumns])
            .then(files => {
              console.log('files.length', files.length);
              files.map(f => {
                f.status = 'visible'
              });

              res.send({success: true, files})
            })  
            .catch(err => {
              res.status(500);
              res.send({success: false, message: "Internal Server Error"})
            })
          }
        } else {
          res.send({success: true, files: []});
        }
      })
      .catch(err => {
        res.status(500);
        res.send({success: false, message: "Internal Server Error"})
      })
  } else {
    res.send({ success: false, message: "Files not found" });
  }
}

exports.getFoldersByFoldername = (req, res) => {

  const foldername = req.params.foldername;

  if (req.params.clientId) {
    const clientId = req.params.clientId;

    console.log('req.headers', req.headers);

    if(req.user && req.user._id) {
      Client.query()
        .findById(clientId)
        .then((client) => {
          if(client && client._id) {
            permissions.utilCheckFirmPermission(req.user, client._firm, 'access', permission => {
              if(!permission) {
                res.send({success: false, message: "You don't have permission to access this client"});
              } else {
                if(client.status == 'deleted') {
                  res.send({success: true, folders: []})
                } else {
                  File.query()
                  .where({
                    '_client': clientId,
                    '_firm': client._firm,
                    'category': 'folder'
                  })
                  .orderBy('_id', 'desc')
                  .whereNot("status", "deleted")
                  .then(files => {
                    files = files.filter((file) => {
                      return file.filename.toLowerCase().includes(foldername.toLowerCase());
                    })
              
                    res.send({success: true, folders: files})
                  })
                }

              }
            })
          } else {
            res.send({success: false, message: "Client not found"});
          }
        })
    } else if (req.firm && req.firm._id) {
      File.query()
      .where({
        '_client': clientId,
        '_firm': req.firm._id,
        'category': 'folder'
      })
      .orderBy('_id', 'desc')
      .whereNot("status", "deleted")
      .then(files => {
        files = files.filter((file) => {
          return file.filename.toLowerCase().includes(foldername.toLowerCase());
        })
  
        res.send({success: true, folders: files})
      })
    }

  } else {
    res.send({ success: false, message: "Files not found" });
  }
}

exports.createBulkFolder = (req, res) => {

  const { filePointers, folders } = req.body;
  let socketId; // Depending on where this call is coming from, we either want to send updates to req.user._id or to the sharelink hex.
  if(req.user) {
    socketId = req.user._id
  }

  Firm.query().findById(filePointers._firm).then(firm => {

    if (firm) {
      const folder = {
        _user: req.user ? req.user._id : null
        , _client: filePointers._client
        , _folder: filePointers._folder
        , _firm: filePointers._firm
        , _personal: filePointers._personal
        , category: "folder"
        // , filename: name
        , status: "visible"
        , wasAccessed: false
        , mangoClientID: filePointers.mangoClientID ? filePointers.mangoClientID : null
        , mangoCompanyID: filePointers.mangoCompanyID ? filePointers.mangoCompanyID : null 
        , ParentID: filePointers.ParentID
        , YellowParentID: filePointers.YellowParentID
      }

      if (filePointers.uploadName) {
        folder.uploadName = filePointers.uploadName;
      }

      exports.createSubFolder(firm, req, folder, folders, null, null, [], [], [], response => {
        console.log(response)
        if (response && response.success) {
          if (socketId) {
            req.io.to(socketId).emit('created_folder_finished', response.parentFolders);
          }
          res.send(response);
        }
        // if (response.success) {
        //   res.send({ success: true, folders: response.folders });
        // } else {
        //   res.send({ success: false, message: response.message });
        // }
      });
    } else {
      res.send({ success: false, message: "user does NOT have permission." });
    }
  });
}

exports.createSubFolder = (firm, req, folderDetail, folders, parentId, folder, folderStorage, foldersId, parentFolders, callback) => {
  const filteredFolder = folders.filter(item => item._folder === parentId);
  const { _client, mangoClientID } = req.body.filePointers;
  console.log("parentId", parentId)
  console.log("parentId", folder)
  async.map(filteredFolder, (currfolder, cb) => {
    folderDetail.filename = currfolder.name;
    foldersId.push(currfolder._id);
    if (folder && folder._id) {
      folderDetail._folder = folder._id;
    }
    
    if(Object.keys(folderDetail).includes('_oldId')) {
      delete folderDetail['_oldId'];
    }

    File.query().insert(folderDetail).returning("*").asCallback((err, newFolder) => {
      if (err && !newFolder) {
        console.log("error1", err);
        cb();
      } else {
        newFolder._oldId = currfolder._id;
        if (!currfolder._folder) {
          parentFolders.push(newFolder);
        }
        folderStorage.push(newFolder);
        if (firm && firm.mangoCompanyID && firm.mangoApiKey && _client && mangoClientID) {
          const MANGO_CREATE_FOLDER  = mangobilling.MANGO_CREATE_FOLDER;

          const ParentID = parentId
          const requestBody = {
            "CompanyID": firm.mangoCompanyID,
            "IShareCompanyID": firm._id,
            "IShareDMSParentID": newFolder._id,
            "IShareClientID": newFolder._client,
            "ClientID": newFolder.mangoClientID,
            "FName": newFolder.filename,
            "ParentID": newFolder.ParentID,
            "YellowParentID": newFolder.YellowParentID,
            "ShowInPortal": true
          }

          exports.createSubFolder(firm, req, folderDetail, folders, currfolder._id, newFolder, folderStorage, foldersId, parentFolders, (err, response) => {
            cb(null, folderStorage);
          });
          
          // axios({
          //   method: 'POST',
          //   url: MANGO_CREATE_FOLDER,
          //   data: requestBody,
          //   headers: {
          //     'vendorAPIToken': firm.mangoApiKey,
          //     'Content-Type': 'application/json'
          //   }
          // })
          // .then((mangoRes) => {
          //   mangoRes = mangoRes.data;
          //   console.log('mangoRes', mangoRes.data);
          //   if(mangoRes && mangoRes.data && mangoRes.data.dmsParentID) {
          //     const mangoFolder = mangoRes.data;

          //     ParentID = mangoFolder.dmsParentID;

          //     File.query()
          //       .findById(newFolder._id)
          //       .update({
          //         DMSParentID: mangoFolder.dmsParentID,
          //         ParentID: mangoFolder.ParentID,
          //         YellowParentID: mangoFolder.YellowParentID
          //       })
          //       .returning('*')
          //       .then((files) => {
          //         exports.createSubFolder(firm, req, folderDetail, folders, currfolder._id, newFolder, folderStorage, foldersId, parentFolders, (err, response) => {
          //           cb(null, folderStorage);
          //         });
          //       })

          //   } else {
          //     exports.createSubFolder(firm, req, folderDetail, folders, currfolder._id, newFolder, folderStorage, foldersId, parentFolders, (err, response) => {
          //       cb(null, folderStorage);
          //     });
          //   }
          // })
          // .catch((err) => {
          //   exports.createSubFolder(firm, req, folderDetail, folders, currfolder._id, newFolder, folderStorage, foldersId, parentFolders, (err, response) => {
          //     cb(null, folderStorage);
          //   });
          // })
        } else {
          exports.createSubFolder(firm, req, folderDetail, folders, currfolder._id, newFolder, folderStorage, foldersId, parentFolders, (err, response) => {
            cb(null, folderStorage);
          }); 
        }
        exports.notifyDriveMapperOnFileChanges(newFolder && newFolder._id);
      }
    });
  }, (err, result) => {

    const completedProcess = foldersId.every(folderId => folders.filter(f => f._id === folderId));
    console.log("completedProcess", completedProcess);
    console.log("folderStorage", folderStorage);
    if (completedProcess) {
      callback({ success: true, data: folderStorage, parentFolders });
    } else {
      callback();
    }
  });
}

exports.utilAdvanceSearch = (vectorQueryString, firmId = null, firmClientIds = null, body, callback) => {
  console.log("FILES UTIL SEARCH", vectorQueryString, firmId, firmClientIds);
  let {
    dateCreated
    , clientName
    , creatorName
    , status
    , typeName
  } = body;

  if (vectorQueryString && vectorQueryString.indexOf('-AMPERSAND-') > -1) {
    vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '&');
  }

  vectorQueryString = vectorQueryString && vectorQueryString.trim().toLowerCase();
  clientName = clientName && clientName.trim().toLowerCase();
  creatorName = creatorName && creatorName.trim().toLowerCase();
  typeName = typeName && typeName.trim().toLowerCase();
  
  // if (vectorQueryString && vectorQueryString.trim()) {
  //   vectorQueryString = vectorQueryString.replace(/ /g, ' & ');
  //   vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, ' & ');
  //   while(vectorQueryString.indexOf('& &') > -1) {
  //     vectorQueryString = vectorQueryString.replace(/& &/g, '&')
  //   }
  // }


  // 4 types, which may end up being more different later

  // 1 client, only access their files
  // 2 firm user, only access client files that they are staff too
  // 3 firm admin, access all firm files
  // 4 global admin - NOTE: "we don't have any access to your files" from demo call

  /**
   * NOTE REGARDING TEXT SEARCH IN POSTGRES:
   * By default, to_tsvector doesn't save entire strings but only saves
   * the stem or lexeme of each word. This means common prefixes and suffixes will not be stored. A file named "taxes" may only
   * have "tax" saved in document_vectors. This means if a user searches "tax", the file called "taxes" will be returned, but
   * if a user searches "taxes" it will not.
   * 
   * Below we were passing "simple" as the first argument to to_tsquery. That means our search text is not transformed at all
   * and we run in to the problem described above ("tax" returns the file named "taxes", but "taxes" does not).
   * By removing "simple", our search text will be treated the same way as our document_vectors are saved. This allows us to
   * search "taxes" and return the file called "taxes" because our search text will omit common prefixes and suffixes.
   * 
   * More info here: http://rachbelaid.com/postgres-full-text-search-is-good-enough/
   */

  const getClientIds = (callback) => {
    if (clientName) {
      Client.query()
      .whereNot('status', 'deleted')
      .where(build => {
        if (firmId) {
          build.where({ _firm: firmId });
        }
      })
      .whereRaw('LOWER(name) LIKE ?', `%${clientName}%`)
      .then(clients => {
        if (clients) {
          let clientIds = clients.map(val => val._id);
          if (clientIds && clientIds.length) {
            callback(clientIds);
          } else {
            callback(null);
          }
        } else {
          callback(null);
        }
      });
    } else {
      callback(null);
    }
  }

  const getUserIds = (callback) => {
    if (creatorName) {
      User.query()
      .from('users as u')
      .whereRaw('concat(LOWER(u.firstname),  \' \', LOWER(u.lastname)) LIKE ?', `%${creatorName}%`)
      .then(users => {
        if (users) {
          let usersIds = users.map(val => val._id);
          console.log("document_vectors", users, usersIds)
          if (usersIds && usersIds.length) {
            callback(usersIds);
          } else {
            callback([]);
          }
        } else {
          callback([]);
        }
      });
    } else {
      callback(null);
    }
  }

  const getQuery = (callback) => {
    let fileQuery = File.query().where(builder => {
      builder.whereNot('status', 'deleted')
      builder.whereRaw('LOWER(filename) LIKE ?', `%${vectorQueryString}%`)

      if (firmId) {
        builder.where({ _firm: firmId });
      }
      
      if (firmClientIds && firmClientIds.length) {
        builder.whereIn('_client', firmClientIds);
      }

      if (firmClientIds && firmClientIds.length) {
        builder.whereIn('_client', firmClientIds);
      }

      if (firmClientIds && firmClientIds.length) {
        builder.whereIn('_client', firmClientIds);
      }

      if (status && !status.visible) {
        builder.whereNot("status", "visible");
      }
      if (status && !status.locked) {
        builder.whereNot("status", "locked");
      }
      if (status && !status.hidden) {
        builder.whereNot("status", "hidden");
      }
      if (status && !status.archived) {
        builder.whereNot("status", "archived");
      }
      if (dateCreated) {
  
        let startDate = moment(dateCreated.startDate);
        let endDate = moment(dateCreated.endDate);

        startDate = startDate.subtract(1, 'days');
        startDate = startDate.format();
        endDate = endDate.add(1, 'days');
        endDate = endDate.format();
    
        // global time
        const startDateISO = DateTime.fromISO(startDate);
        const endDateISO = DateTime.fromISO(endDate);
  
        builder.whereBetween('created_at', [startDateISO, endDateISO]);
      }

      if (typeName) {
        // builder.whereRaw(`document_vectors @@ to_tsquery('${body.type.name}:*')`)

        if (typeName.indexOf('fold') > -1 || typeName.indexOf('dir') > -1) {
          builder.where({ 'category': 'folder' });
        } else {
          builder.where("fileExtension", "like", `%${typeName}%`)
        }
      }
    });

    getClientIds(clientIds => {

      if (clientIds) {
        fileQuery = fileQuery.where(builder => {
          builder.whereIn('_client', clientIds)
        });
      }

      getUserIds(userIds => {
        if (userIds) {
          fileQuery = fileQuery.where(builder => {
            builder.whereIn('_user', userIds)
          }); 
          callback(fileQuery);
        } else {
          callback(fileQuery);
        }
      });
    });
  } 

  getQuery(fileQuery => {

    fileQuery
    .where(builder => {

      if (firmId) {
        builder.where({ '_firm': firmId });
      }

      if (firmClientIds && firmClientIds.length) {
        builder.whereIn('_client', firmClientIds);
      }
      // search vector string
      const queryArr = vectorQueryString.split(' & ');
      if (queryArr && queryArr.length) {
          queryArr.map(item => {
              builder.orWhereRaw('LOWER(filename) LIKE ?', `%${item}%`)
          });
      }
    })
    .orderBy('_id', 'desc') 
    .then(files => {

      console.log('files', files.length);
      callback({success: true, files});
    })
  });
}

exports.getAllConnectedFileId = (fileIds, storageIds, response) => {
  let newFileIds = [];
  fileIds.forEach(item => {
    if (storageIds.indexOf(item) === -1) {
      newFileIds.push(item);
      storageIds.push(item);
    }
  });

  if (newFileIds && newFileIds.length) {
    File.query().whereIn('_folder', newFileIds)
      .whereNotIn('status', ['deleted', 'archived'])
      .then(files => {
      if (files && files.length) {
        newFileIds = files.map(item => item._id);
        exports.getAllConnectedFileId(newFileIds, storageIds, second_response => {
          response(storageIds);
        });
      } else {
        response(storageIds)
      }
    });
  } else {
    response(storageIds)
  }
}

exports.getAllConnectedFileIdAnyStatus = (fileIds, storageIds, response) => {
  let newFileIds = [];
  fileIds.forEach(item => {
    if (storageIds.indexOf(item) === -1) {
      newFileIds.push(item);
      storageIds.push(item);
    }
  });

  if (newFileIds && newFileIds.length) {
    File.query().whereIn('_folder', newFileIds).whereNot({ status: 'deleted' }).then(files => {
      if (files && files.length) {
        newFileIds = files.map(item => item._id);
        exports.getAllConnectedFileIdAnyStatus(newFileIds, storageIds, second_response => {
          response(storageIds);
        });
      } else {
        response(storageIds)
      }
    });
  } else {
    response(storageIds)
  }
}

exports.getListByClientIds = (req, res) => {
  const {
    clientIds
    , firmId
    , totalPublicAndPersonal
  } = req.body;


  const getPublicFiles = (callback) => {
    if (totalPublicAndPersonal && !totalPublicAndPersonal.hasOwnProperty('public') && !totalPublicAndPersonal.hasOwnProperty('personal')) {
      File.query().where({
        _firm: firmId
        , _client: null
      }).where(builder => {
        builder.whereNull('_client')
        builder.whereNot('status', 'archived');
        builder.whereNot('status', 'deleted');
      })
      .asCallback((err, publicFiles) => {
    
        if (!err && publicFiles) {
          console.log("publicFiles", publicFiles.length)
          const response = {};
          response['public'] = {};
          response['personal'] = {};
          response['public'].totalFiles = publicFiles.filter(file => !file._client && !file._personal && file.category !== "folder").length;
          response['public'].totalFolders = publicFiles.filter(file => !file._client && !file._personal && file.category === "folder").length;
          response['personal'].totalFiles = publicFiles.filter(file => !file._client && file._personal && file.category !== "folder");
          response['personal'].totalFolders = publicFiles.filter(file => !file._client && file._personal && file.category === "folder");
          console.log("response". response)
          callback(response);
        } else {
          logger.error("ERROR: ")
          logger.info(err)
          callback({});
          // res.send({success: false, message: err || "Problem finding files"});
        }
      });
    } else {
      callback({});
    }
  }

  getPublicFiles(response => {
    File.query()
    .whereIn('_client', clientIds)
    .where(builder => {
      builder.whereNot('status', 'archived');
      builder.whereNot('status', 'deleted');
    })
    .asCallback((err, files) => {
      if (!err && files) {

        // res.send({ success: false, message: "Files not found." });
        async.map(clientIds, (clientId, cb) => {
          response[clientId] = {};
          response[clientId].totalFiles = files.filter(file => file._client === clientId && file.category !== "folder").length;
          response[clientId].totalFolders = files.filter(file => file._client === clientId && file.category === "folder").length;
          cb(null, response);
  
        }, (errRes, result) => {
          // console.log("res", result);
          if (!errRes && result) {
            res.send({ success: true, data: response });
          } else {
            res.send({ success: true, data: response });
          }
        });
      } else {
        logger.error("ERROR: ")
        logger.info(err)
        res.send({success: false, message: err || "Problem finding files"});
      }
    });
  });
}

exports.notifyDriveMapperOnFileChanges = (fileId) => {
  console.log('notify drive mapper', fileId)
  axios({
    method: 'POST',
    url: `https://itweb-250314.uc.r.appspot.com/v1/file/${fileId}/notify`,
    headers: { 'Content-Type': 'application/json' }
  })
  .then((result) => {
    console.log(result && result.data)
  })
  .catch((error) => {
    console.log(error);
  })
}

exports.getSameFilenames = (res, viewingAs, file) => {
  if (file && file._firm) {
    Firm.query().findById(file._firm).then(firm => {
      if (firm && firm.fileVersionType) {
        let status = [];
        if (viewingAs === "portal") {
          status = ["locked", "visible"];
        } else {
          if (file.status === "archived") {
            status = ["archived"];
          } else {
            status = ["hidden", "locked", "visible"];
          }
        }

        File.query().where({
          filename: file.filename
          , _firm: file._firm
          , _client: file._client
        })
        .whereIn("status", status)
        .whereNot("status", "deleted")
        .where(builder => {
          if (file._personal) {
            builder.where("_personal", file._personal);
          } else {
            builder.where({ _personal: null }).orWhere({ _personal: "" })
          }
        })
        .where(builder => {
          if (file._folder) {
            builder.where("_folder", file._folder);
          } else {
            builder.where({ _folder: null }).orWhere({ _folder: "" })
          }
        })
        .orderBy('created_at', 'desc')
        .then(files => {

          console.log('files', files.length)
          if (files && files.length) {
            file.olderVersions = files;
            res.send({success: true, file});
          } else {
            res.send({success: true, file});
          }
        })
      } else {
        res.send({success: true, file});
      }
    })
  } else {
    res.send({success: true, file});
  }
}

exports.utilGetPDFBase64String = (model, oldFileId, callback) => {
  exports.utilConvertDocxToPDF(model, oldFileId, response => {
    console.log('test 2');
    if (response && response.success) {
      if (response.file) {
        delete response.base64;
        callback(response);
      } else {
        let base64string = response.fileBuffer.toString('base64');
        const fileObj = {
          data: base64string
          , fileExtension: response.fileExtension
          , filename: response.filename
        }
        callback({ success: true, file: fileObj })
      }
    }
  });
}

exports.utilConvertDocxToPDF = (model, oldFileId, callback) => {
  const getBase64String = (callback) => {
    if (model === "file") {
      exports.utilGetBase64String(oldFileId, response => {
        callback(response);
      });
    } else if (model === "template") {
      documentTemplateCtrl.utilGetBase64String(oldFileId, response => {
        response.file = response.template;
        delete response.template;
        callback(response);
      });
    }
  }

  getBase64String(response => {
    if (response && response.success) {
      const file = response.file;
      if (file && file.fileExtension && file.fileExtension.toLowerCase().indexOf('pdf') > -1) {
        callback(response);
      } else {
        const filename = file.filename.substr(0, file.filename.indexOf('.')) + '.pdf';
        const docxBuffer = Buffer.from(file.data, 'base64');
        libre.convert(docxBuffer, ".pdf", undefined, (err, buffer) => {
          if (err) {
            callback({ success: false });
          } else {
            file.fileBuffer = buffer;
            file.data = buffer.toString('base64');
            file.filename = filename;
            response.file = file;
            callback(response);
          }
        })
      }
    }
  });
}

exports.test = (req, res) => {
  const fileId = req.params.id;
  File.query().findById(fileId).then(file => {
    exports.utilConvertDocxToPDF('file', file._id, response => {
      if (response && response.success) {
        res.header(`Content-Disposition`, contentDisposition(response.filename));
        res.send(response.fileBuffer);
      }
    });
  })
}

exports.searchV2 = async (req, res) => {
  const searchFirmId = req.body.searchFirmId;
  const searchClientId = req.body.searchClientId;
  const searchFolderId = req.body.searchFolderId;
  const searchPersonalId = req.body.searchPersonalId;
  const searchPageNumber = ((req.body.searchPageNumber || 1) - 1) * req.body.searchPerPage;
  const searchPerPage = req.body.searchPerPage;
  const searchSortName = req.body.searchSortName;
  const searchSortAsc = req.body.searchSortAsc;
  const searchStatus = req.body.searchViewingAs === 'workspace-view' ? ['visible', 'none', 'hidden', 'locked'] 
    : req.body.searchViewingAs === 'workspace-archived-view' ? ['archived'] : ['visible', 'locked'];
  const searchTags = req.body.searchTags ? req.body.searchTags.split(',') : [];
  const searchFIds = req.body.searchFIds ? req.body.searchFIds.split(',') : null;
  let searchText = req.body.searchText;
  searchText = searchText || '';
  searchText = searchText && searchText.trim();
  searchText = searchText && searchText.toLowerCase();
      
  permissions.utilCheckPermission(req.user, searchFirmId, searchClientId, permission => {
    if (!permission) {
      res.send({success: false, message: "You do not have permisson to access this files."});
    } else {
      Firm.query().findById(searchFirmId)
      .then(firm => {
        if (!firm) {
          res.send({success: false, message: "Firm not found"});
        } else {

          // where clause for client and personal
          let FileQuery = File.query()
          .where({ '_firm': searchFirmId })
          .whereIn('status', searchStatus)
          .where(builder => {
            if (searchText && searchText.trim()) {
              builder.whereRaw(`LOWER(filename) LIKE ?`, [`%${searchText}%`])
            }
            if (searchClientId) {
              builder.where('_client', searchClientId);
              builder.where(builderV2 => {
                builderV2.where({ '_personal': null }).orWhere({ '_personal': '' })
              });
            } else if (searchPersonalId) {
              builder.where('_personal', searchPersonalId);
              builder.whereNull('_client');
            } else {
              builder.whereNull('_client');
              builder.where(builder => {
                builder.where({ '_personal': null }).orWhere({ '_personal': '' })
              })
            }
          });

          // where clause for fileIds or status and folder 
          if (searchFIds && searchFIds.length) {
            FileQuery.whereIn('_id', searchFIds);
          } else {
            FileQuery
            .where(builder => {
              if (searchFolderId) {
                builder.where('_folder', searchFolderId);
              } else {
                builder.where({ '_folder': null }).orWhere({ '_folder': '' })
              }
            })
          }

          
          // FileQuery
          // .select(['f.*', raw('row_to_json(fp) as permission')])
          // .groupBy([
          //   'f._id'
          //   ,' fp._id'
          // ])

          if(searchTags && searchTags.length) {
            let rawQuery = sqlUtils.buildArrayContainsQuery('_tags', searchTags)
            FileQuery = FileQuery.whereRaw(...rawQuery)
          }

          // const cloneFileQuery = _.cloneDeep(FileQuery);
          // const totalSize = cloneFileQuery.select(['_id']).resultSize();
          // const pageQuery = FileQuery
          //   .orderBy([
          //     { column: 'contentType', order: 'desc' }
          //     , { column: searchSortName, order: searchSortAsc }
          //   ])
          //   .offset(searchPageNumber)
          //   .limit(searchPerPage)

          // Promise.all([pageQuery, totalSize])
          // .then(([files, totalSize]) => {
          //   if(files && files.length > 0) {
          //     utilFiles(files, response => {
          //       res.send({success: true, files: response.files, totalFiles: totalSize });
          //     });
          //   } else {
          //     res.send({ success: true, files: [], totalFiles: 0});
          //   }
          // })
          // .catch(err => {
          //   console.log('---db error---', err);
          //   res.send({success: false, message: err || "There was a problem finding the requested files."})
          // })
          
          FileQuery.then(files => {
            if(files && files.length > 0) {
              utilFiles(files, response => {
                res.send({success: true, files: response.files, totalFiles: response.totalFiles });
              });
            } else {
              res.send({ success: true, files: [], totalFiles: 0});
            }
          })
          .catch(err => {
            console.log('---db error---', err);
            res.send({success: false, message: err || "There was a problem finding the requested files."})
          })

          const utilFiles = (files, callback) => {
            let newFiles = files; 
    
            // file version
            if (req.body.searchViewingAs === 'workspace-archived-view') {
              firm.fileVersionType = 'disabled';
            }

            fileUtils.utilGroupByFilename(firm, newFiles, (groupByResult) => {
              // callback(response);
              newFiles = groupByResult;
    
              // file sort
              fileUtils.utilSortFiles(newFiles, searchSortName, searchSortAsc, response => {

                // callback(response);
                newFiles = response;
      
                // file pagination
                utilFilesFilterPagination(newFiles, response => {
                  callback({ files: response, totalFiles: groupByResult.length });
                });
              });
            });
          }
        
          const utilFilesFilterPagination = (files, callback) => {
            callback(files.slice(searchPageNumber, (parseInt(searchPageNumber) + parseInt(searchPerPage))));
          }
        }
      });
    }
  });
}

exports.getAllConnectedFiles = (file, oldFolderIds, fileIds, folderIds, response) => {
  let newFolderIds = [];
  oldFolderIds.forEach(item => {
    if (folderIds.indexOf(item) === -1) {
      newFolderIds.push(item);
      folderIds.push(item);
    }
  });

  if (newFolderIds && newFolderIds.length) {
    File.query().whereIn('_folder', newFolderIds)
      .whereNotIn('status', ['deleted', 'archived'])
      .where(builder => {
        if (file._client) {
          builder.where({ _client: file._client });
        } else if (file._personal) {
          builder.where({ _personal: file._personal });
        } else {
          builder.where({ _personal: null, _client: null }).orWhere({ _personal: '', _client: null })
        }
      })
      .then(files => {
        if (files && files.length) {
          files.map(item => {
            if (item && item.category === 'folder') {
              newFolderIds.push(item._id);
            } else if (item) {
              fileIds.push(item._id);
            }
          });
          exports.getAllConnectedFiles(file, newFolderIds, fileIds, folderIds, second_response => {
            response({ folders: folderIds, files: fileIds });
          });
        } else {
          response({ folders: folderIds, files: fileIds });
        }
      });
  } else {
    response({ folders: folderIds, files: fileIds });
  }
}


exports.getParentFolders = (req, res) => {
  const list = [];
  const files = [];
  let fileId = req.params.id;
  fileId = parseInt(fileId);
  (function loop() {
      if (fileId && list.indexOf(fileId) === -1) {
          list.push(fileId);
          File.query()
            .from('files as f')
            // .leftJoin('folderpermission as fp', 'fp._folder', 'f._id')
            .findById(fileId)
            // .select(['f.*', raw('row_to_json(fp) as permission')])
            .then(file => {
              files.push(file);
              fileId = parseInt(file._folder);
              loop();
          });
      } else {
          res.send({ success: true, files });
      }   
  }())
}

exports.getFileVersion = (req, res) => {
  if (req.params.id) {
    File.query().findById(req.params.id)
    .then(file => {
      if (file && file._id) {
        permissions.utilCheckPermission(req.user, file._firm, file._client, permission => {
          if (!permission) {
            res.send({success: false, message: "You do not have permisson to access this files."});
          } else {
            File.query().where({
              filename: file.filename
              , status: file.status
            })
            .where(builder => {
              if (file._client) {
                builder.where('_client', file._client);
                builder.where(builderV2 => {
                  builderV2.where({ _personal: null }).orWhere({ _personal: '' })
                });
              } else if (file._personal) {
                builder.where('_personal', file._personal);
                builder.whereNull('_client');
              } else {
                builder.whereNull('_client');
                builder.where(builder => {
                  builder.where({ _personal: null }).orWhere({ _personal: '' })
                })
              }
            })
            .where(builder => {
              if (file && file._folder) {
                builder.where('_folder', file._folder);
              } else {
                builder.where(builder => {
                  builder.where({ _folder: null }).orWhere({ _folder: '' })
                })
              }
            })
            .orderBy('_id', 'desc')
            .then(files => {
              const fileIds = files.map(item => item._id);
              ClientNote.query()
                .whereIn('_file', fileIds)
                .then(clientNotes => {
                  const objClientNotes = {};
                  clientNotes.forEach(item => {
                    if (objClientNotes[item._file]) {
                      if (objClientNotes[item._file]._id < item._id) {
                        objClientNotes[item._file] = item;
                      }
                    } else {
                      objClientNotes[item._file] = item;
                    }
                  })
                  res.send({ success: true, files, objClientNotes });
                });
            });
          }
        });
      } else {
        res.send({ success: false, message: "file not found" });
      }
    });
  } else {
    res.send({ success: false, message: "file not found" });
  }
}

exports.utilConvertActualFile = (currentExt, nextExt, filePath, callback) => {
  currentExt = currentExt && currentExt.trim() && currentExt.trim().toLowerCase();

  if (currentExt === nextExt) {
    callback({ success: false });
  } else if (currentExt === ".pdf" && nextExt === ".docx") {
    callback({ success: false });
  }
}

exports.getTotalChildFile = (req, res) => {
  const firmId = req.body.firmId;
  const clientId = req.body.clientId;
  const personalId = req.body.personalId;
  const status = req.body.searchViewingAs === 'workspace-view' ? ['visible', 'none', 'hidden', 'locked'] 
    : req.body.searchViewingAs === 'workspace-archived-view' ? ['archived'] : ['visible', 'locked'];
  const folderIds = req.body.folderIds;
  if (!folderIds || !(folderIds && folderIds.length)) {
    res.send({ success: false, message: 'File Id not found' });
  } else if (!firmId) {
    res.send({ success: false, message: 'Firm Id not found' });
  } else {
    permissions.utilCheckPermission(req.user, firmId, clientId, permission => {
      if (!permission) {
        res.send({success: false, message: "You do not have permisson to access this files."});
      } else {
        File.query()
        .where({ '_firm': firmId })
        .whereIn('status', status)
        .where(builder => {
          if (clientId) {
            builder.where('_client', clientId);
            builder.where(builderV2 => {
              builderV2.where({ '_personal': null }).orWhere({ '_personal': '' })
            });
          } else if (personalId) {
            builder.where('_personal', personalId);
            builder.whereNull('_client');
          } else {
            builder.whereNull('_client');
            builder.where(builder => {
              builder.where({ '_personal': null }).orWhere({ '_personal': '' })
            })
          }
        })
        .then(allFiles => {

          File.query().whereIn('_id', folderIds)
          .then(files => {
            if (files && files.length) {
              files.forEach(file => {
                utilGetAllConnectedFiles(allFiles, [file], [], [], associatedResults => {
                  file.totalChildFile = associatedResults && associatedResults.length || 0;
                });
              });
              res.send({ success: true, files });
            } else {
              res.send({ success: true })
            }
          });


          const utilGetAllConnectedFiles = (fileList, list, arrFileId, arrFolderId, callback) => {
            let newArrFolderId = [];
            list.forEach(item => {
              if (item.category != 'folder' && arrFileId.indexOf(item._id) === -1) {
                arrFileId.push(item._id);
              } else if (item.category === 'folder' && arrFolderId.indexOf(item._id) === -1) {
                arrFolderId.push(item._id);
                newArrFolderId.push(Number(item._id));
              }
            });

            const newList = fileList.filter(item => newArrFolderId.indexOf(Number(item._folder)) > -1);
            if (newList && newList.length) {
              utilGetAllConnectedFiles(fileList, newList, arrFileId, arrFolderId, loopResponse => {
                callback(arrFileId);
              });
            } else {
              callback(arrFileId);
            }
          }
        });
      }
    });
  }
}

exports.getTotalChildFolder = (req, res) => {
  const firmId = req.body.firmId;
  const clientId = req.body.clientId;
  const personalId = req.body.personalId;
  const status = req.body.searchViewingAs === 'workspace-view' ? ['visible', 'none', 'hidden', 'locked'] 
    : req.body.searchViewingAs === 'workspace-archived-view' ? ['archived'] : ['visible', 'locked'];
  const folderIds = req.body.folderIds;
  if (!folderIds || !(folderIds && folderIds.length)) {
    res.send({ success: false, message: 'File Id not found' });
  } else if (!firmId) {
    res.send({ success: false, message: 'Firm Id not found' });
  } else {
    permissions.utilCheckPermission(req.user, firmId, clientId, permission => {
      if (!permission) {
        res.send({success: false, message: "You do not have permisson to access this files."});
      } else {
        File.query()
        .where({ '_firm': firmId })
        .whereIn('status', status)
        .where(builder => {
          if (clientId) {
            builder.where('_client', clientId);
            builder.where(builderV2 => {
              builderV2.where({ '_personal': null }).orWhere({ '_personal': '' })
            });
          } else if (personalId) {
            builder.where('_personal', personalId);
            builder.whereNull('_client');
          } else {
            builder.whereNull('_client');
            builder.where(builder => {
              builder.where({ '_personal': null }).orWhere({ '_personal': '' })
            })
          }
        })
        .then(allFiles => {

          File.query().whereIn('_id', folderIds)
          .then(files => {
            if (files && files.length) {
              files.forEach(file => {
                utilGetAllConnectedFiles(allFiles, [file], [], associatedResults => {
                  file.totalChildFolder = (associatedResults && associatedResults.length - 1) || 0;
                });
              });
              res.send({ success: true, files });
            } else {
              res.send({ success: true })
            }
          });


          const utilGetAllConnectedFiles = (fileList, list, arrFolderId, callback) => {
            let newArrFolderId = [];
            list.forEach(item => {
              if (item.category === 'folder' && arrFolderId.indexOf(item._id) === -1) {
                arrFolderId.push(item._id);
                newArrFolderId.push(Number(item._id));
              }
            });

            const newList = fileList.filter(item => newArrFolderId.indexOf(Number(item._folder)) > -1);
            if (newList && newList.length) {
              utilGetAllConnectedFiles(fileList, newList, arrFolderId, loopResponse => {
                callback(arrFolderId);
              });
            } else {
              callback(arrFolderId);
            }
          }
        });
      }
    });
  }
}

exports.getFilePermission = (req, res) => {
  const firmId = req.body.firmId;
  const clientId = req.body.clientId;
  const allFileIds = req.body.allFileIds;
  if (!allFileIds || !(allFileIds && allFileIds.length)) {
    res.send({ success: false, message: 'File Id not found' });
  } else if (!firmId) {
    res.send({ success: false, message: 'Firm Id not found' });
  } else {
    permissions.utilCheckPermission(req.user, firmId, clientId, permission => {
      if (!permission) {
        res.send({success: false, message: "You do not have permisson to access this files."});
      } else {
        File.query()
        .from('files as f')
        .leftJoin('folderpermission as fp', 'fp._folder', 'f._id')
        .whereIn('f._id', allFileIds)
        .select(['f.*', raw('row_to_json(fp) as permission')])
        .groupBy([ 'f._id', ' fp._id' ])
        .then(files => {
          res.send({ success: true, files });
        });
      }
    });
  }
}