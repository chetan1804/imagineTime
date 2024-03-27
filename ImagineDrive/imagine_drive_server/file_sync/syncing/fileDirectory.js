/*
    Copyright © 2021. ImagineTime Inc. All Rights Reserved
    Created: 8/3/2021
    Created by: jhoemar.pagao@gmail.com
    
    fileDirectory.js
    This file handles request for
    - retrieving latest copy of sync list
    - adding file
    - deleting file
    - updating file
    - moving file
*/
const constants = require('../constants');
const cStorage = require('../cloudStorage');
const profile = require('./fileAccountProfile');
const { getShareLink } = require('../cloudStorage/gstorage');
const log = require('../log');
const db = require('../db');
const { retrieveSelections, uploadSelections } = require("./syncSelect");
let uploadStream;
let downloadStream;

// use to check if file can be marked as failed
// @client: socket client
// @fileInfo: which file to check. if n
// @notifyOthers: true if clients will recieve this file for failed
// return Promise
function markAsFailed(client, file, notifyOthers = true) {
    // STEP: update the meta to failed
    cStorage.updateMetaFileStatus('failed', file.uri, Date.now())
        .then(response => {
            // STEP: let others know
            if (notifyOthers) {
                file.updateAt = Date.now();
                file.status = 'failed';
                profile.notifyWithFiles(file.client, file.personal, file.firm, constants.EVENT_FILE_DIR, {
                    action: 'failed',
                    file: file,
                }, client);
            }
        });
}

// call this to remove the file
function removeFile(client, data, callback) {
    let file = data.file;
    cStorage.deleteFile(file.uri, file.updateAt)
        .then(updateFile => {
            data.file = updateFile;
            // STEP 2: return result
            callback({ code: constants.CODE_RESPONSE_SUC });

            // STEP 3: notify other users
            profile.notifyWithFiles(updateFile.client, updateFile.personal, updateFile.firm, constants.EVENT_FILE_DIR, data, client);
        })
        .catch(err => {
            log.writet('fileDirectory::addFile', err);
            callback({ code: constants.CODE_RESPONSE_ERR, message: err.message });
        });
}

// added/uploaded a file to synclist
// @file: file that will be added to list
function addFile(client, data, callback) {
    if (!uploadStream)
        uploadStream = require('./fileUploadStream');
    let file = data.file;
    // STEP 1: intialize stream
    uploadStream.createUploadStream(client, file)
        .then((sessionId) => {
            if (file.category !== 'folder') {
                // STEP 2: return result
                callback({
                    code: constants.CODE_RESPONSE_SUC,
                    sessionId: sessionId
                }); 
            } else
                callback({code: constants.CODE_RESPONSE_SUC})

            // STEP 3: notify other users
            profile.notifyWithFiles(file.client, file.personal, file.firm, constants.EVENT_FILE_DIR, data, client);
        })
        .catch(err => {
            log.writet('fileDirectory::addFile', err);
            callback({ code: constants.CODE_RESPONSE_ERR, message: err.message });
        });
}

// call this to start downloading the file
// @param client: the requesting client
// @param data: the data needed to process the deletion
function downloadFile(client, data, callback) {
    if (!downloadStream)
        downloadStream = require('./fileDownloadStream');
    let file = data.file;
    // STEP 1: intialize stream
    downloadStream.createDownloadStream(client, file)
        .then((sessionId) => {
            // STEP 2: return result
            callback({
                code: constants.CODE_RESPONSE_SUC,
                sessionId: sessionId
            });
        })
        .catch(err => callback({ code: constants.CODE_RESPONSE_ERR, message: err.message }));
}

// use to retrieve all files
function retrieveSyncList(client, data, callback) {
    let dateFrom;
    let limit = 20;
    if (data.limit) 
        limit = data.limit 
    if (data.from)
        dateFrom = new Date(data.from);
    
    cStorage.retrieveFiles(data.device, dateFrom, client.firms, limit)
    .then(response => {
        //console.log(responses);
        callback({
            files: response,
            code: constants.CODE_RESPONSE_SUC
        });
    })
    .catch(err => {
        log.writet('fileDirectory:retrieveSynclist', err);
        callback({
            code: constants.CODE_RESPONSE_ERR,
            message: err.message
        });
    });
}

// call this to retrieve the share link of a file
// @param client: the requesting client
// @param data: needed to process the request
async function retrieveShareLink(client, data, callback) {
    const { uri, days = 365 } = data;
    try {
        const url = await getShareLink(uri, days);
        callback({
            link: url,
            code: constants.CODE_RESPONSE_SUC
        });
    } catch (error) {
        callback({
            message: error.message,
            code: constants.CODE_RESPONSE_ERR
        });
    }
}

