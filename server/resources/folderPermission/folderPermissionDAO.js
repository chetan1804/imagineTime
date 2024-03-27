const { raw } = require('objection');

const FolderPermission = require('./FolderPermissionModel');
const File = require('../file/FileModel');
const Firm = require('../firm/FirmModel');

const staffDao = require('../staff/staffDAO');
const clientUserDao = require('../clientUser/clientUserDAO');
const firmDAO = require('../firm/firmDAO');
const folderDao = require('../folder/folderDAO');
const folderTemplateDao = require('../folderTemplate/folderTemplateDAO');

const folderPermissionDefault = {
  "_firm": null,
  "_client": null,
  "_folder": null,
  "adminRead": true,
  "adminCreate": true,
  "adminUpdate": true,
  "adminDelete": true,
  "adminDownload": true,
  "adminUpload": true,
  "ownerRead": true,
  "ownerCreate": true,
  "ownerUpdate": true,
  "ownerDelete": true,
  "ownerDownload": true,
  "ownerUpload": true,
  "staffRead": true,
  "staffCreate": true,
  "staffUpdate": true,
  "staffDelete": true,
  "staffDownload": true,
  "staffUpload": true,
  "contactRead": true,
  "contactCreate": true,
  "contactUpdate": true,
  "contactDelete": true,
  "contactDownload": true,
  "contactUpload": true,
  "showFolderClientPortal": true
}

const firmColumns = ['f._id', 'f.allowCreateFolder', 'f.allowDeleteFiles', 'f.allowMoveFiles'];

const folderColumns = ['_id', '_client', '_firm', 'status', 'category'];

const chunkSize = 1000;

let firms = [];

//Get Function
exports.handleGetPermissionByFolder = (folderId) => {

  return FolderPermission.query()
    .where({
      _folder: folderId
    })
    .first();
}

exports.handleGetPermissionByGroup = (firmId) => {
  return FolderPermission.query()
    .where({
      _firm: firmId,
      _folder: null,
      _client: null
    })
    .first();
}

exports.handleGetPermissionByQuery = (query) => {
  
  return FolderPermission.query()
    .where(query)
}

//Create Function
exports.handleCreatePermission = (requestBody) => {

  return FolderPermission.query()
    .insert(requestBody)
    .returning('*');
}

//Update Function
exports.handleUpdatePermission = (permissionId, requestBody) => {
  return FolderPermission.query()
    .findById(permissionId)
    .update({...requestBody})
    .returning('*');
}

exports.updateBulkFolderPermissionByFolder = (ids, payload) => {
  return FolderPermission.query()
    .whereIn('_folder', ids)
    .update(payload)
    .returning('*');
}

//Delete Function
exports.deleteAllPermissions = () => {
  return FolderPermission.query()
    .delete()
    .returning('*')
}

//Util Functions
exports.checkPermissionIfExistFolder = (firmId = null, folderId = null) => {

  return FolderPermission.query()
    .where({
      _firm: firmId,
      _folder: folderId
    })
    .first();
}

exports.checkPermissionIfExistGroup = (firmId = null) => {

  return FolderPermission.query()
    .where({
      _firm: firmId,
      _folder: null,
      _client: null
    })
    .first();
}

exports.checkFolderPermissionUser = async (user, action="", folderId = null, firmId = null, clientId = null) => {

  const permission = await this.handleGetPermissionByFolder(folderId);

  if(!permission) {
    //permision does not exists return false
    return false;
  }

  if(user.admin) {
    return !!permission[`admin${action}`];
  } else {
    //check user if staff
    const staff = await staffDao.getStaff(user._id, firmId)
    .then(staff => {
      if(!staff) {
        return null
      } else {
        return staff;
      }
    })
    .catch(err => {
      return null
    })

    if(!!staff) {
      if(staff.owner) {
        return !!permission[`owner${action}`]
      } else {
        return !!permission[`staff${action}`]
      }
    } else {
      //check if client user
      const clientUser = await clientUserDao.getClientUser(user._id, firmId, clientId)
      .then(clientUser => {
        if(!clientUser) {
          return null;
        } else {
          return clientUser;
        }
      })
      .catch(err => {
        return null;
      })

      if(!!clientUser) {
        return !!permission[`contact${action}`]
      } else {
        return false;
      }
    }
  }
}

exports.getColumn = async () => {
  const columns =  await FolderPermission.getColumn;
  console.log('columns', columns);
  return columns
}

