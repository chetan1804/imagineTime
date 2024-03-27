/**
 * To avoid duplicating logic everywhere. 
 */
const async = require('async');

const fileUtils = {
  getDownloadLink(file) {
    if(!file) {
      return ''
    } else {
      let fileUrl = `/api/files/download/${file._firm}/${file._client ? file._client + '/' : 'firm/'}${file._id + '/'}`;
      fileUrl += encodeURIComponent(file.filename);

      return fileUrl;
    }
  }
  , getAllFilesConnectedId(type, fileIds, files) {
    if ((!fileIds) || (fileIds && !fileIds.length) && files) {
      return fileIds;
    } else {
        const sendData = {
            type
            , fileIds
            , originalIds: fileIds
            , files
            , resultIds: []
            , totalFile: []
            , totalFolder: []
            , fileSize: 0
        }
        return fileUtils.filesTotalLoopBack(sendData);
    }
  }

  , filesTotalLoopBack(data) {
    async.map(data.fileIds, (fileId, callback) => {
      if(!!data.files) {
        const file = data.files.filter(item => item._id === fileId)[0];
      
        data.fileIds = data.files.flatMap(item => item._folder == fileId ? [item._id] : []);
        if (data.fileIds.length) {
          fileUtils.filesTotalLoopBack(data);
        }

        if (data.type === "get-associated-file-if-folder") {
          if (file && file.category !== "folder") {
            data.resultIds.push(fileId);
          }
        } else if (data.type === 'get-associated-file-and-folder') {
          if (!data.originalIds.includes(fileId) && file && file.category !== "folder") {
            data.totalFile.push(fileId);
            data.fileSize += (parseInt(file.fileSize) || 0);
          } else if (!data.originalIds.includes(fileId) && file && file.category === "folder") {
            data.totalFolder.push(fileId);
          }
        } else if (file) {
          data.resultIds.push(fileId);
        }
      }
      callback();
    }, err => {
      if (data.type === 'get-associated-file-and-folder') {
        return data;
      } else {
        return data.resultIds;
      }
    });
    if (data.type === 'get-associated-file-and-folder') {
      return data;
    } else {
      return data.resultIds;
    }
  }

  , getFileDataAllWithintTheFolder(fileIds, files) {
    if (!fileIds) {
      return 0
    } else {
      return fileUtils.fileSizeLoopBack(fileIds, files, { fileSize: 0, fileIds: [] });
    }
  }

  , fileSizeLoopBack(fileIds, files, returnData) {
    async.map(fileIds, (fileId, callback) => {
      if (files.some(file => file._folder == fileId && file.status !== "archived" && file.status !== "deleted")) {
        const folderIds = files.filter(file => file._folder == fileId && file.status !== "archived" && file.status !== "deleted").map(file => file._id);
        fileUtils.fileSizeLoopBack(folderIds, files, returnData);
      } else {
        let file = files.filter(file => file._id === fileId);
        file = file ? file[0] : { };
        returnData.fileSize += file.fileSize ? parseInt(file.fileSize) : 0;
        returnData.fileIds.push(fileId);
        callback();
      }
    }, err => {
      return returnData;
    });
    return returnData;
  }

  , getGroupByFilename(firm, actionKey, fileList, props) {
    const { clientStore, match } = props;
    const objUniqueFileListItems = {};
    let fileListItems = [];
    let folderListItems = [];
    let newAllFilesFromListArgs = [];

    const handleGetUniqueFilename = (file) => {
      let uniqueKey = file.filename;

      if (actionKey === "global" || actionKey === "default") {
        if (file._client) {
          uniqueKey += "client" + file._client;
        } else {
          uniqueKey += "clientIsEmpty";
        }
        if (file._personal) {
          uniqueKey += "personal" + file._personal;
        } else {
          uniqueKey += "personalIsEmpty";
        }
        if (file._folder) {
          uniqueKey += "folder" + file._folder;
        } else {
          uniqueKey += "folderIsEmpty";
        }
      }

      if (file.category === "folder" || (firm && firm.fileVersionType != "enable")) {
        fileListItems.push(file);
      } else if (objUniqueFileListItems[uniqueKey] && file.category !== "folder") {
        objUniqueFileListItems[uniqueKey].olderVersions.push(file);

        if (!file.versionOrder && objUniqueFileListItems[uniqueKey].latestVersion.versionOrder) {
          // do nothing
        } else if (file.versionOrder && !objUniqueFileListItems[uniqueKey].latestVersion.versionOrder) {
          objUniqueFileListItems[uniqueKey].latestVersion = file;
        } else if (file.versionOrder && objUniqueFileListItems[uniqueKey].latestVersion.versionOrder) {
          if (objUniqueFileListItems[uniqueKey].latestVersion.versionOrder < file.versionOrder) {
            objUniqueFileListItems[uniqueKey].latestVersion = file;
          }
        } else {
          let currentLatest = new Date(objUniqueFileListItems[uniqueKey].latestVersion.created_at).valueOf();
          let challenger = new Date(file.created_at).valueOf();
          if (currentLatest < challenger) {
              objUniqueFileListItems[uniqueKey].latestVersion = file;
          }
        }
      } else if (file.category !== "folder") {
          objUniqueFileListItems[uniqueKey] = {};
          objUniqueFileListItems[uniqueKey].olderVersions = [];
          objUniqueFileListItems[uniqueKey].olderVersions.push(file);
          objUniqueFileListItems[uniqueKey].latestVersion = file;
      }
    }

    if (firm && firm.fileVersionType === "enable") {
      console.log('helloworld111');
      fileList.map(file => {
        if (file) {
          if (actionKey === "global" && clientStore) {
            file.itemType = "file";
            file.itemDisplay = "File";
            file.location = file._client ? clientStore.byId[file._client] ? clientStore.byId[file._client].name : 'Workspace' : file._personal ? 'Staff files' : 'General files';
            handleGetUniqueFilename(file);
          } else if (actionKey === "portal") {
            if (match.params.folderId && match.params.folderId == file._folder) {
              handleGetUniqueFilename(file);
            } else if (!match.params.folderId && !file._folder) {
              handleGetUniqueFilename(file);
            }
          } else if (actionKey === "workspace") {
            if (match.params.userId) {
              if (match.params.userId == file._personal) {
                newAllFilesFromListArgs.push(file);
      
                // get root or associated within folder
                if (match.params.folderId && match.params.folderId == file._folder) {
                  handleGetUniqueFilename(file);
                } else if (!match.params.folderId && !file._folder) {
                  handleGetUniqueFilename(file);
                }
        
                // get folder 
                if (file.category === "folder") {
                  folderListItems.push(file);
                }
              }
            } else if (!file._personal) {
              newAllFilesFromListArgs.push(file);
      
              // get root or associated within folder
              if (match.params.folderId && match.params.folderId == file._folder) {
                handleGetUniqueFilename(file);
              } else if (!match.params.folderId && !file._folder) {
                handleGetUniqueFilename(file);
              }
      
              // get folder 
              if (file.category === "folder") {
                folderListItems.push(file);
              }
            }
          } else {
            handleGetUniqueFilename(file)
          }
        }
        return file;
      });
      Object.keys(objUniqueFileListItems).map(fileName => {
        let file = objUniqueFileListItems[fileName].latestVersion;
        file.olderVersions = objUniqueFileListItems[fileName].olderVersions;
        fileListItems.push(file);
      });
    } else {
      fileList.map(file => {
        if (actionKey === "global" && clientStore) {
          file.itemType = "file";
          file.itemDisplay = "File";
          file.location = file._client ? clientStore.byId[file._client] ? clientStore.byId[file._client].name : 'Workspace' : file._personal ? 'Staff files' : 'General files';
          handleGetUniqueFilename(file);
        } else if (actionKey === "portal") {
          if (match.params.folderId && match.params.folderId == file._folder) {
            handleGetUniqueFilename(file);
          } else if (!match.params.folderId && !file._folder) {
            handleGetUniqueFilename(file);
          }
        } else if (actionKey === "workspace") {
          if (match.params.userId) {
            if (match.params.userId == file._personal) {
              newAllFilesFromListArgs.push(file);
    
              // get root or associated within folder
              if (match.params.folderId && match.params.folderId == file._folder) {
                handleGetUniqueFilename(file);
              } else if (!match.params.folderId && !file._folder) {
                handleGetUniqueFilename(file);
              }
      
              // get folder 
              if (file.category === "folder") {
                folderListItems.push(file);
              }
            }
          } else if (!file._personal) {
            newAllFilesFromListArgs.push(file);
    
            // get root or associated within folder
            if (match.params.folderId && match.params.folderId == file._folder) {
              handleGetUniqueFilename(file);
            } else if (!match.params.folderId && !file._folder) {
              handleGetUniqueFilename(file);
            }
    
            // get folder 
            if (file.category === "folder") {
              folderListItems.push(file);
            }
          }
        } else {
          handleGetUniqueFilename(file)
        }
        return file;
      });
    }

    return actionKey === "workspace" ? {
      fileListItems
      , newAllFilesFromListArgs
      , folderListItems
    } : fileListItems;
  }

}

export default fileUtils;