/**
 * Sever-side controllers for DocumentTemplate.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the DocumentTemplate
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

 const config = require('../../config')[process.env.NODE_ENV];

 let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
 
 const secrets = config.secrets;
 // set up Google environment variables
 process.env['GOOGLE_APPLICATION_CREDENTIALS'] = config.gcloud.keyPath;
 process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
 const bucketName = config.gcloud.bucketName;

const permissions = require('../../global/utils/permissions')

// import libraries
let multiparty = require('multiparty')
let logger = global.logger;
const async = require('async');
const { Storage } = require('@google-cloud/storage');
const DateTime = require('luxon').DateTime;
const moment = require('moment');
const storage = new Storage();
const contentDisposition = require('content-disposition');
const { raw } = require('objection');

// import global
const fileUtils = require('../../global/utils/fileUtils');
const displayUtils = require('../../global/utils/displayUtils');

// import model
const DocumentTemplate = require('./DocumentTemplateModel');
const Firm = require('../firm/FirmModel');
const File = require('../file/FileModel');

// import controller
const clientUsersCtrl = require('../clientUser/clientUsersController');
const activitiesCtrl = require('../activity/activitiesController');
const mergeFieldsCtrl = require('../mergeField/mergeFieldsController');
const fileCtrl = require('../file/filesController');
const mangoBillingCtrl = require('../integration/integrationController');

let progress = require('progress-stream');
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const fs = require("fs");
const path = require("path");
const libre = require('libreoffice-convert');
const Client = require('../client/ClientModel');
const HTMLtoDOCX = require('html-to-docx');

exports.list = (req, res) => {
  DocumentTemplate.query()
  .then(documentTemplates => {
    res.send({success: true, documentTemplates})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of documentTemplates queried from the array of _id's passed in the query param
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
    // DocumentTemplate.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, documentTemplates) => {
    //     if(err || !documentTemplates) {
    //       res.send({success: false, message: `Error querying for documentTemplates by ${["_" + req.params.refKey]} list`, err});
    //     } else if(documentTemplates.length == 0) {
    //       DocumentTemplate.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, documentTemplates) => {
    //         if(err || !documentTemplates) {
    //           res.send({success: false, message: `Error querying for documentTemplates by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, documentTemplates});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, documentTemplates});
    //     }
    // })
    DocumentTemplate.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, documentTemplates) => {
        if(err || !documentTemplates) {
          res.send({success: false, message: `Error querying for documentTemplates by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, documentTemplates});
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
    DocumentTemplate.query()
    .where(query)
    .then(documentTemplates => {
      res.send({success: true, documentTemplates });
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
    DocumentTemplate.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, documentTemplates) => {
      if(err || !documentTemplates) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , documentTemplates: documentTemplates
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    DocumentTemplate.find(mongoQuery).exec((err, documentTemplates) => {
      if(err || !documentTemplates) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, documentTemplates: documentTemplates });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get documentTemplate by id');
  DocumentTemplate.query().findById(req.params.id)
  .then(documentTemplate => {
    if(documentTemplate) {
      res.send({success: true, documentTemplate})
    } else {
      res.send({success: false, message: "DocumentTemplate not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get documentTemplate schema ');
  res.send({success: true, schema: DocumentTemplate.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get documentTemplate default object');
  res.send({success: true, defaultObj: DocumentTemplate.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new documentTemplate');

  exports.convertHTMLtoDocx(req.body.content, fileBuffer => {
    let newFile = {
      _firm: req.body.firmId
      , contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      , fileExtension: ".docx"
      , _createdBy: req.user && req.user._id
      , filename: req.body.name + ".docx"
    };
  
    DocumentTemplate.query().insert(newFile)
    .returning("*").asCallback((err, newFile) => {
      if(err || !newFile) {
        console.log("error saving initial template object");
        console.log(err);
        res.send({success: false, err: err, message: "Error saving initial template object"});
      } else {
        // create bucket and object
        console.log('creating new template from template object');
        //s3 filename !== template filename. just save the mongo._id as filename on backend to prevent collisions.
        const fileNameWithFolders = fileUtils.buildTemplateNameWithFolders(newFile);
      
        // define the destination for the template.
        const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);
        fileDestination.save(fileBuffer).then(() => {
          exports.saveMergeField(newFile, fileBuffer, "buffer", response => {
            res.send(response);
          });
          // Success handling...
        }).catch(error => {
          // Error handling...
        });
      }
    });
  });
}

exports.update = (req, res) => {
  logger.info('updating documentTemplate');

  const documentTemplateId = parseInt(req.params.id) // has to be an int
  
  permissions.utilCheckisStaffOwner(req.user, req.body && req.body._firm, response => {
    if (!response) {
      res.send({success: false, message: "You do not have permission to access this Action"});
    } else {
      // using knex/objection models
      req.body.tags = JSON.stringify(req.body.tags);
      req.body.updated_at = new Date(); 
      DocumentTemplate.query()
      .findById(documentTemplateId)
      .update(req.body) //valiation? errors?? 
      .returning('*') // doesn't do this automatically on an update
      .then(documentTemplate => {
        res.send({success: true, documentTemplate});
      });
    }
  });
}

exports.delete = (req, res) => {
  logger.warn("deleting documentTemplate");
  
  // TODO: needs testing and updating
  const documentTemplateId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM documentTemplates WHERE id = ' + documentTemplateId + ';'

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

exports.upload = (req, res) => {

  // capture IP address of the uploader so we can save it on the template object
  /**
   * examples:
   * ::1 - localhost
   * ::ffff:99.203.20.149 - from phone
   * ::ffff:98.101.181.226 - in office
   */
  let uploadIp = "";
  let fileObjectKeys = {}
  if(req.ip && typeof(req.ip) == 'string' ) {
    uploadIp = req.ip;
  }
  fileObjectKeys.uploadIp = uploadIp;

  
  let form = new multiparty.Form(); //for parsing multipart data into things we can use
  // TODO: we need robust restrictions in place for this method

  //SOURCE: https://github.com/expressjs/node-multiparty
  form.on('error', err => {
    console.log('Error parsing form: ' + err.stack);
    // res.send({success: false, message: "Error parsing request template"});
  })
  form.on('field', (name, value) => {
    console.log("field", name, value);
    if (name === "_firm") {
      // sometimes, post _client value is a undefined it is causing an error because is not allowed to insert undefined in integer datatype
      // valid insert 0 or null
      fileObjectKeys[name] = value ? value : null;
    } else {
      fileObjectKeys[name] = value ? value : "";
    }
  });
  // form.on('progress', (bytesReceived, bytesExpected) => {
  //   // maybe useful for debugging the large files timing out.
  //   console.log(`bytesReceived: ${bytesReceived}, bytesExpected: ${bytesExpected}` )
  // })
  form.parse(req, (err, fields, files) => {
    console.log("RETURN FORM PARSE");
    console.log(err);
    console.log(fields);
    console.log(files);
    if(err) {
      logger.error('ERROR: ')
      logger.info(err)
      res.send({success: false, message: err})
    } else if(!files || !files[0]) {
      logger.error("NO FILE");
      res.send({success: false, message: "No template present in request"});
    } else {

      // declare variable
      let template = files[0];
      let newFile = {...fileObjectKeys}; //for setting fields
      let contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; // template[0].headers['content-type'];
      let fileExtension = template[0].originalFilename.substring(template[0].originalFilename.lastIndexOf('.'), template[0].originalFilename.length);
      let filePath = template[0].path;
      let socketId; // Depending on where this call is coming from, we either want to send updates to req.user._id or to the sharelink hex.
      if(req.user) {
        socketId = req.user._id
      } else if(req.params.hex) {
        socketId = req.params.hex // A user that is not logged in is uploading these files via sharelink.
      }

      // const path = require('path');
      // const idx = template[0].path.split(path.sep).join('/');

      // convert file
      fileCtrl.utilConvertActualFile(fileExtension, ".docx", filePath, response => {

        newFile.filename = template[0].originalFilename;
        newFile.fileExtension = fileExtension;
        newFile.contentType = contentType;
        newFile._createdBy = req.user ? req.user._id : null;
  
        if (response.success) {
          filePath = './static/output.docx'; // response.filePath;
          newFile.fileExtension = ".docx"; // response.fileExtension;
        }

        // insert template records
        DocumentTemplate.query().insert(newFile)
        .returning("*").asCallback((err, newFile) => {

          if(err || !newFile) {
            console.log("error saving initial template object");
            console.log(err);
            callback({success: false, err: err, message: "Error saving initial template object"});
          } else {

            //create bucket and object
            console.log('creating new template from template object');
            //s3 filename !== template filename. just save the mongo._id as filename on backend to prevent collisions.
            const fileNameWithFolders = fileUtils.buildTemplateNameWithFolders(newFile);
          
            // define the destination for the template.
            const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);
            // get template stats.
            const stats = fs.statSync(filePath);
            // setup streamProgress so we can get progressPercent.
            const streamProgress = progress({
              length: stats.size,
              time: 200 // The interval at which events are emitted in milliseconds.
            });
            streamProgress.on('progress', progress => {
              console.log("PROGRESS!", progress);
              // Send the progress of the current template with its index so we can display it on the front end.
              if(socketId) {
                req.io.to(socketId).emit('upload_progress', Math.floor(progress.percentage), 50);
              }
            })

            fs.createReadStream(filePath)
            .pipe(streamProgress) // pipe to the method above so we can keep track of upload progress via the socket connection.
            .pipe(fileDestination.createWriteStream({ gzip: true }))
            .on('error', err => {
              callback({success: false, err: err, message: err || "Error saving template in cloud"});
            })
            .on('finish', () => {
              logger.info("Finished uploading template", newFile)

              exports.saveMergeField(newFile, filePath, "path", response => {
                res.send(response);
              });
              // The template upload is complete.
            });
          }
        })
      });
    }
  })
}

