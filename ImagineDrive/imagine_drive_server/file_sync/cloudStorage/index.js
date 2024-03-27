const knex = require('../db').instance;
const storage = require('./gstorage');
const { DEBUG } = require('../constants');
const { epochToKnexRaw } = require('../utils');
const log = require('../log');

async function init() {
    await storage.init();
}

// use to add metafile. return the new data
async function addMetaFile(data) {
    try {
        const files = await knex('files').select('_id').where('uri', data.uri);
        if (files.length == 0) {
            const _data = { ...data };
            // firm was not added
            if (!_data._firm) {
                _data._firm = knex.raw(
                    '(select _firm from clients where _id =' + data._client + ')');
            }
            const res = await knex('files').insert(_data).returning('*');
            return res[0];
        }
        else {
            data._id = files[0]._id;
            await updateMetaFile(data);
            return data;
        }
    } catch (error) {
        console.log(error);
    }
}

async function addFolder(uri = "", firm, client = null, staff = null) {
    const splits = uri.split('\\')
    const filename = splits[splits.length - 1]
    return await addMetaFile({
        uri: uri, 
        _firm: firm,
        _client: client, 
        _personal: staff,
        category: "folder",
        filename: filename,
    })
}

async function updateMetaFile(data) {
    try {
        await knex('files').update(data).where('uri', data.uri);
    } catch (error) {
        console.log(error);
    }
}

function updateMetaFileStatus(status, uri, epoch) {
    return updateMetaFile({
        uri: uri,
        status: status,
        updated_at: epochToKnexRaw(knex, epoch)
    });
}

// retrieve informations about the file
// rejectIFDeleted: true if want to reject if file mark as deleted
function retrieveMetaFileByUri(uri = '', rejectIfDeleted = false) {
    return new Promise(async function (resolve, reject) {
        const results = await knex('files')
            .where('uri', uri)
            .select('_id as id', '_user as uploadBy',
                '_client as client', 'uri',
                'files._firm as firm',
                'files.category',
                'available', 'totalSize', 'files.status',
                knex.raw('(extract(epoch from updated_at) * 1000) as \"updateAt\"'),
                knex.raw('(extract(epoch from \"lastModified\") * 1000) as \"lastModified\"'))
        let file;
        if (results.length >= 0)
            file = results[0];
        if (file && rejectIfDeleted && file.deleted)
            file = null;
        if (file !== null)
            resolve(file);
        else
            reject({ message: 'Meta file not found for ' + uri, 'code': 'DELETED' });
    });
}

// retrieve file data given the id. null if not found.
async function retrieveMetaFileById(fileId = 0) {
    const result = await knex('files')
        .where('_id', fileId)
        .select('_id as id', '_user as uploadBy',
            '_client as client', 'uri',
            'files._firm as firm',
            'files._personal as personal',
            'files.filename',
            'files.fileExtension',
            'files._folder as folder',
            'files.category',
            'available', 'totalSize', 'files.status',
            knex.raw('(extract(epoch from updated_at) * 1000) as \"updateAt\"'),
            knex.raw('(extract(epoch from \"lastModified\") * 1000) as \"lastModified\"'));
    if (result.length > 0)
        return result[0];
    else
        return null;
}

// retrieve file data given the id. null if not found.
async function retrieveAllFiles() {
    const result = await knex('files')
        .whereNotNull("_firm")
        .select('_id as id', '_user as uploadBy',
            '_client as client', 'uri',
            'files._firm as firm',
            'files._personal as personal',
            'files.fileExtension',
            'files._folder as folder',
            'files.category',
            'available', 'totalSize', 'files.status',
            knex.raw('(extract(epoch from updated_at) * 1000) as \"updateAt\"'),
            knex.raw('(extract(epoch from \"lastModified\") * 1000) as \"lastModified\"'));
    return result
}

// fill any missing values for file data. 
// some information may be loss due to old systems(ImagineTime).
// return true if normal
async function normalizeMetaFile(fileMeta = {}) {
    // if data is fine then skip
    if (fileMeta.uri !== null && 
        fileMeta.uri !== undefined && 
        fileMeta.uri !== "") {
        const lastI = fileMeta.uri.lastIndexOf(fileMeta.filename)
        // issue found on filename is not related to uri. this means that it was renamed outside the drive system.
        // fix this
        // filename is part of uri?
        if (lastI === fileMeta.uri.length - fileMeta.filename.length) 
            return true;
    }
    try {
        const fileInfo = await storage.retrieveFileInfo(fileMeta);
        //fileInfo.updated_at = knex.raw("now() at time zone 'utc'")
        await knex('files')
            .where('_id', fileMeta.id)
            .update(fileInfo)
            .catch(err => { log.writet('CloudStorage::normalizeMetaFile', "ERROR", err) });
    } catch (e) {
        log.writet('CloudStorage::normalizeFileMeta', 'ERROR!', e);
        //throw e
    }
    return false
}

function moveFile(username, data) {

}