// use to retrieve all firms available for device
function retrieveFirms(client, data, callback) {
    let dateFrom;
    if (data.from)
        dateFrom = new Date(data.from);
    profile.retrieveAllFirms(data.device, dateFrom)
        .then(res => callback({
            code: constants.CODE_RESPONSE_SUC,
            firms: res
        }))
        .catch(err => callback({
            message: err.message,
            code: constants.CODE_RESPONSE_ERR
        }));
}

// use to retrieve all client data available for device
function retrieveClients(client, data, callback) {
    let dateFromClient;
    let limit = 20;
    if (data.fromClient)
        dateFromClient = new Date(data.fromClient);
    if (data.limit)
        limit = data.limit;
    profile.retrieveClients(data.device, dateFromClient, limit)
        .then(res => callback({
            code: constants.CODE_RESPONSE_SUC,
            clients: res
        }))
        .catch(err => callback({
            message: err.message,
            code: constants.CODE_RESPONSE_ERR
        }));
}

// use to retrieve all  staff data available for device
function retrieveStaff(client, data, callback) {
    let from;
    let limit;
    if (data.from)
        from = new Date(data.from);
    if (data.limit)
        limit = data.limit;
    profile.retrieveStaff(data.device, from, limit)
        .then(res => callback({
            code: constants.CODE_RESPONSE_SUC,
            staff: res
        }))
        .catch(err => callback({
            message: err.message,
            code: constants.CODE_RESPONSE_ERR
        }));
}

function retrieveStaffFiles(data, callback) {
    let from;
    let limit = 20;
    if (data.limit) 
        limit = data.limit 
    if (data.from)
        from = new Date(data.from);
    cStorage.retrieveFilesbyStaff (data.device, from, limit)
        .then(res => callback({
            code: constants.CODE_RESPONSE_SUC,
            files: res
        }))
        .catch(err =>{ 
            callback({
                message: err.message,
                code: constants.CODE_RESPONSE_ERR
            });
            log.writet("fileDirectory:retrieveStaffFiles", "Error " +err)
        });
}

// use to apply firms for specific device
function applySelectedFirms(client, data, callback) {
    profile.applyFirmSelection(client, data.device, data.firms)
    callback({
        code: constants.CODE_RESPONSE_SUC
    });
}

// use to notify all listeners to this file
// called when the file was updated. this notifies the connected client
async function onFileUpdated(fileId = 0) {
    // STEP: retrieve the file info
    const file = await cStorage.retrieveMetaFileById(fileId);
    if (file !== null) {
        // STEP: correct any wrong values
        try{
            await cStorage.normalizeMetaFile(file);
        } catch(e) {
            return { code: constants.CODE_RESPONSE_ERR, message: e };
        }
        let action = 'add';
        const updatedFile = await cStorage.retrieveMetaFileById(fileId)
        // STEP: we will notify the client folder room that we updated the file
        profile.notifyWithFiles(file.client, file.personal, file.firm, constants.EVENT_FILE_DIR, {
            action: action,
            file: updatedFile
        });
        return { code: constants.CODE_RESPONSE_SUC, message: "notify success" };
    }
    return { code: constants.CODE_RESPONSE_ERR, message: 'File with id was not found.' };
}

async function reset() {
    console.log('resetting')
    await cStorage.reset();
}

module.exports = {
    init: (socket, client) => {
        client.on('reset', (callback) => {
            reset();
            callback({ code: constants.CODE_RESPONSE_SUC });
        });

        // recieve request for file directory
        client.on(constants.EVENT_FILE_DIR, (data, callback) => {
            if (db.isMigrating()) return;
            
            switch (data.action) {
                case 'files':
                    retrieveSyncList(client, data, callback);
                    break;
                // add/upload a file
                case 'add':
                    addFile(client, data, callback);
                    break;
                // delete a file
                case 'remove':
                    removeFile(client, data, callback);
                    break;
                case 'download':
                    downloadFile(client, data, callback);
                    break;
                case 'clients':
                    retrieveClients(client, data, callback);
                    break;
                case 'shareLink':
                    retrieveShareLink(client, data, callback);
                    break;
                case 'firms':
                    retrieveFirms(client, data, callback);
                    break;
                case 'staff':
                    retrieveStaff(client, data, callback);
                    break;
                case 'staff_files':
                    retrieveStaffFiles(data, callback);
                    break;
                case 'selectFirms':
                    applySelectedFirms(client, data, callback);
                    break;
                case 'dl_selection':
                    retrieveSelections(client, data, callback);
                    break;
                case 'up_selection':
                    uploadSelections(client, data, callback);
                    break;
                case 'add_dir':
                    addFile(client, data, callback);
                    break;
                default:
                    break;
            }
        });
    },
    markAsFailed: markAsFailed,
    onFileUpdated: onFileUpdated,
}