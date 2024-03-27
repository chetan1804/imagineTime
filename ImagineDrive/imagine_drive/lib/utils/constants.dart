// true if connect to remote file server instead of using local
const ACCESS_REMOTE = true;
const VERSION = "0.8.0";
const FILESYNC_SERVER = ACCESS_REMOTE
    ? 'https://itweb-250314.uc.r.appspot.com'
    : 'http://localhost:3000';
const IMAGINETIME_WEB = 'https://www.imaginetime.com';
const CACHE_DIR = ".cache";
const DRIVE_DESCRIPTION = "Imagine Share";
const DEFAULT_MOUNT_DRIVE = "g:";
const DEFAULT_UPLOAD_MB = 0.5; // upload size in MB
// the time it takes before downloading will timeout if nothing was recieved from server in seconds.
const DOWNLOAD_SERVER_TIMEOUT = 20;

// ----------------------------------------------------------------
// SOCKET EVENTS
// ----------------------------------------------------------------
const SOC_EVENT_FILE_DIR = 'FILE_DIR';
const SOC_EVENT_UPLOAD = 'FILE_UPLOAD';
const SOC_EVENT_DL = 'FILE_DL';
const SOC_EVENT_AUTH = 'AUTH';
const SOC_EVENT_REAUTH = 'REAUTH';

// ----------------------------------------------------------------
// RESPONSE CODE
// ----------------------------------------------------------------
const RESPONSE_SUCCESS = 200;

// FILE ATTRIB
const FILE_ATTRIBUTE_HIDDEN = 2;
const FILE_ATTRIBUTE_NORMAL = 128;
const GENERAL_DIR = "General";
const STAFF_DIR = "Staffs";
const CLIENTS_DIR = "Clients";

//----------------------------------------------------------------
const FILE_DELETED = "archived";
