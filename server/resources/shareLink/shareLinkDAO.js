/**
 * Sever-side controllers for ShareLink.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ShareLink
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ShareLink = require('./ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');
const File = require('../file/FileModel');

let logger = global.logger;

const _ = require('lodash');

const { selectFields, criteriaFields, orderByFields } = require('./shareLinkConstants');
const { setLimits, setOrderBy, setGroupCriteria } = require('../searchUtil');

exports.search = async (searchObj, ignoreLimits=false) => {
  logger.debug('firmId: ', searchObj.firmId, ', group: ', searchObj.group);
  let knexObj = ShareLink.query();
  knexObj.innerJoin('users', 'sharelinks._createdBy', '=', 'users._id')
  knexObj.leftJoin('quicktasks', 'sharelinks._quickTask', '=', 'quicktasks._id');
  knexObj.leftJoin('clients', 'sharelinks._client', '=', 'clients._id')
  //.leftJoin('files', 'sharelinks._files', '=', 'files._id');

  let knexObjForCount = null;
  knexObj.where('sharelinks._firm', '=', searchObj.firmId);
  setGroupCriteria(searchObj.group, knexObj, criteriaFields);
  if(searchObj.includeCount) {
    knexObjForCount = knexObj.clone();
  }

  knexObj.columns(selectFields);

  setOrderBy(searchObj.orderBy, searchObj.sortOrderAscending, knexObj, orderByFields);
  if(!ignoreLimits) {
    setLimits(searchObj.pageSize, searchObj.pageNumber, knexObj);
  }
  logger.debug(knexObj.toString());
  let shareLinks = await knexObj.then(shareLinks => shareLinks);
  shareLinks = shareLinks || [];
  await fillFileInfo(shareLinks);
  if(ignoreLimits === false && searchObj.includeCount) {
    let result = await knexObjForCount.count('*').then(result => result);
    logger.info('shareLinkDAO - Returning ' + shareLinks.length + ' of ' + result[0].count + ' share links.');
    //logger.info(result);
    return {success: true, list: shareLinks, totalCount: parseInt(result[0].count)};
  }
  else {
    logger.info('shareLinkDAO - Returning ' + shareLinks.length + ' share links.');
    return {success: true, list: shareLinks, totalCount: null};
  }
}

exports.delete = (shareLink, callback) => {
  // TODO delete both records in a transaction
  logger.info('delete shareLink id=', shareLink._id);
  ShareLink.query()
  .findById(shareLink._id)
  .del()
  .returning('*')
  .asCallback((err, shareLink) => {
    if (err) {
      return callback({ success: false, message: err });
    } else {
      if(shareLink._quickTask) {
        logger.info('About to delete quick task [id: ' + shareLink._quickTask + '].');
        QuickTask.query()
        .findById(shareLink._quickTask)
        .del()
        .returning('*')
        .asCallback((err, quickTask) => {
          if (err) {
            return callback({ success: false, message: err });
          }
          else {
            return callback({ success: true, data: {shareLink, quickTask}, message: '' });
          }
        });
      }
      else {
        return callback({ success: true, data: {shareLink}, message: '' });
      }
    }
  });
}

exports.getById = (shareLinkId, callback) => {
  logger.info('get shareLink by id');
  ShareLink.query()
  .findById(shareLinkId)
  .then(shareLink => {
    if(shareLink) {
      return callback(true, '', shareLink);
    } else {
      return callback(false, 'Share link not found', null);
    }
  });
}

function getExpiredRequestsForNotification(callback) {
  let knexObj = ShareLink.query()
  .innerJoin('users', 'sharelinks._createdBy', '=', 'users._id')
  .leftJoin('quicktasks', 'sharelinks._quickTask', '=', 'quicktasks._id')
  .leftJoin('clients', 'sharelinks._client', '=', 'clients._id')
  .columns(selectFields)
  .where(function() {
    this.whereNotNull('sharelinks.expireDate');
    this.where('sharelinks.expireDate', '<', new Date());
    //this.where('quicktasks.status', 'open');
    this.where('sharelinks.type', 'share');
  })
  .columns([
    {id:'sharelinks._id'}
    , {clientId: 'sharelinks._client'}
    , {userId: 'sharelinks._personal'}
    , {createdById: 'sharelinks._createdBy'}
    , {quickTaskId: 'sharelinks._quickTask'}
    , {createdDateTime: 'sharelinks.created_at'}
    , {updatedDateTime: 'sharelinks.updated_at'}
    , {type: 'sharelinks.type'}
    , {clientName: 'clients.name'}
    , {createdByFirstName: 'users.firstname'}
    , {createdByLastName: 'users.lastname'}
    , {status: 'quicktasks.status'}
    , {taskType: 'quicktasks.type'}
    , {title: 'quicktasks.prompt'}
    , {expireDate: 'sharelinks.expireDate'}
    , {signingLinks: 'quicktasks.signingLinks'}
  ])
  .orderBy('sharelinks._id', 'asc', 'first');


  knexObj.asCallback((err, shareLinks) => {
    console.log('reading data');
    shareLinks = shareLinks || [];
    //logger.info('shareLinkDAO - Returning ' + shareLinks.length + ' shareLinks requests.');
    return callback(shareLinks);
  });

}

async function fillFileInfo(shareLinks) {
  const fileIds = getFileIds(shareLinks);
  const fileInfoMap = await getFileInfoMap(fileIds);
  //logger.debug(fileNamesMap);
  shareLinks.forEach(function(shareLink, index, array) {
    let fileNames = [];
    let fileStatuses = [];
    if(!!shareLink.files && shareLink.files.length > 0) {
      shareLink.files.forEach(function(fileId) {
        let fileObj = fileInfoMap['abc_' + fileId];
        //logger.debug('fileInfo for id', fileId, 'is', fileObj);
        fileNames.push(fileObj.filename);
        fileStatuses.push(fileObj.status);
      });
      //logger.debug('shareLinkId:', shareLink.id, 'fileIds:', shareLink.files, 'fileNames:', fileNames);
      array[index]['fileNames'] = fileNames;
      array[index]['fileStatuses'] = fileStatuses;
    }
  });
}

async function getFileInfoMap(fileIds) {
  let knexObj = File.query();
  knexObj.whereIn('files._id', fileIds);
  knexObj.columns(['_id', 'filename', 'status']);
  logger.debug(knexObj.toString());
  let files = await knexObj.then(files => files).catch(err => null);

  let fileNamesMap = {};
  files.forEach(function(file) {
    let fileObj = {filename: file.filename, status: file.status};
    fileNamesMap['abc_' + file._id] = fileObj;
  });
  return fileNamesMap;
}

function getFileIds(shareLinks) {
  var fileIds = [];
  shareLinks.forEach(function(shareLink) {
    if(!!shareLink.files && shareLink.files.length > 0) {
      fileIds.push(...shareLink.files);
    }
  });
  return fileIds;
}

exports.getExpiredRequestsForNotification = getExpiredRequestsForNotification;
