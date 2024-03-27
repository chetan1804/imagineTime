const async = require('async');
import saveAs from 'save-as';
import fetch from 'isomorphic-fetch';
import fileUtils from './fileUtils';

const downloadsUtil =  {
    bulkZipped(params, callback) {
        const {
            selectedFileIds
            , files
            , filesMap
            , userLevel
            , shareLinkId
            , uploadName
            , socket
            , loggedInUser
        } = params;

        let fileIds = [];
        let folders = []

        if (selectedFileIds && selectedFileIds.length && files && filesMap && userLevel) {
            if (socket) {
                socket.emit('start_progress', loggedInUser._id, 'In Progress');
            }

            selectedFileIds.map(id => {
                if (id && filesMap[id] && filesMap[id].category === "folder") {
                    folders.push(filesMap[id]);
                } else if (id && filesMap[id] || shareLinkId) {
                    fileIds.push(id);
                }
            });

            let zip = new JSZip();
            const zipName = 'Files Zipped.zip';
            const folderNames = [];
            let allFileIds = fileIds;
            console.log('start allFileIds', allFileIds)
            console.log('start folders', folders)
            console.log('start fileIds', fileIds)

            async.mapSeries(folders, (folder, cb) => {
                let folderName = folder.filename;
                if (folderNames.includes(folderName)) {
                    let newFilename = `${folderName} (${folderNames.filter(fn => fn === folderName).length})`;
                    folderNames.push(folderName);
                    folderName = newFilename;
                } else {
                    folderNames.push(folderName);
                }
                folder.filename = folderName;
                downloadsUtil.zippedFolder(params, folder, zip, false, (resZip, fileIdsRes) => {
                    cb(null, resZip);
                });
            }, (err, resZipped) => {
                if (err && !resZipped) {
                    console.log("do nothing")
                } else {

                    console.log('end allFileIds', allFileIds)
                    if (resZipped && resZipped.length) {
                        resZipped = resZipped[0];
                    } else {
                        resZipped = zip;
                    }

                    // request too many fileId in one, getting max string limit
                    const fileNames = [];
                    let count = 0;
                    async.mapSeries(allFileIds, (fileId, cb) => {
                        let progressPercent = (count / allFileIds.length) * 100;
                        if (socket) {
                            progressPercent = parseInt(progressPercent);
                            count++;
                            socket.emit('progress_status', loggedInUser._id, progressPercent / 2);
                        }
                        downloadsUtil.singleBase64String(fileId).then(response => {
                            console.log(response);
                            if (socket) {
                                socket.emit('progress_status', loggedInUser._id, progressPercent);
                            }
                            if (response && response.success && response.file) {
                                const file = response.file;
                                let base64String = file.data;
                                let filename = file.filename.substr(0, file.filename.lastIndexOf("."));
                                if (fileNames.includes(filename)) {
                                    let newFilename = `${filename} (${fileNames.filter(fn => fn === filename).length})`;
                                    fileNames.push(filename);
                                    filename = newFilename; 
                                } else {
                                    fileNames.push(filename);
                                }
                                resZipped.file(`${filename}${file.fileExtension}`, base64String, { base64: true });
                                cb();
                            } else if (filesMap[fileId]) {
                                let link = fileUtils.getDownloadLink(filesMap[fileId]);
                                if(link) {
                                    var a  = document.createElement("a");
                                    a.setAttribute('href', `${link}?userLevel=staffclient&type=downloaded&name=${uploadName}`); 
                                    a.setAttribute('download', '');
                                    a.setAttribute('target', '_blank');       
                                    a.click();
                                }
                                cb();
                            } else {
                                cb();
                            }
                        })
                    }, (err) => {
                        if (!err) {
                            resZipped.generateAsync({ type: 'blob' }).then(function(content) {
                                if (socket) {
                                    socket.emit('progress_status', loggedInUser._id, 100);
                                }
                                saveAs(content, zipName);
                                downloadsUtil.downloadNotification({
                                    fileIds: allFileIds
                                    , shareLinkId
                                    , userLevel
                                    , uploadName
                                })
                                .then(response => {
                                    if (socket) {
                                        socket.emit('finish_progress', loggedInUser._id, 'Download completed');
                                    }
                                    callback()
                                });
                            });
                        }
                    });
                }
            });
        } else {
            callback();
        }
    }
    , singleBase64String(fileId) { // get base64 string by file id 
        return fetch(`/api/files/single-file-base64/${fileId}`, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            , method:  'GET'
            , credentials: 'same-origin'
        })
        .then(response => response.json())
        .catch(error => console.log('fetch base64 error: ', error))
    }
    , fetchBase64(data) { // get base64 of every file
        return fetch(`/api/files/file-base64`, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            , method:  'POST'
            , credentials: 'same-origin'
            , body: JSON.stringify(data)
        })
        .then(response => response.json())
        .catch(error => console.log('fetch base64 error: ', error))
    }
    , downloadNotification(data) {
        return fetch(`/api/view-download/download-notification`, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            , method:  'POST'
            , credentials: 'same-origin'
            , body: JSON.stringify(data)
        })
        .then(response => response.json());
    }
    , singleZipped(params, callback) {
        const {
            folder
            , files
            , shareLinkId
            , userLevel
            , uploadName
        } = params;
        if (folder && files && files.length) {
            const zip = new JSZip();
            const zipName = `${folder.filename}.zip`;
            downloadsUtil.zippedFolder(params, folder, zip, true, (resZip, fileIds) => {
                if (resZip) {
                    resZip.generateAsync({ type: 'blob' }).then(function(content) {
                        saveAs(content, zipName);
                        // downloadsUtil.downloadNotification(data)
                        // .then(response => {
                        //     console.log("response download notification", response);
                        // });
                        downloadsUtil.downloadNotification({
                            fileIds
                            , shareLinkId
                            , userLevel
                            , uploadName
                        })
                        .then(response => {
                            console.log("response download notification", response);
                        });
                        callback();
                    });
                }
            });
        }
    }
    , zippedFolder(params, folder, zip, isRoot, callback) {
        const {
            files
            , userLevel
            , shareLinkId
            , uploadName
        } = params;
        let sendData = {
            folders: [folder]
            , downloadFiles: []
            , files
            , fileIds: []
            , root: isRoot
        }

        downloadsUtil.loopBack(sendData, result => {
            const fileNames = [];
            async.mapSeries(result.downloadFiles, (file, cb) => {
                let filename = file.downloadPath;
                if (fileNames.includes(filename)) {
                    let newFilename = `${filename} (${fileNames.filter(fn => fn === filename).length})`;
                    fileNames.push(filename);
                    filename = newFilename; 
                } else {
                    fileNames.push(filename);
                }
                if (file && file.category !== "folder") {
                    downloadsUtil.singleBase64String(file._id).then(response => {
                        if (response && response.success && response.file) {
                            let base64String = response.file.data;
                            zip.file(`${filename}${file.fileExtension}`, base64String, { base64: true });
                        } else {
                            let link = fileUtils.getDownloadLink(file);
                            if(link) {
                                var a  = document.createElement("a");
                                a.setAttribute('href', `${link}?userLevel=staffclient&type=downloaded&name=${uploadName}`); 
                                a.setAttribute('download', '');
                                a.setAttribute('target', '_blank');
                                setTimeout(() => {
                                    a.click();
                                }, 700)
                            }
                        }
                        cb();
                    });
                } else {
                    zip.folder(file.downloadPath);
                    cb();
                }
            }, (err) => {
                if (!err) {
                    callback(zip, result.fileIds);
                }
            });
        });
    }

    , loopBack(data, response) {
        let arrNames = [];
        async.map(data.folders, (folder, callback) => {
            
            let filename = folder.filename;
            if (folder.category !== "folder") {
                filename = folder.filename.substr(0, folder.filename.lastIndexOf("."));
                data.fileIds.push(folder._id);
            }

            // rename file (optional)
            if (arrNames.includes(filename)) {
                let newFilename = filename + ` (${arrNames.filter(item => item === filename).length})`;
                arrNames.push(filename);
                filename = newFilename;
            } else {
                arrNames.push(filename);
            }

            // set download path
            if (!data.root) {
                if (folder && !folder.downloadPath) {
                    folder.downloadPath = filename;
                } else {
                    folder.downloadPath += '/' + filename;
                }
            } else {
                data.root = false;
            }

            data.folders = data.files.flatMap(item => {
                if (item._folder == folder._id) {
                    item.downloadPath = folder.downloadPath;
                    return [item];
                } else {
                    return [];
                }
            });

            if (data.folders && data.folders.length) {
                downloadsUtil.loopBack(data, result => {
                    console.log('result', result)
                });
            }
            data.downloadFiles.push(folder);
            callback(null);
        }, err => {
            response(data)
        });
    },


    getFileName(response) {
        const disposition = response.headers.get("Content-Disposition"); // get content disposition from request headers

        let filename = disposition.split(/;(.+)/)[1].split(/=(.+)/)[1]; // get filename from content disposition

        if (filename.toLowerCase().startsWith("utf-8''")) {
            filename = decodeURIComponent(filename.replace(/utf-8''/i, ""));
        } else {
            filename = filename.replace(/['"]/g, "");
        }

        return filename
    },
    
    downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = filename;
        document.body.appendChild(a); 
        a.click();
        a.remove();
    },

    async downloadFilesAndFoldersAsZip(fileIds) {
        try {
        
            const apiUrl = `/api/files/downloadZip/${JSON.stringify(fileIds)}`

            const response = await fetch(apiUrl, {
                method: "GET",
                credentials: "same-origin",
            });

            const filename = this.getFileName(response) // file of the file that will be downloaded
    
            const blob = await response.blob(); // get blob from response
           
            return this.downloadBlob(blob, filename) // download the blob
            
        } catch (error) {
            return console.log("Error downloading file: ", error);
        }
    },
    async downloadFileOrFolder(fileId) {
        try {
           
            const apiUrl = `/api/files/downloadFileOrFolder/${fileId}`

            const response = await fetch(apiUrl, {
                method: "GET",
                credentials: "same-origin",
            });

            const filename = this.getFileName(response) // file of the file that will be downloaded

            const blob = await response.blob() // get blob from response

            return this.downloadBlob(blob, filename) // download the blob
            
           
        } catch (error) {
            return console.log("Error downloading file: ", error);
        }
    }
}



export default downloadsUtil;