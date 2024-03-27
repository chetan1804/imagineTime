const constants = require('../constants');
const log = require('../log');
const { Storage } = require('@google-cloud/storage');
const knex = require('../db').instance;
const config = constants.DEBUG ? constants.storageDebug :
    constants.STAGING ? constants.storageStaging : constants.production;
const storage = new Storage(config);
let bucket = null;
const STAFF_DIR = "Staffs"
const GENERAL_DIR = "General"

function init() {
    getBucket().then(() => {
        log.writet('gstorage', 'Initialized google storage ', config);
    });
}

// get google bucket
async function getBucket() {
    if (bucket === null) {
        if (constants.DEBUG) {
            try {
                let meta = !constants.DEBUG ? null : {
                    location: 'US-CENTRAL1',
                    regional: true,
                }
                /*let response =*/ await storage.createBucket(constants.GSTORAGE_BUCKET, meta);
            } catch (error) {
                log.writet('gstorage', 'Cant create bucket ' + error);
            }
        }
        bucket = storage.bucket(constants.GSTORAGE_BUCKET);
        log.writet('gstorage', 'Bucket ' + constants.GSTORAGE_BUCKET);
    }
    return bucket;
}

// get file from bucket
async function getFile(storagePath = '') {
    let bucket = await getBucket();
    return bucket.file(storagePath);
}

// get file using information from database
async function getFileFromMeta(metaFile) {
    let firm, id, client;
    firm = metaFile.firm
    id = metaFile.id
    client = metaFile.client
    if (!firm && firm !== 0) firm = metaFile._firm
    if (!client && client !== 0) client = metaFile._client
    if (!id && id !== 0) id = metaFile._id

    // look for firm
    if (!firm && firm !== 0) {
        if (!client)
            throw new Error('getFileFromMeta:: _firm shouldnt be empty');
        else {
            const queryRes = await knex('clients').select('_firm').where('_id', client);
            if (queryRes.length > 0)
                firm = queryRes[0]._firm;
            else
                throw new Error('getFileFromMeta:: _firm was not found.');
        }
    }
    // STEP: file storage path
    let path = `${firm}/`;
    if (client) {
        path += `${client}/`;
    }
    path += `${id}${metaFile.fileExtension}`;
    return await getFile(path);
}

// get file via uri/relative path
async function getFileFromUri(uri) {
    const result = await knex('files').select('*').where('uri', uri);
    if (result.length === 0)
        throw 'uri ' + uri + ' cannot be found';
    return await getFileFromMeta(result[0]);
}

// get share link base from google link
async function getShareLink(uri, days = 365) {
    // These options will allow temporary read access to the file
    const options = {
        version: 'v2', // defaults to 'v2' if missing.
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * days,
    };

    // Get a v2 signed URL for the file
    const file = await getFileFromUri(uri);
    const [url] = await file.getSignedUrl(options);
    //console.log(`The signed url for ${uri} is ${url}.`);
    return url;
}

// reconstruct data for file. includes uri and size
async function retrieveFileInfo(metaFile) {
    const raw = {};
    raw.available = 0;
    raw.totalSize = 0;
    if (metaFile.category !== 'folder') {
        const file = await getFileFromMeta(metaFile);
        const exists = await file.exists();
        if (exists[0]) {
            const gmeta = await file.getMetadata();
            raw.available = gmeta[0].size;
            raw.totalSize = gmeta[0].size;
        }
        //else
        //    log.writet("cloudstorage::retrieveFileInfo", "File is not available", metaFile.id);
    }
    //    raw.status = 'deleted';
    raw.lastModified = knex.raw('updated_at');
    
    // raw uri
    let rawUri = `concat((select name from firms where _id=_firm),'\\`;
    if (metaFile.client && metaFile.client >= 0)
        rawUri += `',(select RTRIM(name, \'.\') from clients where _id=_client),'\\`;
    // this is a gemeral file
    else if (!metaFile.personal || metaFile.personal === "") {
        rawUri += GENERAL_DIR + '\\';
    // this is staff file
    } else {
        rawUri += `${STAFF_DIR}\\',`;
        rawUri += `(select concat(users.firstname, ' ', users.lastname) from staff inner join users on users._id=staff._user where staff._id=cast(files._personal as integer)),'\\`
    }

    // add parent folders to uri. this might be expensive operation for nested folders
    if (metaFile.folder) {
        let fileId = metaFile.folder
        var subfolders = ""
        do {
            const result = await knex('files')
                .where('_id', fileId)
                .select('_id as id',
                    'filename',
                    'files._folder as folder');
            if (result == null || result.length === 0 || result[0].filename == null)
                break;

            fileId = null
            subfolders = result[0].filename + `\\` + subfolders

            // yay we found another parent folder
            if ( result[0].folder){
                fileId = result[0].folder
            } else
                break;
            if (subfolders.length >= 500) {
                log.writet("cloudstorage::retrieveFileInfo", "Subfolders are too long", metaFile.id);
                subfolders = ""
                break;
            }

        } while(fileId)
        rawUri += subfolders
    }

    rawUri += `', filename)`;
    raw.uri = knex.raw(rawUri);
    return raw;
}

module.exports = {
    getBucket: getBucket,
    getFile: getFile,
    getFileFromMeta: getFileFromMeta,
    getFileFromUri: getFileFromUri,
    getShareLink: getShareLink,
    retrieveFileInfo: retrieveFileInfo,
    init: init,
}