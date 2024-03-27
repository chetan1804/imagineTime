const { getFileFromMeta } = require('../cloudStorage/gstorage');
const { updateMetaFile, addMetaFile, retrieveMetaFile, addFolder } = require('../cloudStorage/index');
const { Readable, finished } = require('stream');
const { GSTORAGE_BUCKET } = require('../constants');
const { getFileCategory, getContentType, epochToKnexRaw, getParentType } = require('../utils');
const { markAsFailed } = require('./fileDirectory');
const udid = require('uuid');
const log = require('../log');
const knex = require('../db').instance;


// use to retrieve the parent folder create if not yet existed.
// return null if no parent
async function findParentFolder(fileInfo) {
    // retrieve parent folder
    const parent = getParentType(fileInfo.client, fileInfo.personal, fileInfo.firm)
    let folderUri = null
    const splitteduri = fileInfo.uri.split('\\')
    switch (parent) {
        case "client":
        case "general":
            if (splitteduri.length > 3) {
                const lastI = fileInfo.uri.lastIndexOf('\\')
                folderUri = fileInfo.uri.substring(0, lastI)
            }
            break
        case "staff":
            if (splitteduri.length > 4) {
                const lastI = fileInfo.uri.lastIndexOf('\\')
                folderUri = fileInfo.uri.substring(0, lastI)
            }
            break
    }

    if (folderUri != null) {
        const res = await addFolder(folderUri, fileInfo.firm, fileInfo.client, fileInfo.personal)
        return res._id
    }
    return null
}

// create data for record saving
function createRecordData(socket, fileInfo) {
    const splitteduri = fileInfo.uri.split('\\')
    const splittedName = splitteduri[splitteduri.length - 1]
        .split('.');
    const isFolder = fileInfo.category === 'folder'
    let extension = '' 
    if (!isFolder) 
        extension = '.' + splittedName[1];
    const url = `https://www.googleapis.com/storage/v1/b/${GSTORAGE_BUCKET}/o/${udid.v1() + '.' + extension}`;
    let personal = fileInfo.personal
    
    if ( personal && !isNaN(personal))
        personal = personal.toString();
    if (personal ==='-1')
        personal = null
    return {
        _user: fileInfo.uploadBy ? fileInfo.uploadBy : socket.userId,
        rawUrl: url,
        available: 0,
        filename: splittedName[0] + extension,
        fileExtension: extension,
        category: !isFolder ? getFileCategory(fileInfo.uri): 'folder',
        contentType: !isFolder ? getContentType(fileInfo.uri):null,
        _client: fileInfo.client,
        _firm: fileInfo.firm,
        uri: fileInfo.uri,
        totalSize: fileInfo.totalSize,
        _folder: fileInfo.folder,
        _personal: personal,
        lastModified: epochToKnexRaw(knex, fileInfo.lastModified),
        updated_at: epochToKnexRaw(knex, fileInfo.updateAt),
        status: 'visible',
    }
}

async function createUploadStream(socket_client, fileInfo) {
    const uri = fileInfo.uri;
    const offset = fileInfo.available > 0 ? fileInfo.available - 1 : 0;
    // flag to when update metadata during upload operation
    let percentToUpdate = 0;
    const updatePoints = 1.0 / 2.0;
    let metaUpdated = false;
    let conflictFound = false; // true if has conflict with other operations
    fileInfo.folder = await findParentFolder(fileInfo);
    let metaFile = createRecordData(socket_client, fileInfo);

    log.writet('fileUploadStream', '-----------initiating ' + uri);
    // update database for the new file
    metaFile = await addMetaFile(metaFile);

    // step: if this is directory. skip for streaming
    if (metaFile.category === 'folder') return

    // tell other clients that theres a file that was been uploaded
    // initialize google upload stream
    const file = await getFileFromMeta(metaFile);
    const writeStream = file.createWriteStream({ resumable: false });
    const readable = new Readable();
    const session = require('./sessionManager');

    // callback when finished uploading
    let uploadStream;
    let uploadedBytes = offset;

    // start reading google storage file
    readable.pipe(writeStream);
    readable._read = () => { };  // this is required
    readable.on('error', (error) => {
        if (uploadStream)
            uploadStream.error(error);
    });

    // initialize streaming
    uploadStream = session.create(true, {
        uri: uri,
        updateAt: fileInfo.updateAt,
        //tag: 'fileUploadStream',
        client: socket_client,
        onFinished: async (_data) => {
            uploadStream = null;
            // update the file data with the new size
            if (!conflictFound)
                await updateMetaFile({ uri: uri, available: uploadedBytes });
            readable.push(null);
            finished(readable, err => {
                if (err) console.log(err);
            } )
            //console.log('Finished upload ', uri)
        },
        onUploaded: async (data) => {
            const binary = Buffer.from(data.data, 'base64');
            readable.push(binary);
            uploadedBytes += binary.length;
            // is it okay to update the meta of files?
            const uploadedPercent = uploadedBytes / fileInfo.totalSize;
            if (!metaUpdated && percentToUpdate <= uploadedPercent) {
                // notify clients for new available bytes
                uploadStream.transmitToSharedStream(
                    'updated_size', 
                    { datasize: uploadedBytes },
                    fileInfo.client,
                    fileInfo.personal, 
                    fileInfo.firm,
                    );
                log.writet(uri, 'uploading ' + uploadedPercent);
                percentToUpdate += updatePoints;
                metaUpdated = false;
                await updateMetaFile({ uri: uri, available: uploadedBytes });
            }
        },
        // this was left behind. happend when client terminated cant reconnect
        onTimeout: (_) => {
            retrieveMetaFile(uri)
                .then(file => {
                    const uploadedPercent = file.available / file.totalSize;
                    if (file.updateAt === fileInfo.updateAt &&
                        uploadedPercent < 1) {
                        uploadStream.onFailure();
                        markAsFailed(socket_client, file, true);
                    }
                    else
                        uploadStream.finishWithTimeout();
                });
        }
    });
    return uploadStream.sessionId;
}
module.exports = {
    createUploadStream: createUploadStream
}