exports.downloadTemplate = (req, res) => {
  console.log("downloading template object from google cloud storage");
  // TODO: requiring 'firmId' or other to try to inject some additional security into this
  // ^ this is now required, and clientId is optional. need to catch and apply permissions.

  // NOTE: since this works, we now have the ability to NOT change uploaded template names if they want.
  // Since the filename on gcloud is just the templateId plus the template extension, we can change the name
  // all we want and gcloud doesn't have to know anything about it.
  
  const { firmId, templateId } = req.params;
  let fileQuery = {
    _firm: parseInt(firmId)
    , _id: parseInt(templateId)
    //, filename: filename
  }

  DocumentTemplate.query().findOne(fileQuery)
  .then(template => {
    console.log('dubgging', req.query);
    if (template && template.fileExtension && template.fileExtension.indexOf('doc') > -1 && req.query && req.query.viewingas === "PDFFormat") {
      fileCtrl.utilConvertDocxToPDF('template', template._id, response => {
        if (response && response.success) {
          res.header(`Content-Disposition`, contentDisposition(response.file.filename));
          res.send(response.file.fileBuffer);
        } else {
          res.status(404);
          res.send("File not found.")
        }
      });
    } else {
      exports.utilDownloadTemplate(req, template, res);
    }
  });
}

