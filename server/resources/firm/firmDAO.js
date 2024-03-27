/**
 * DAO class for Firm and FirmSetting entities
 */


const Firm = require('./FirmModel');
const FirmSetting = require('./FirmSettingModel');

const _ = require('lodash');
const { raw } = require('objection');

let logger = global.logger;

exports.getFirm = async (firmId) => {
  return Firm.query()
  .where('_id', firmId);
}

exports.getSettings = async (firmId) => {
  let firmQuery = Firm.query()
  .where('_id', firmId);

  let firmSettingQuery = FirmSetting.query()
  .where('_firm', firmId);

  let results = await Promise.all([firmQuery, firmSettingQuery]);

  let firmSettings = (!!results[1] && !!results[1].length ? results[1][0] : {});
  firmSettings = getSettingsObject(results[0][0], firmSettings);
  //logger.debug(getFileIdentifier(), 'getSettings - about to return:', firmSettings);
  return firmSettings;
}

exports.createOrUpdateSettings = async (firmSettings) => {
  if(!firmSettings || !firmSettings._firm) {
    throw new Error('invalid request');
  }

  const savedFirmSettings = await exports.getSettings(firmSettings._firm);
  firmSettings._id = savedFirmSettings._id;

  let firmQuery = Firm.query()
  .findById(firmSettings._firm)
  .update({
    archiveFile: firmSettings.archiveFile
    , expireLinks: firmSettings.expireLinks
    , authDefault: firmSettings.authDefault
    , secretQuestions: firmSettings.secretQuestions
    , allowCreateFolder: firmSettings.allowCreateFolder
    , allowDeleteFiles: firmSettings.allowDeleteFiles
    , zipFilesDownload: firmSettings.zipFilesDownload
    , tcFileAccess: firmSettings.tcFileAccess
    , tcContents: firmSettings.tcContents
    , showNewLabel: firmSettings.showNewLabel
    , showCompany: firmSettings.showCompany
    , showEmail: firmSettings.showEmail
    , allowRenameFiles: firmSettings.allowRenameFiles
    , allowMoveFiles: firmSettings.allowMoveFiles
    , fileVersionType: firmSettings.fileVersionType
    , default_file_status: firmSettings.default_file_status
    , allowAddRecipientFileRequest: firmSettings.allowAddRecipientFileRequest
    , enable_pdftron: firmSettings.enable_pdftron
    , allowRequiredRecipient: firmSettings.allowRequiredRecipient
  })
  .returning('*');

  let firmSettingQuery = !!firmSettings._id ? updateSettings(firmSettings) : insertSettings(firmSettings);

  let results = await Promise.all([firmQuery, firmSettingQuery]);

  firmSettings = getSettingsObject(results[0], results[1]);

  logger.debug(getFileIdentifier(), 'createOrUpdateSettings - about to return:', firmSettings);

  return firmSettings;
}

exports.getFirmsWithSelectedColumn = (columns = ['f.*']) => {
  return Firm.query()
    .from('firms as f')
    .leftJoin('folderpermission as fp', 'fp._firm', 'f._id')
    .select([...columns, raw('row_to_json(fp) as permission')])
    .where({
      'fp._client': null,
      'fp._folder': null
    })
}

function getSettingsObject (firm, firmSettings) {
  if(!firmSettings._id) {
    firmSettings._firm = firm._id;
    firmSettings.email_useLoggedInUserInfo = true;
    firmSettings.email_fromName = null;
    firmSettings.email_replyTo = null;
  }
  
  firmSettings = {
    ...firmSettings
    , archiveFile: firm.archiveFile
    , expireLinks: firm.expireLinks
    , authDefault: firm.authDefault
    , secretQuestions: firm.secretQuestions
    , allowCreateFolder: firm.allowCreateFolder
    , allowDeleteFiles: firm.allowDeleteFiles
    , zipFilesDownload: firm.zipFilesDownload
    , tcFileAccess: firm.tcFileAccess
    , tcContents: firm.tcContents
    , showNewLabel: firm.showNewLabel
    , showCompany: firm.showCompany
    , showEmail: firm.showEmail
    , allowRenameFiles: firm.allowRenameFiles
    , allowMoveFiles: firm.allowMoveFiles
    , fileVersionType: firm.fileVersionType
    , default_file_status: firm.default_file_status
    , allowAddRecipientFileRequest: firm.allowAddRecipientFileRequest
    , enable_pdftron: firm.enable_pdftron
    , allowRequiredRecipient: firm.allowRequiredRecipient
  };

  return firmSettings;
}

function insertSettings(firmSettings) {
  let settingsOnlyObj = {
    _firm: firmSettings._firm
    , email_useLoggedInUserInfo: firmSettings.email_useLoggedInUserInfo
    , email_fromName: firmSettings.email_fromName
    , email_replyTo: firmSettings.email_replyTo
  };

  return FirmSetting.query()
  .insert(settingsOnlyObj)
  .returning('*');
}

function updateSettings(firmSettings) {
  let settingsOnlyObj = {
    email_useLoggedInUserInfo: firmSettings.email_useLoggedInUserInfo
    , email_fromName: firmSettings.email_fromName
    , email_replyTo: firmSettings.email_replyTo
  };

  return FirmSetting.query()
  .findById(firmSettings._id)
  .update(settingsOnlyObj)
  .returning('*');
}

function getFileIdentifier() {
  return 'firmDAO -';
}
