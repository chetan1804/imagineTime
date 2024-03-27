const _ = require('lodash');
const async = require('async');
let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

exports.buildFileNameWithFolders = (file) => {
  logger.info('Generating filename with folders.', file)
  // generate a path for gcloud storage and retrieval.
  let fileNameWithFolders = `${file._firm}/`;
  if(file._client) {
    fileNameWithFolders += `${file._client}/`
  }
  fileNameWithFolders += `${file._id}${file.fileExtension}`
  logger.info('gcloud filepath generated: ', fileNameWithFolders)
  return fileNameWithFolders;

  /**
   * FUTURE: FILE VERSIONING
   * 
   * In the future if we implement file versioning, we'll structure the above differently.
   * instead of ending the string with file._id + file.fileExtension it will end with 
   * file._id/file.version + file.fileExtension where file.version is an integer that starts
   * at 0 or 1 and increments every time the file is updated. That way we can assume previous
   * version exist based on the version number.
   */
}

exports.buildTemplateNameWithFolders = (file) => {
  logger.info('Generating filename with folders.', file)
  // generate a path for gcloud storage and retrieval.
  let fileNameWithFolders = `document-template/${file._firm}/${file._id}${file.fileExtension}`;
  return fileNameWithFolders;

  /**
   * FUTURE: FILE VERSIONING
   * 
   * In the future if we implement file versioning, we'll structure the above differently.
   * instead of ending the string with file._id + file.fileExtension it will end with 
   * file._id/file.version + file.fileExtension where file.version is an integer that starts
   * at 0 or 1 and increments every time the file is updated. That way we can assume previous
   * version exist based on the version number.
   */
}

exports.checkIfMSWordFile = (file) => {
  let extensions = ['.doc', '.docm', '.docx', '.dot', '.dotm', '.dotx'];

  if(extensions.includes(file.fileExtension)) {
    return true;
  }
  return false;
}

exports.getFileUrl = (file) => {
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

  return file.fileUrl;
}

exports.utilSortFiles = (fileList, searchSortName, searchSortAsc, callback) => {
  if (searchSortName === 'updated_at') {
    fileList = _.orderBy(fileList, [item => item[searchSortName]], [searchSortAsc]); 
  } else {
    fileList = _.orderBy(fileList, [item => item[searchSortName].toLowerCase()], [searchSortAsc]);             
  }

  let templates = [];
  let folders = [];
  let files = [];

  fileList.forEach(file => {
    if (file.category === "folder" && file.contentType) {
      templates.push(file);
    } else if (file.category === "folder") {
      folders.push(file)
    } else {
      files.push(file);
    }
  });

  // fileList = fileList.sort((a,b) => {
  //   let aIndex = a.category === "folder" && a.contentType ? 0 : a.category === "folder" ? 1 : 2;
  //   let bIndex = b.category === "folder" && b.contentType ? 0 : b.category === "folder" ? 1 : 2;
  //   return aIndex - bIndex;
  // });

  fileList = templates.concat(folders).concat(files);
  callback(fileList)
}

exports.utilGroupByFilename = (firm, files, callback) => {
  if (firm.fileVersionType === 'enable' && files && files.length) {
    let fileList = [];
    let objUniqueFileListItems = {};
    async.map(files, (file, cb) => {
      let uniqueKey = file.filename;
      if (file.category === "folder") {
        fileList.push(file);
      } else if (objUniqueFileListItems[uniqueKey]) {
        objUniqueFileListItems[uniqueKey].olderVersions.push(file);
        if (objUniqueFileListItems[uniqueKey].latestVersion._id < file._id) {
          objUniqueFileListItems[uniqueKey].latestVersion = file;
        }
      } else {
        objUniqueFileListItems[uniqueKey] = {};
        objUniqueFileListItems[uniqueKey].olderVersions = [];
        objUniqueFileListItems[uniqueKey].olderVersions.push(file);
        objUniqueFileListItems[uniqueKey].latestVersion = file;
      }
      cb(null);
    }, (err) => {
      if (!err) {
        try {
          Object.keys(objUniqueFileListItems).map(newUniqueKey => {
            let item = objUniqueFileListItems[newUniqueKey];
            item.latestVersion.fileVersionCount = item.olderVersions.length - 1;
            fileList.push(item.latestVersion);
          });
          callback(fileList);
        } catch (error) {
          console.log("err", error)
        }
      } else {
        callback(fileList);
      }
    });
  } else {
    callback(files);
  }
}