exports.utilDownloadTemplate = (req, template, res) => {
  if(!template) {
    res.status(404);
    res.send("Template not found.")
  } else if(template.status == "deleted") {

    // catch for "deleted" files and send the deleted template icon instead
    // console.log("template deleted, return SVG")
    // let filePath = require('path').join(__dirname, '../../static/img/deleted.svg');
    // console.log("PATH", filePath)
    // res.writeHead(200);
    // fs.createReadStream(filePath).pipe(res);

    res.status(404);
    res.send("Template not found.")

  } else {

    // set headers to allow certain browsers (ie, IE) to download files. doesn't appear to affect images and things used by the app itself or template previews.
    res.header(`Content-Disposition`, contentDisposition(template.filename))
    //res.header(`Content-Type`, template.contentType);

    // generate qualified name with folders
    const fileNameWithFolders = fileUtils.buildTemplateNameWithFolders(template)

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
      console.log("template downloaded");
    })
    .pipe(res);
  }
}

exports.utilDownloadTemplateWordAsPDF = (req, template, res) => {
  exports.utilGetBase64String(template._id, response => {
    if (response && response.success) {
      const template = response.template;

      if (template && template.fileExtension && template.fileExtension.indexOf('pdf') > -1) {
        callback(response);
      } else {

        // init docx engine
        docx.init({
        ND_DEV_ID: "4H2I80DDEVNAJQSGGIC3K98N8S",
        ND_DEV_SECRET: "3CTNJA7DBQFA8UDV2GM8I60N38",
            // ND_DEV_ID: "XXXXXXXXXXXXXXXXXXXXXXXXXX",    // goto https://developers.nativedocuments.com/ to get a dev-id/dev-secret
            // ND_DEV_SECRET: "YYYYYYYYYYYYYYYYYYYYYYYYYY", // you can also set the credentials in the enviroment variables
            ENVIRONMENT: "NODE", // required
            LAZY_INIT: true      // if set to false the WASM engine will be initialized right now, usefull pre-caching (like e.g. for AWS lambda)
        }).catch( function(e) {
            console.error(e);
        });

        const filename = template.filename.substr(0, template.filename.indexOf('.')) + '.pdf';
        const fileBuffer = Buffer.from(template.data, 'base64');

        async function convertHelper(document, exportFct) {
          const api = await docx.engine();
          await api.load(document);
          const arrayBuffer = await api[exportFct]();
          await api.close();
          return arrayBuffer;
        }
        
        convertHelper(fileBuffer, "exportPDF").then((arrayBuffer) => {
          
          // download
          res.header(`Content-Disposition`, contentDisposition(filename));
          fs.writeFileSync(filename, new Uint8Array(arrayBuffer)); // create temporary template from server folder
          const data = fs.readFileSync(filename); // get created temporary template from server folder
          res.send(data);
          fs.unlinkSync(filename); // delete temporary template from server folder
        }).catch((e) => {
          res.send({ success: false })
        });
      }
    } else {
      res.send({ success: false })
    }
  });
}