exports.fetchWithFolder = (folderId) => {
  return File.query()
    .from('files as f')
    .findById(folderId)
    .leftJoin('folderpermission as fp', 'fp._folder', 'f._id')
    .whereNot('f.status', 'deleted')
    .select('f.*', raw('row_to_json(fp) as permission'))
}

exports.fetchWithFirm = (firmId) => {
  return Firm.query()
    .from('firms as f')
    .findById(firmId)
    .leftJoin('folderpermission as fp', 'fp._firm', 'f._id')
    .where({
      'fp._client': null,
      'fp._folder': null
    })
    .select('f.*', raw('row_to_json(fp) as permission'))
}

exports.getAllPermissions = () => {
  return FolderPermission.query();
}

exports.getFolderTemplatesPermission = async () => {
  let newTemplates = [];
  let promiseList = []

  return folderTemplateDao.getAllFolderTemplates()
    .then(firms => {
      for(const firm of firms) {
        if(!!(firm.foldertemplate && firm.foldertemplate._id)) {
          newTemplates.push(...setupFolderTemplatePayload(firm));
        }
      }

      newTemplates.map(template => {
        promiseList.push(
          folderTemplateDao.updateFolderTemplates(template._id, template)
        )
      })
      
      return Promise.all([...promiseList]);
    })
}

exports.handlePopulateGroupPermission = async () => {

  const firms = await firmDAO.getFirmsWithSelectedColumn(firmColumns).then(firms => firms).catch(err => []);

  const promiseList = [];

  let payload;

  for(const firm of firms) {
    payload = setupPayload(firm);
    promiseList.push(
      exports.handleCreatePermission(payload)
    )
  }

  return Promise.all(promiseList)
    .then(results => {
      console.log('data length', results.length);
      return results
    })
    .catch(err => {
      console.log('err', err);
      return [];
    });
}

exports.handlePopulateFolderPermission = async () => {
  firms = await firmDAO.getFirmsWithSelectedColumn(firmColumns).then(firms => firms).catch(err => []);

  const firmIds = firms.map(f => f._id);

  let firmFolders = await folderDao.getFoldersByFirmIds(firmIds, folderColumns);

  let payloadList = [];

  firmFolders.map(folder => {
    const selectedFirm = firms.filter(f => f._id == folder._firm)[0];
    if(selectedFirm && selectedFirm._id) {
      let payload = setupPayload(selectedFirm, folder);
      payloadList.push(payload);
    }
  })

  for(let i = 0; i < payloadList.length; i += chunkSize) {
    let chunk = payloadList.slice(i, i + chunkSize);

    console.log(`chunk ${i + 1}`, chunk.length);

    await this.handleCreatePermission(chunk)
      .then(permissions => {
        console.log(`permission created for chunk ${i+1}`, permissions.length);
      })
      .catch(err => {
        console.log(`err - chunk ${i+1}`, err);
      })
  }
  return firmFolders;
}

function setupFolderTemplatePayload(firm) {
  let folderTemplate = firm.foldertemplate;
  const permission = firm.permission;
  let payloads = [];

  if(!!(folderTemplate && folderTemplate._id)) {
    Object.keys(folderPermissionDefault).map(key => {
      if(key != '_folder' && key != '_client') {
        folderTemplate[key] = !!(permission && permission[key]);

        if(Array.isArray(folderTemplate.subfolder)) {
          folderTemplate.subfolder.map(sub => {
            if(key != '_firm')
              sub[key] = !!(permission && permission[key]);
          })
        }
      }
    })

    folderTemplate.subfolder = JSON.stringify(folderTemplate.subfolder);

    folderTemplate['_firm'] = firm._id;
    payloads.push(folderTemplate);
  }

  console.log('payloads', payloads);
  return payloads;
}

function setupPayload(firm, folder = {}) {

  let payload = {}

  Object.keys(folderPermissionDefault).map(key => {
    payload[key] = folderPermissionDefault[key];
  })

  payload['_firm'] = firm._id;
  payload['contactCreate'] = !!firm.allowCreateFolder;
  payload['contactDelete'] = !!firm.allowDeleteFiles;
  payload['contactUpdate'] = !!firm.allowRenameFiles;

  if(folder && folder._id) {
    payload['_folder'] = folder._id;
    payload['_client'] = folder._client;
  }

  return payload;
}