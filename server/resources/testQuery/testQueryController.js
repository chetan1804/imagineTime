let env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
let config = require('../../config')[env];

require('dotenv').config({path: `${__dirname}/../../.env`})

const aws = require('aws-sdk');

const axios = require('axios');
let crypto = require('crypto');
let jwt = require('jsonwebtoken');

const { v4: uuidv4 } = require('uuid');

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = config.gcloud.keyPath;
const bucketName = config.gcloud.bucketName;

const fileUtils = require('../../global/utils/fileUtils')
const permissions = require('../../global/utils/permissions');
const integrationUtils = require('../../global/utils/integrationUtils');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();

const User = require('../user/UserModel');
const Firm = require('../firm/FirmModel');
const Staff = require('../staff/StaffModel');
const Client = require('../client/ClientModel');
const ClientUser = require('../clientUser/ClientUserModel');
const File = require('../file/FileModel');
const Address = require('../address/AddressModel');
const PhoneNumber = require('../phoneNumber/PhoneNumberModel');
const ShareLink = require('../shareLink/ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');
const FileActivity = require('../fileActivity/FileActivityModel');
const Activity = require('../activity/ActivityModel');
const Subscription = require('../subscription/SubscriptionModel');
const Notifications = require('../notification/NotificationModel');
const ClientActivity = require('../clientActivity/ClientActivityModel');
const ViewDownload = require('../viewdownload/ViewDownloadModel');
const ShareLinkToken = require('../shareLinkToken/ShareLinkTokenModel');
const FirmSetting = require('../firm/FirmSettingModel');
const FolderTemplate = require('../folderTemplate/FolderTemplateModel');
const FolderPermissions = require('../folderPermission/FolderPermissionModel');

const filesController = require('../file/filesController');
const activityCtrl = require('../activity/activitiesController');
const usersController = require('../user/usersController');
const staffController = require('../staff/staffController');

const mangoApi = require('../../global/utils/clientData');

const { raw } = require('objection');

const async = require('async');

let fs = require('fs');

let logger = global.logger;

const moment = require('moment');
let DateTime = require('luxon').DateTime;
const mangobilling = require('../../global/constants').mangobilling;

let passport = require('passport');

let speakeasy = require('speakeasy');
let qrcode = require('qrcode');

let appUrl = require('../../config')[process.env.NODE_ENV].appUrl;

exports.getEnvVariables = (req, res) => {
  res.send(process.env);
}

exports.customQuery = async (req, res) => {
  
}

exports.customQuery2 = async (req, res) => {

}  