exports.utilGetBase64String = (templateId, callback) => {
  DocumentTemplate.query()
  .findById(templateId)
  .asCallback((err, template) => {
    if(err || !template) {
      // No success
      return callback({ success: false, message: err || "Error retrieving template."})
    } else {
      // success, generate qualified name with folders
      const fileNameWithFolders = fileUtils.buildTemplateNameWithFolders(template);
      console.log('fileNameWithFolders', fileNameWithFolders)
      // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
      const selectedTemplate = storage.bucket(bucketName).file(fileNameWithFolders)
      selectedTemplate.download()
      .then((data) => {
        if(!data || !data[0]) {
          return callback({ success: false, message: "Error retrieving template."})
        } else {
          const contents = data[0]
          let base64string = contents.toString('base64')
          const fileObj = {
            data: base64string
            , fileExtension: template.fileExtension
            , filename: template.filename
          }
          return callback({ success: true, template: fileObj })
        }
      }).catch(error => {
        //logger.error(error);
        callback({ success: false, message: "File could not be retrieved." });
      });
    }
  });
}

exports.applyDocumentTemplate = (req, res) => {

  const {
    templateId
    , firmId
    , selectedClientIds
    , filename
    , DOCXFormat
    , PDFFormat
    , status
    , globalTags
    , clientTags
  } = req.body;

  Firm.query().findById(firmId)
  .then(firm => {
    if (!firm) {
      res.send({success: false, message: "Firm not found"});
    } else {
      permissions.utilCheckFirmPermission(req.user, firmId, 'access', permission => {
        if(!permission) {
          res.send({success: false, message: "You do not have permission to access this Firm"})
        } else {
          DocumentTemplate.query()
          .findById(templateId)
          .asCallback((err, template) => {
            if(err || !template) {
              // No successR
              res.send({ success: false, message: err || "Error retrieving template."})
            } else {
              // success, generate qualified name with folders
              const fileNameWithFolders = fileUtils.buildTemplateNameWithFolders(template);
              // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
              const selectedTemplate = storage.bucket(bucketName).file(fileNameWithFolders)
              selectedTemplate.download()
              .then((data) => {
                if(!data || !data[0]) {
                  res.send({ success: false, message: "Error retrieving template."})
                } else {
                  const objFiles = {};
                  const socketId = req && req.user && req.user._id;
                  const totalProgressLength = selectedClientIds.length * 3;
                  let totalProgressAttempt = 1;
                  let progress = 0;
                  async.mapSeries(selectedClientIds, (clientId, callback) => {
    
                    Client.query().findById(clientId)
                    .then(client => {
                      if (!client) {
                        callback(null)
                      } else {
                        // socket progress 1
                        progress = (100 / totalProgressLength) *  totalProgressAttempt;
                        req.io.to(socketId).emit('upload_status', Math.floor(progress));
                        totalProgressAttempt++;
    
                        // Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
                        const tags = { ...globalTags, ...clientTags[clientId] };
    
                        // render replacing docx
                        const contents = Buffer.from(data[0], 'binary');
                        const zip = new PizZip(contents);
                        const doc = new Docxtemplater(zip, {
                          paragraphLoop: true,
                          linebreaks: true,
                          delimiters: {
                            start: "{{"
                            , end: "}}"
                          },
                          nullGetter(part) {
                            return part.module ? "" : `{{${part.value}}}`;
                          },
                        });
                        doc.render(tags);
    
                        const DOCXBuffer = doc.getZip().generate({
                            type: "nodebuffer",
                            // compression: DEFLATE adds a compression step.
                            // For a 50MB output document, expect 500ms additional CPU time
                            compression: "DEFLATE",
                        });
    
                        exports.generatePDFFormat(
                          PDFFormat
                          , DOCXBuffer
                          , filename
                          , response => {
    
                            // socket progress 2
                            progress = (100 / totalProgressLength) *  totalProgressAttempt;
                            req.io.to(socketId).emit('upload_status', Math.floor(progress));
                            totalProgressAttempt++;
    
                            const fileList = [];
                            if (response.success) {
                              fileList.push({ fileExtension: ".pdf", buffer: response.PDFBuffer, filename: response.filename });
                            }
                            if (DOCXFormat) {
                              // fs.writeFileSync(path.resolve('', DOCXFilePath), buffer);
                              fileList.push({ fileExtension: template.fileExtension, buffer: DOCXBuffer, filename: new Date().getTime() + '_' + filename + template.fileExtension });
                            }
                            exports.createFileByPath(
                              req
                              , contents
                              , template
                              , firm
                              , client
                              , filename
                              // , DOCXFormat
                              // , PDFFormat
                              , fileList
                              , status
                              , result => {

                                // socket progress 3
                                progress = (100 / totalProgressLength) *  totalProgressAttempt;
                                req.io.to(socketId).emit('upload_status', Math.floor(progress));
                                totalProgressAttempt++;
                                
                                req.body.nocallback = true;
                                req.body.files = result.files;
                                objFiles[clientId] = result.files;
                                activitiesCtrl.createOnStaffFileUpload(req, res);
                                callback(null, result.files);
                            });
                        }); 
                      }
                    });
                  }, (err, result) => {
                    if (err) {
                      res.send({ success: false, message: "ERROR: in createReadStream" });
                    } else if (Object.keys(objFiles).length === selectedClientIds.length) {
                      res.send({ success: true, objFiles })
                    }
                  });
                  // buf is a nodejs Buffer, you can either write it to a
                  // file or res.send it with express for example.
                  // 
                }
              }).catch(error => {
                res.send({ success: false, message: error || "ERROR: in createReadStream" });
              });
            }
          });
        }
      });
    }
  });
}

