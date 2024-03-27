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

//
const permissions = require('../../global/utils/permissions.js');
const appUrl = require('../../config')[process.env.NODE_ENV].appUrl;
const async = require('async');

// model
const FolderTemplate = require('./FolderTemplateModel');
const File = require('../file/FileModel');
const Firm = require('../firm/FirmModel');

const mangobilling = require('../../global/constants').mangobilling;
const { FOLDER_PERMISSION_FIELDS } = require('../../global/constants');

// controller
const filesController = require('../file/filesController');

// data access object
const folderPermissionDAO = require('../folderPermission/folderPermissionDAO');

const axios = require('axios');
const Client = require('../client/ClientModel.js');

let logger = global.logger;

let YellowParentID;
let ParentID;

let RootFolder;

exports.list = (req, res) => {
  FolderTemplate.query()
  .then(folderTemplates => {
    res.send({ success: true, folderTemplate: folderTemplates })
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
    FolderTemplate.query()
    .where(query)
    .then(folderTemplates => {
      if (folderTemplates) {
        res.send({success: true, folderTemplates });
      } else {
        res.send({success: true, folderTemplates: [] })
      }
    })
  }
}

exports.getById = (req, res) => {
  logger.info('get FolderTemplate by id');
  FolderTemplate.query().findById(req.params.id)
  .then(folderTemplate => {
    if(folderTemplate) {
      res.send({success: true, folderTemplate})
    } else {
      res.send({success: false, message: "Folder template not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get request schema ');
  res.send({success: true, schema: FolderTemplate.jsonSchema});
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
  res.send({success: true, defaultObj: FolderTemplate.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {

  const { _firm, subfolder } = req.body;

  permissions.utilCheckFirmPermission(req.user, _firm, 'admin', permission => {
    console.log("permission", permission);
    if(!permission) {
      res.send({success: false, message: "You do not have permission to access this Firm"})
    } else {
      
      req.body._createdBy = req.user._id;
      req.body.subfolder = JSON.stringify(subfolder);
      FolderTemplate.query()
        .insert(req.body)
        .returning("*")
        .asCallback((err, folderTemplate) => {
          console.log("err", err);
          console.log("folderTemplate", folderTemplate);
          if (err && !folderTemplate) {
            res.send({ success: false, message: "Failed to add new folder template." });
          } else {
            res.send({ success: true, folderTemplate });
          }
        });
    }
  });
}

exports.applyFolderTemplate = (req, res) => {
  const { templateIds, _firm, _client, associated, _folder, _personal, mangoCompanyID, mangoClientID } = req.body;

  // templateIds is declared as array for future process
  const templateId = templateIds[0];
  permissions.utilCheckFirmPermission(req.user, _firm, 'admin', permission => {
    console.log("permission", permission, templateId);
    if(!permission && !templateId) {
      res.send({success: false, message: "You do not have permission to access this Firm"});
    } else {
      FolderTemplate.query().findById(templateId)
        .then(folderTemplate => {
          if (folderTemplate) {
            const newFolder = {
              category: "folder"
              , contentType: associated ? `template_folder_${folderTemplate._id}` : null
              , status: "visible"
              , wasAccessed: false
              , _client
              , _firm
              , _folder
              , _personal
              , _user: req.user._id
              , filename: folderTemplate.name
              , mangoCompanyID: mangoCompanyID ? mangoCompanyID : null
              , mangoClientID: mangoClientID ? mangoClientID : null
            }

            File.query().insert(newFolder).returning("*")
              .asCallback(async (err, folder) => {
                logger.error("er", err);
                if (err && !folder) {
                  res.send({ success: false, message: "Failed to create" });
                } else {
                  req.io.to(req.user._id).emit('folder_template_progress', folder);
                  const subfolder = folderTemplate.subfolder;

                  //setup the permission fields;
                  let folderPermissionDefault = {}

                  folderPermissionDefault['_firm'] = _firm;
                  folderPermissionDefault['_client'] = _client;
                  folderPermissionDefault['_folder'] = folder._id;

                  FOLDER_PERMISSION_FIELDS.map(key => {
                    folderPermissionDefault[key] = !!folderTemplate[key];
                  })

                  //set permission for the top folder
                  // await folderPermissionDAO.handleCreatePermission(folderPermissionDefault)
                  //   .then(permission => {
                  //     console.log('root folder permission')
                  //   })
                  
                  if(_firm && _client) {
                    Firm.query()
                      .findById(_firm)
                      .then(async (firm) => {
                        if(firm.mangoCompanyID && firm.mangoApiKey && _client && mangoClientID) {

                          let ParentFolder = null;

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

                          const MANGO_CREATE_FOLDER  = mangobilling.MANGO_CREATE_FOLDER;

                          const requestBody = {
                            "CompanyID": firm.mangoCompanyID,
                            "IShareCompanyID": firm._id,
                            "IShareDMSParentID": folder._id,
                            "IShareClientID": folder._client,
                            "ClientID": folder.mangoClientID,
                            "FName": folder.filename,
                            "ParentID": ParentFolder && ParentFolder.DMSParentID ? ParentFolder.DMSParentID : null,
                            "YellowParentID": RootFolder && RootFolder.DMSParentID ? RootFolder.DMSParentID : null,
                            "ShowInPortal": true
                          }

                          exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                            res.send({ success: true });
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

                          //     YellowParentID = mangoFolder.dmsParentID;
                          //     ParentID = mangoFolder.dmsParentID;

                          //     console.log('time to update');

                          //     File.query()
                          //       .findById(folder._id)
                          //       .update({
                          //         DMSParentID: mangoFolder.dmsParentID,
                          //         ParentID: mangoFolder.ParentID,
                          //         YellowParentID: mangoFolder.YellowParentID
                          //       })
                          //       .returning('*')
                          //       .then((files) => {
                                  
                          //         exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                          //           res.send({ success: true, file: files});
                          //         });
                          //       })
                          //   } else {
                          //     exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                          //       res.send({ success: true});
                          //     });
                          //   }
                          // })
                          // .catch((err) => {
                          //   console.log('err', err);

                          //   exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                          //     res.send({ success: true });;
                          //   });
                          // })

                        } else {
                          exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                            res.send({ success: true });
                          });
                        }
                      })
                  } else {
                    exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                      res.send({ success: true });
                    });
                  }
                }
              });
          } else {
            res.send({ success: false, message: "Folder template not found" });
          }
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
  } else {
    RootFolder = null;
  }
}

exports.createSubfolder = (req, subfolder, newFolder, folderId, folderTemplateId, callback) => {
  const { associated, _firm, _client, mangoClientID } = req.body;
  const filteredFolder = subfolder.filter(item => item._folder == folderTemplateId && item.status !== "initial_deleted");
  console.log("filteredFolder", filteredFolder);
  async.map(filteredFolder, (folder, cb) => {
    newFolder.filename = folder.name;
    newFolder._folder = folderId;
    newFolder.contentType = associated ? `template_subfolder_${folder._id}` : null;
    newFolder.status = folder.status === "deleted" ? "archived" : "visible";

    File.query().insert(newFolder).returning("*")
      .asCallback(async (err, result) => {
        logger.error("newFolder", err);
        if (err && !result) {
          cb();
        } else {

          if (result && result.status === "visible") {
            req.io.to(req.user._id).emit('folder_template_progress', result);
          }

          //setup the permission fields;
          let folderPermissionDefault = {}

          folderPermissionDefault['_firm'] = _firm;
          folderPermissionDefault['_client'] = _client;
          folderPermissionDefault['_folder'] = result._id;

          FOLDER_PERMISSION_FIELDS.map(key => {
            folderPermissionDefault[key] = !!folder[key];
          })

          //set permission for the top folder
          //await folderPermissionDAO.handleCreatePermission(folderPermissionDefault);

          if(_firm && newFolder._client) {
            Firm.query()
              .findById(_firm)
              .then((firm) => {
                if(firm.mangoCompanyID && firm.mangoApiKey && newFolder._client && newFolder._client) {
                  const MANGO_CREATE_FOLDER  = mangobilling.MANGO_CREATE_FOLDER;

                  const requestBody = {
                    "CompanyID": firm.mangoCompanyID,
                    "IShareCompanyID": firm._id,
                    "IShareDMSParentID": result._id,
                    "IShareClientID": result._client,
                    "ClientID": result.mangoClientID,
                    "FName": result.filename,
                    "ParentID": ParentID,
                    "YellowParentID": YellowParentID,
                    "ShowInPortal": true
                  }

                  exports.createSubfolder(req, subfolder, newFolder, result._id, folder._id, (err, result) => {
                    cb();
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
                  //       .findById(result._id)
                  //       .update({
                  //         DMSParentID: mangoFolder.dmsParentID,
                  //         ParentID: mangoFolder.ParentID,
                  //         YellowParentID: mangoFolder.YellowParentID
                  //       })
                  //       .returning('*')
                  //       .then((files) => {
                  //         exports.createSubfolder(req, subfolder, newFolder, result._id, folder._id, (err, result) => {
                  //           cb();
                  //         });
                  //       })

                  //   } else {
                  //     exports.createSubfolder(req, subfolder, newFolder, result._id, folder._id, (err, result) => {
                  //       cb();
                  //     });
                  //   }
                  // })
                  // .catch((err) => {
                  //   exports.createSubfolder(req, subfolder, newFolder, result._id, folder._id, (err, result) => {
                  //     cb();
                  //   });
                  // })

                } else {
                  exports.createSubfolder(req, subfolder, newFolder, result._id, folder._id, (err, result) => {
                    cb();
                  });
                }
              })
          } else {
            exports.createSubfolder(req, subfolder, newFolder, result._id, folder._id, (err, result) => {
              cb();
            });
          }
        }
      });
  }, (err, result) => {
    callback();
  });
}

exports.update = (req, res) => {
  const { _firm, name, subfolder } = req.body;
  permissions.utilCheckFirmPermission(req.user, _firm, 'access', permission => {
    console.log('permission', permission);
    if (!permission) {
      res.send({success: false, message: "You do not have permission to access this Firm"});
    } else if (!req.params.id) {
      res.send({success: false, message: "Folder template not found"});
    } else {
      FolderTemplate.query().findById(req.params.id)
        .then(async folderTemplate => {
          if (!folderTemplate) {
            res.send({success: false, message: "Folder template not found"});
          } else {
            console.log('folderTemplate', folderTemplate);
            console.log('req.user', req.user);
           //if (req.user && req.user._id && folderTemplate && folderTemplate._id && folderTemplate._user && (folderTemplate._user.includes(req.user._id) || folderTemplate._createdBy === req.user._id)) {
              const newFolder = {
                category: "folder"
                , contentType: `template_folder_${folderTemplate._id}`
                , status: "visible"
                , wasAccessed: false
                , _user: req.user._id
              }
  
              if (folderTemplate.name != name) {
                // changed all associated folder with this folder template
                File.query().where({ contentType: `template_folder_${folderTemplate._id}` }).update({ filename: name })
                  .asCallback((err, res) => {
                    console.log("err", err)
                    console.log("template name change", res)
                  });
              }

              //Update the permission of the rool folders;
              // File.query().where({ 
              //   contentType: `template_folder_${folderTemplate._id}`, 
              //   category: 'folder'
              // })
              // .then(files => {
              //   if(!!files) {
              //     const folderIds = files.map(f => f._id);
              //     let payload = {}
              //     FOLDER_PERMISSION_FIELDS.map(key => {
              //       payload[key] = req.body.hasOwnProperty(key) ? req.body[key] : folderTemplate[key];
              //     })
              //     folderPermissionDAO.updateBulkFolderPermissionByFolder(folderIds, payload)
              //       .then(permissions => {
              //         console.log('permissions', permissions);
              //         logger.info('done updating permission for associated folders')
              //       })
              //       .catch(err => {
              //         logger.error('error updating permission for associated folders', err);
              //       })
              //   } 
              // });

              let count = 0;
              async.mapSeries(subfolder, (folder, cb) => {
                count++;
                if (folder && folder._id) {
                  let updateFolder = {};
                  let oldSubFolder = folderTemplate.subfolder.filter(a => a._id == folder._id);
                  oldSubFolder = oldSubFolder && oldSubFolder.length ? oldSubFolder[0] : {};
                  
                  console.log("testing1", folder)
                  console.log("oldSubFolder", oldSubFolder)

                  // File.query()
                  //   .where({
                  //     _firm , 
                  //     contentType: `template_subfolder_${folder._id}`,
                  //     category: 'folder',
                  //     status: 'visible'
                  //   })
                  //   .then(files => {
                  //     if(!!files) {
                  //       const fileIds = files.map(f => f._id);
                  //       let payload = {};
                  //       FOLDER_PERMISSION_FIELDS.map(key => {
                  //         payload[key] = folder[key];
                  //       });
                  //       console.log('sub folder payload', payload);
                  //       console.log('fileIds', fileIds);
                  //       folderPermissionDAO.updateBulkFolderPermissionByFolder(fileIds, payload)
                  //         .then(permissions => {
                  //           console.log('sub folder permissions', permissions);
                  //           logger.info('done updating permission for sub associated folders')
                  //         })
                  //         .catch(err => {
                  //           logger.error('error updating permission for sub associated folders', err);
                  //         })
                  //     }
                  //   })
  
                  if (oldSubFolder && oldSubFolder.name) {
                    const whereQuery = {
                      _firm , contentType: `template_subfolder_${folder._id}`
                    }
  
                    if (folder.status === "visible" && oldSubFolder.status === "visible") {
                      // old folder and latest folder both visible
                      // just update the changes
  
                      // check if old folder change folder name
                      if (folder.name != oldSubFolder.name) {
                        updateFolder.filename = folder.name;
                        // File.query().where(whereQuery).then(files => {
                        //   console.log(files, 'visible to visible', oldSubFolder)
                        //   cb();
                        // });
                        File.query().where(whereQuery).update(updateFolder).returning("*")
                        .asCallback((err, result) => {
                          // do nothing
                          console.log("err", err);
                          console.log("subfolder name change", result);
                          cb();
                        });
                      } else {
                        cb();
                      }
                    } else if (folder.status === "deleted" && oldSubFolder.status === "visible") {
                      // old folder is visible and latest folder is deleted 
                      // deleted all associated folder 
                      //
                      updateFolder.status = "archived" // "recycle-bin";
                      updateFolder.category = "folder";
                      // File.query().where(whereQuery).whereNot({ status: "archived" }).then(files => {
                      //   console.log(files, 'deleted to visible', oldSubFolder)
                      //   cb();
                      // });
                      File.query().where(whereQuery).whereNot({ status: "archived" }).update(updateFolder).returning("*")
                      .asCallback((err, result) => {

                        if (!err && result) {
                          // archived all files and folder within the deleted subfolder
                          console.log("Debug1", result);
                          async.map(result, (file, subCb) => {
                            subCb(null, file._id);
                          }, (err, filesId) => {
                            if (!err && filesId) {
                              console.log("Debug2", filesId);
                              req.body.action = "status";
                              req.body.status = "archived";
                              req.body.filesId = filesId;
                              filesController.bulkUpdateProcess(req, filesId, bulkUpdateResult => {
                                console.log("Debug3", bulkUpdateResult);
                                cb();
                              })
                            } else {
                              cb();
                            }
                          })
                        } else {
                          cb();
                        }
                      });
                    } else if (folder.status === "visible" && oldSubFolder.status === "deleted") {
                      updateFolder.status = "visible";
                      // whereQuery.status = "archived";
                      // File.query().where(whereQuery).whereNot({ status: "archived" }).then(files => {
                      //   console.log(files, 'visible to deleted', oldSubFolder)
                      //   cb();
                      // });
                      File.query().where(whereQuery).update(updateFolder).returning("*")
                      .asCallback((err, result) => {

                        // archived all files and folder within the deleted subfolder
                        async.map(result, (file, subCb) => {
                          subCb(null, file._id);
                        }, (err, filesId) => {
                          if (!err && filesId) {
                            console.log("Debug2", filesId);
                            req.body.action = "status";
                            req.body.status = "visible";
                            req.body.filesId = filesId;
                            filesController.bulkUpdateProcess(req, filesId, bulkUpdateResult => {
                              console.log("Debug3", bulkUpdateResult);
                              cb();
                            })
                          } else {
                            cb();
                          }
                        });
                      });
                    } else {
                      cb();
                    }
                  } else if (folder.status === "visible") {
                    // get folder Id first from files
  
                    const whereQuery = {
                      _firm , contentType: folder._folder ? `template_subfolder_${folder._folder}` : `template_folder_${folderTemplate._id}`
                    }
  
                    File.query().where(whereQuery)
                      .then(parentFolders => {  
                        
                        async.map(parentFolders, (parentFolder, subCb) => {
                          if (parentFolder && parentFolder.filename) {
  
                            newFolder.contentType = `template_subfolder_${folder._id}`;
                            newFolder._client = parentFolder._client;
                            newFolder._firm = parentFolder._firm;
                            newFolder._folder = parentFolder._id;
                            newFolder._personal = parentFolder._personal;
                            newFolder.filename = folder.name;
      
                            File.query().insert(newFolder).returning("*")
                              .asCallback(async (err, result) => {
                                // do nothing
                                console.log("err", err);
                                console.log("add new", result);

                                //update the permission for the folder created by folder template
                                subCb();
                              });
                          } else {
                            subCb();
                          }
                        }, (err) => {
                          cb()
                        });
                      });
                  } else {
                    cb();
                  }
                } else {
                  cb()
                }
              }, err => {
                if (subfolder.length === count) {
                  delete req.body.action;
                  delete req.body.status;
                  delete req.body.filesId;
                  req.body.subfolder = JSON.stringify(subfolder);
                  req.body.updated_at = new Date();
                  FolderTemplate.query().findById(req.params.id).update(req.body).returning("*")
                    .asCallback((err, result) => {
                      res.send({ success: true, folderTemplate: result });
                    });
                }
              });
            // } else {
            //   res.send({success: false, message: "You do not have permission to access this Firm"});
            // }
          }
        });
    }
  });
}

exports.deleteRootFolder = (req, res) => {
  const rootFolderId = parseInt(req.params.id)
  FolderTemplate.query()
  .findById(rootFolderId)
  .asCallback((err, folder) => {
    if (folder && folder._id) {
      permissions.utilCheckFirmPermission(req.user, folder._firm, "access", permission => {
        if (!permission) {
          logger.info("user does NOT have permission.")
          res.send({success: false, message: "You do not have permisson to delete this firm folder templates."})
        } else {

          FolderTemplate.query()
          .findById(folder._id)
          .delete()
          .returning('*')
          .asCallback((err, folder) => {
            if (folder && folder._id && !err) {
              const fileContentTypes = ['template_folder_' + folder._id];
              if (folder && folder.subfolder && folder.subfolder.length) {
                folder.subfolder.forEach(item => {
                  fileContentTypes.push('template_subfolder_' + item._id);
                });
              }

              File.query().where({ _firm: folder._firm })
              .whereIn('contentType', fileContentTypes)
              .update({ contentType: null, updated_at: new Date() })
              .then(files => {
                res.send({ success: true, message: 'Folder deleted successfully.' })
              });
            } else {
              res.send({ success: false, message: err })
            }
          });
        }
      });
    } else {
      res.send({ success: false, message: err })
    }
  })
}

exports.bulkApplyFolderTemplate = (req, res) => {
  const { associated, mangoCompanyID, selectedClientId, templateIds, _firm } = req.body;
  const templateId = templateIds[0];
  permissions.utilCheckFirmPermission(req.user, _firm, 'access', permission => {
    if(!permission) {
      res.send({success: false, message: "You do not have permission to access this Firm"});
    } else if (!templateId) {
      res.send({success: false, message: "Template not found"});
    } else {
      
      FolderTemplate.query().findById(templateId)
      .then(folderTemplate => {
        if (!folderTemplate) {
          res.send({success: false, message: "Template not found"});
        } else {
          let newFolder = {
            category: "folder"
            , contentType: associated ? `template_folder_${folderTemplate._id}` : null
            , status: "visible"
            , wasAccessed: false
            , _firm
            , _user: req.user._id
            , filename: folderTemplate.name
            , mangoCompanyID: mangoCompanyID ? mangoCompanyID : null
          }
          
          Firm.query().findById(_firm)
          .then(firm => {
            if (!firm) {
              res.send({success: false, message: "Firm not found"});
            } else {

              res.send({ success: true });

              Client.query().whereIn('_id', selectedClientId)
                .then(clients => {

                  if (clients && clients.length) {

                    const newFolders = [];
                    clients.forEach(item => {
                      newFolders.push({
                        ...newFolder
                        , _client: item._id
                        , mangoClientID: item.mangoClientID ? item.mangoClientID : null
                      })
                    });
                    
                    File.query().insert(newFolders).returning("*")
                      .asCallback((err, folders) => {

                        if (folders && folders.length) {

                          async.mapSeries(folders, (folder, callback) => {
                            newFolder._client = folder._client;
                            newFolder.mangoClientID = folder.mangoClientID;
                            const subfolder = folderTemplate.subfolder;
                            exports.createSubfolder(req, subfolder, newFolder, folder._id, null, (err, result) => {
                              callback(result);
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
  });
}