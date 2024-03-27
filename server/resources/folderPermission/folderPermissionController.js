//model
const FolderPermission = require('./FolderPermissionModel');

const folderPermissionDao = require('./folderPermissionDAO');
const logger = require('../../logger');

exports.createPermissionByGroup = (req,res) => {
  const firmId = req.body._firm;

  if(!req.body._firm) {
    res.send({success: false, message: "Incomplete request"});
    return;
  }

  delete req.body.adminFullAccess;
  delete req.body.ownerFullAccess;
  delete req.body.staffFullAccess;
  delete req.body.contactFullAccess;

  //Check if permission exists
  folderPermissionDao.checkPermissionIfExistGroup(firmId)
    .then(permission => {
      if(!permission) {
        //create permission
        folderPermissionDao.handleCreatePermission(req.body)
          .then(permission => {
            if(!permission) {
              res.send({success: false, message: "Unable to save permission"});
            } else {
              folderPermissionDao.fetchWithFirm(firmId)
                .then(firm => {
                  if(!!firm) {
                    res.send({success: true, firm});
                  } else {
                    res.send({success: false, message: "Unable to save permission"});
                  }
                })
                .catch(err => {
                  res.status(500);
                  res.send({success: false, message: "Internal server error"});
                })
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal server error"});
          })
      } else {
        //update permission
        folderPermissionDao.handleUpdatePermission(permission._id, req.body)
          .then(permission => {
            if(!permission) {
              res.send({success: false, message: "Unable to save permission"});
            } else {
              folderPermissionDao.fetchWithFirm(firmId)
                .then(firm => {
                  if(!!firm) {
                    res.send({success: true, firm});
                  } else {
                    res.send({success: false, message: "Unable to save permission"});
                  }
                })
                .catch(err => {
                  res.status(500);
                  res.send({success: false, message: "Internal server error"});
                })
            }
          })
          .catch(err => {
            res.status(500);
            res.send({success: false, message: "Internal server error"});
          })
      }
    })
    .catch(err => {
      console.log('err', err);
      res.status(500)
      res.send({success: false, message: "Internal server error"});
    });
}

exports.createPermissionByFolder = (req, res) => {
  const folderId = req.body._folder;

  if(!folderId || !req.body._firm) {
    res.send({success: false, message: "Incomplete request"});
    return;
  }

  delete req.body.adminFullAccess;
  delete req.body.ownerFullAccess;
  delete req.body.staffFullAccess;
  delete req.body.contactFullAccess;

  //check if permission exists for folder
  folderPermissionDao.checkPermissionIfExistFolder(req.body._firm, folderId)
    .then(permission => {
      if(!permission) {
        //add permission to folder
        folderPermissionDao.handleCreatePermission(req.body)
        .then(permission => {
          folderPermissionDao.fetchWithFolder(folderId)
          .then(file => {
            if(!file) {
              res.send({success: false, message: "Unable to save permission"});
            } else {
              res.send({success: true, file})
            }
          })
          .catch(err => {
            res.status(500)
            res.send({success: false, message: "Unable to save permission"})
          })
        })
        .catch(err => {
          res.status(500)
          res.send({ success: false, message: "Unable to save permission"})
        })
      } else {
        //update the existing permission
        folderPermissionDao.handleUpdatePermission(permission._id, req.body)
          .then(permission => {
            if(!permission) {
              res.send({success: false, message: "Unable to save permission"});
            } else {
              folderPermissionDao.fetchWithFolder(folderId)
                .then(file => {
                  if(!file) {
                    res.send({success: false, message: "Unable to save permission"});
                  } else {
                    res.send({success: true, file})
                  }
                })
                .catch(err => {
                  res.status(500)
                  res.send({success: false, message: "Unable to save permission"})
                })
            }
          })
          .catch(err => {
            res.status(500)
            res.send({success: false, message: "Unable to save permission"})
          })
      }
    })
    .catch(err => {
      res.status(500)
      res.send({success: false, message: "Internal server error"})
    })

}

exports.updatePermission = (req, res) => {

  const permissionId = req.params.permissionId;

  folderPermissionDao.handleUpdatePermissionByFolder(permissionId, req.body)
    .then(permission => {
      if(!permission) {
        res.send({success: false, message: "Unable to save permission"});
      } else {
        res.send({success: true, permission})
      }
    })
    .catch(err => {
      res.status(500)
      res.send({success: false, message: "Unable to save permission"})
    })
}

exports.getFolderPermissionByFolder = (req, res) => {
  const folderId = req.params.folderId;

  folderPermissionDao.handleGetPermissionByFolder(folderId)
    .then(permission => {
      if(!permission) {
        res.send({success: false, message: "Unable to fetch permission"});
      } else {
        res.send({success: true, permission})
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal server error"});
    })
}

exports.getFolderPermissionByGroup = (req, res) => {
  const firmId = req.params.firmId;

  folderPermissionDao.handleGetPermissionByGroup(firmId)
    .then(permission => {
      if(!permission) {
        res.send({success: false, message: "Unable to fetch permission"});
      } else {
        res.send({success: true, permission})
      }
    })
    .catch(err => {
      res.status(500);
      res.send({success: false, message: "Internal server error"});
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

    folderPermissionDao.handleGetPermissionByQuery(query)
      .then(permissions => {
        res.send({success: true, permissions });
      })
      .catch(err => {
        res.send({success: false, message: "Internal server error"})
      })
  }
}

exports.getDefault = async (req, res) => {
  res.send({success: true, folderPermission: await folderPermissionDao.getColumn()});
}

exports.deleteAllPermissions = (req, res) => {
  folderPermissionDao.deleteAllPermissions()
    .then(permissions => {
      res.send({success: true, permissions})
    })
    .catch(err => {
      logger.err(err.message);
      res.send({succcess: false, message: err.message});
    })
}

exports.populateGroupPermission = async (req, res) => {
  await folderPermissionDao.deleteAllPermissions();

  await folderPermissionDao.handlePopulateGroupPermission()
    .then(data => {
      res.send({success: true, data});
    })
}

exports.populateFolderPermission = async (req, res) => {
  // await folderPermissionDao.handlePopulateFolderPermission()
  //   .then(data => {
  //     res.send({success: true, data});
  //   })
  folderPermissionDao.handlePopulateFolderPermission()
  res.send({success: true})
}

exports.populateFolderTemplatePermission = (req, res) => {
  folderPermissionDao.getFolderTemplatesPermission()
    .then(templates => {
      res.send({success: true, templates});
    })
    .catch(err => {
      res.send({success: false, message: err.message, err})
    })
}

exports.getAllPermission = async (req, res) => {
  
  const permissions = await folderPermissionDao.getAllPermissions();

  console.log('permissions.length', permissions.length);
  res.send({success: true, permissions})
}