exports.generatePDFFormat = (
  PDFFormat
  , DOCXBuffer
  , filename
  , callback) => {
  
    if (PDFFormat) {
      libre.convert(DOCXBuffer, ".pdf", undefined, (err, buffer) => {
        if (err) {
          callback({ success: false });
        } else {
          callback({ success: true, PDFBuffer: buffer, filename: new Date().getTime() + '_' + filename + '.pdf' });
        }
      });
    } else {
      callback({ success: false });
    }
}

exports.createFileByPath = (
  req
  , contents
  , template
  , firm
  , client
  , filename
  // , DOCXFormat
  // , PDFFormat
  , fileList
  , status
  , callback) => {
  
  try {

    const files = [];
    async.map(fileList, (item, cb) => {
      const contentType = item.fileExtension === ".pdf" ? "application/pdf" : template.contentType;
      const category = item.fileExtension === ".pdf" ? "document" : template.category;

      fs.writeFile(item.filename, item.buffer, (err) => {
        if (err) {
          cb({ message: "ERROR: in createReadStream" });
        } else {
          const stats = fs.statSync(item.filename);
          let newFilename = filename + item.fileExtension;

          const file = {
            _firm: firm._id
            , _client: client._id
            , filename: newFilename
            , fileExtension: item.fileExtension
            , contentType: contentType
            , category: category
            , _user: req.user ? req.user._id : null
            , rawUrl: `https://www.googleapis.com/storage/v1/b/${bucketName}/o/undefined${template.fileExtension}`
            , fileSize: stats.size
            , status: status || 'visible'
          }

          File.query()
          .insert(file)
          .returning("*")
          .then(newFile => {
            if (!newFile) {
              callback({success: false, message: "Error saving initial file object"});
            } else {
              const fileNameWithFolders = fileUtils.buildFileNameWithFolders(newFile);
              const fileDestination = storage.bucket(bucketName).file(fileNameWithFolders);
              // get file stats.
              // setup streamProgress so we can get progressPercent.
              const streamProgress = progress({
                length: stats.size,
                time: 200 // The interval at which events are emitted in milliseconds.
              });
              streamProgress.on('progress', progress => {
                console.log("PROGRESS!", progress);
                // Send the progress of the current file with its index so we can display it on the front end.
                // if(socketId) {
                //   req.io.to(socketId).emit('upload_progress', Math.floor(progress.percentage), index);
                // }
              });

              fs.createReadStream(item.filename)
              .pipe(streamProgress) // pipe to the method above so we can keep track of upload progress via the socket connection.
              .pipe(fileDestination.createWriteStream({ gzip: true }))
              .on('error', err => {
                logger.error("ERROR: in createReadStream ")
                logger.info(err)
                // req.io.to(socketId).emit('upload_progress_error', err, index)
                // NOTE: We could use the socket and index here to notify the front end that a specific file has an error.
                // We also may want to use async.reflect so we can continue with other files in the event of an error.

                fs.unlinkSync(item.filename);
                cb({ message: "ERROR: in createReadStream" });
                // callback({success: false, message: err})
              })
              .on('finish', () => {
                logger.info("Finished uploading file", newFile)
                files.push(newFile);
                fs.unlinkSync(item.filename);
                cb();
                // cb({ success: true, file: newFile });
                // The file upload is complete.
              });
            }
          })
        }
      });
    }, (err) => {
      if (err && err.message) {
        callback({ success: false, message: "ERROR: in createReadStream" });
      } else {
        callback({ success: true, files });
        files.forEach(file => {
          mangoBillingCtrl.createFileMangoByFile(firm, client, file, response => console.log(response))
        });
      }
    });

  } catch (error) {
    
  }
}


