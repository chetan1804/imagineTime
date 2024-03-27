const DEBUG = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
const STAGING = process.env.STAGING === 'true';
const LATEST_VERSION = process.env.LATEST_VERSION || '0.8.0'

module.exports = {
    'DEBUG': DEBUG, // true if development mode
    'STAGING': STAGING, // true if this is not production
    'GSTORAGE_BUCKET': DEBUG ? 'it-fugi-dev6' :
        (STAGING ? 'it-fugi-demo' : 'it-fugi-prod'),
    "EVENT_FILE_DIR": 'FILE_DIR',
    'EVENT_FILE_UPLOAD': 'FILE_UPLOAD',
    'EVENT_FILE_DL': 'FILE_DL',
    'EVENT_AUTH': 'AUTH',
    'EVENT_REAUTH': 'REAUTH',
    'CODE_RESPONSE_ERR': 400,
    'CODE_RESPONSE_SUC': 200,
    'LATEST_VERSION': LATEST_VERSION,
    dbDebug: {
        host: 'localhost',
        user: 'postgres',
        password: 'TIMEzone2008',
        database: 'sample_db',
        port: 3306
    },
    dbStage: {
        host: '10.87.192.5',
        user: 'postgres',
        password: 'xrssP6DpdjzkppvD',
        database: 'imaginetime'
    },
    dbProd: {
        host: '10.87.192.7',
        user: 'postgres',
        password: 'mFC15Nyzhqjt0zqB',
        database: 'imaginetime'
    },
    storageDebug: {
        projectId: 'api-project-281990563846',
        keyFilename: '../files/google_storage_key.json'
    },
    storageStaging: {
        projectId: 'itweb-250314',
        keyFilename: 'gcloud_key.json'
    },
    storageProduction: {
        projectId: 'itweb-250314',
        keyFilename: 'gcloud_key.json'
    }
};