// mark the file as deleted. not actual deleting the record
function deleteFile(path, timeEpoch) {
    return new Promise(async function (resolve, reject) {
        const deletedCount = await knex('files')
            .update({
                status: 'archived',
                updated_at: epochToKnexRaw(knex, timeEpoch)
            })
            .where('uri', path);
        if (deletedCount > 0) {
            const updatedFile = await retrieveMetaFileByUri(path);
            resolve(updatedFile);
        }
        else
            reject('file couldnt be found');
    });
}

async function reset() {
    if (DEBUG)
        await knex('files').truncate()
}

// retrieve files of current users. general ang clients
// @includeDeleted: true if include deleted files to query
async function retrieveFiles(deviceId, fromDate = null, firms=null, limit = 20, includeDeleted = true) {
    let query = null;

    // retrieve all files based from client
    if (!firms || firms.length === 0) {
        query = knex('files')
        .select(
            knex.raw('distinct on (files._id, files.updated_at) files._id as id'),
            'files._user as uploadBy',
            'files._client as client', 
            'files._firm as firm',
            'files.category',
            'files.uri',
            '_personal as personal',
            'available', 'totalSize', 'files.status',
            knex.raw('(extract(epoch from files.updated_at) * 1000) as \"updateAt\"'),
            knex.raw('(extract(epoch from files.\"lastModified\") * 1000) as \"lastModified\"'))
        .innerJoin('staff', 'staff._firm', 'files._firm')
        .innerJoin('syncdevice', 'syncdevice.user', 'staff._user')
        .leftJoin('clients', 'files._client', 'clients._id')
        .where( _knex => 
            _knex.whereNull('files._personal')
            .orWhere('files._personal', '=', '')
            .orWhere('files._personal', '=', '-1') 
        )
        .andWhere('syncdevice.deviceId', deviceId)
        //.andWhere('files._firm', 110)
        .andWhere( _knex => 
            _knex.whereNull('clients.status')
            .orWhere('clients.status', 'visible')
        )
        .limit(limit)
        .orderBy('files.updated_at');
    }
    // retrieve based from firms
    else {
        query = knex('files')
        .select('files._id as id', 
            'files._user as uploadBy',
            'files._firm as firm',
            'files._client as client',
            'files._personal as personal', 
            'files.category',
            'files.uri',
            'available', 'totalSize', 'files.status',
            knex.raw('(extract(epoch from files.updated_at) * 1000) as \"updateAt\"'),
            knex.raw('(extract(epoch from files.\"lastModified\") * 1000) as \"lastModified\"'))
        .whereIn('files._firm', firms)
        .limit(limit)
        .orderBy('files.updated_at');
    }

    if (fromDate) 
        query = query.andWhere('files.updated_at', '>', fromDate);
    // this is initial query. ignore archived and deleted
    if (!fromDate || !includeDeleted)
        query = query.andWhereNot('files.status', 'archived')
            .andWhereNot('files.status', 'deleted'); 
    //query.andWhere('files._client', 100)
    //console.log(query.toString());
    //console.log(fromDate)
    const results = await query;
    // normalize all results
    // var i = 0;
    // for (const meta of results) {
    //     try {
    //         const normal = await normalizeMetaFile(meta)
    //         if (!normal)
    //             results[i] = await retrieveMetaFileById(meta.id)
    //     }catch (e) {
    //         console.log(e)
    //     }
    //     i++;
    // }
    return results;
}

async function retrieveFilesbyStaff(deviceId, from = null, limit = 20) {
    let query = knex('files')
        .select(
            'files._id as id', 
            'files._user as uploadBy',
            'files._firm as firm',
            'files._client as client', 
            'files._personal as personal', 
            'files.category',
            'uri',
            'available', 'totalSize', 'files.status',
            knex.raw('(extract(epoch from files.updated_at) * 1000) as \"updateAt\"'),
            knex.raw('(extract(epoch from files.\"lastModified\") * 1000) as \"lastModified\"'))
        .innerJoin('syncdevice', 'syncdevice.user', knex.raw('cast(files._personal as int)'))
        .innerJoin('staff', knex.raw('staff._id::varchar'), 'files._personal')
        .where('syncdevice.deviceId', '=', deviceId)
        .andWhere('files._personal', '!=', '' )
        .andWhere('staff.status', 'active')
        .orderBy('files.updated_at')
        .limit(limit);
    if (from) 
        query = query.andWhere('files.updated_at', '>', from);
    
    const results = await query
    // normalize all results
    var i = 0;
    for (const meta of results) {
        try {
            const normal = await normalizeMetaFile(meta)
            if (!normal)
                results[i] = await retrieveMetaFileById(meta.id)
        }catch (e) {}
        i++;
    }
    return results;
}

module.exports = {
    addMetaFile: addMetaFile,
    addFolder: addFolder,
    updateMetaFile: updateMetaFile,
    updateMetaFileStatus: updateMetaFileStatus,
    normalizeMetaFile: normalizeMetaFile,
    moveFile: moveFile,
    deleteFile: deleteFile,
    retrieveFiles: retrieveFiles,
    retrieveMetaFile: retrieveMetaFileByUri,
    retrieveMetaFileById: retrieveMetaFileById,
    retrieveFilesbyStaff: retrieveFilesbyStaff,
    retrieveAllFiles: retrieveAllFiles,
    reset: reset,
    init: init
}