exports.testing = (req, res) => {
  const templateId = req.params.id;
  console.log('templateId', templateId)
  DocumentTemplate.query()
  .findById(templateId)
  .asCallback((err, template) => {
    if(err || !template) {
      // No successR
      res.send({ success: false, message: err || "Error retrieving template."})
    } else {
      // success, generate qualified name with folders
      const fileNameWithFolders = fileUtils.buildTemplateNameWithFolders(template);
      console.log('fileNameWithFolders', fileNameWithFolders)
      // https://cloud.google.com/nodejs/docs/reference/storage/2.5.x/File#createReadStream
      const selectedTemplate = storage.bucket(bucketName).file(fileNameWithFolders)
      selectedTemplate.download()
      .then((data) => {
        if(!data || !data[0]) {
          res.send({ success: false, message: "Error retrieving template."})
        } else {

          // const filename = 'test.docx';
          // const contents = Buffer.from(data[0], 'binary');;
          // Load the docx file as binary content
          const contents = fs.readFileSync(
            path.resolve('', "test.docx"),
            "binary"
          );

          const zip = new PizZip(contents);
          const doc = new Docxtemplater(zip, {
              paragraphLoop: true,
              linebreaks: true,
              delimiters: {
                start: "{{"
                , end: "}}"
              },
              nullGetter(part) {
                return part.module ? "" : `{{${part.value}}}`;
              },
          });

          // Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
          doc.render({
            first_name: "Rico",
            last_name: "Villais",
            phone: "09270899656",
            description: "This is example"
          });

          const buf = doc.getZip().generate({
              type: "nodebuffer",
              // compression: DEFLATE adds a compression step.
              // For a 50MB output document, expect 500ms additional CPU time
              compression: "DEFLATE",
          });

          // buf is a nodejs Buffer, you can either write it to a
          // file or res.send it with express for example.
          fs.writeFileSync(path.resolve('', "output.docx"), buf);
        }
      }).catch(error => {
        //logger.error(error);
        console.log(error)
        res.send({ success: false, message: "File could not be retrieved." });
      });
    }
  });
}

exports.pdfUpload = (req, res) => {
  res.send({ success: true })
}

exports.saveMergeField = (template, file, type, callback) => {
  mergeFieldsCtrl.mergeFieldDefaultListByObject(template._firm, response => {

    // save tags from template 
    // Load the docx file as binary content
    let contents = file; 
    
    if (type === "path") {
      contents = fs.readFileSync( path.resolve('', file), "binary");  
    }

    const tags = {};
    const zip = new PizZip(contents);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "{{"
        , end: "}}"
      },
      nullGetter(part) {
        console.log('debugging part', part.value)
        const objKey = part && part.value;

        if (response[objKey] && !tags[objKey]) {
          tags[objKey] = {
            name: objKey
            , tag: response[objKey].tag
            , sortLoc: response[objKey].sortLoc
            , value: ""
          }
        } else if (objKey.indexOf('Contact#') > -1) {
          const newKey = objKey.substr(0, objKey.indexOf('#')) + "#" + objKey.substring(objKey.indexOf('.'));
          if (response[newKey] && !tags[objKey]) {
            let count = objKey.replace(/\D/g, '');
            tags[objKey] = {
              name: objKey
              , tag: response[newKey].tag
              , sortLoc: count + response[newKey].sortLoc
              , value: ""
              , number: count
            }
          }
        }
        return part.module ? "" : `{{${objKey}}}`;
      },
    });

    // Render the document (Replace {first_name} by John, {last_name} by Doe, ...)
    doc.render({});

    template.tags = JSON.stringify(tags);
    DocumentTemplate.query().findById(template._id).update({ tags: JSON.stringify(tags) }).returning("*").then(template => {
      callback({ success: true, documentTemplate: template })
    });
  });
}

exports.convertHTMLtoDocx = async (content, callback) => {
  const htmlString = 
    `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Document Generation</title>
        </head>
        <body>
            ${content}
        </body>
    </html>`;

  const fileBuffer = await HTMLtoDOCX(htmlString, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  callback(fileBuffer);
}