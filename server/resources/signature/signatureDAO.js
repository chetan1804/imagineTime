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


const ShareLink = require('../shareLink/ShareLinkModel');
const QuickTask = require('../quickTask/QuickTaskModel');

let logger = global.logger;

const _ = require('lodash');

const { selectFields, criteriaFields, orderByFields } = require('./signatureConstants');
const { setLimits, setOrderBy, setGroupCriteria } = require('../searchUtil');

exports.search = async (searchObj, ignoreLimits=false) => {
  logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId, ', group: ', searchObj.group);
  let knexObj = ShareLink.query();
  //knexObj.joinRaw(" left join quicktasks, json_array_elements(`quicktasks`.`signingLinks`) as link on `sharelinks`.`_quickTask` = `quicktasks`.`_id`")
  knexObj.innerJoin('quicktasks', 'sharelinks._quickTask', '=', 'quicktasks._id');
  knexObj.innerJoin('users AS createdByUser', 'sharelinks._createdBy', '=', 'createdByUser._id')
  knexObj.leftJoin('clients', 'sharelinks._client', '=', 'clients._id')
  // type casting because the data type of files._personal db field is 'varchar'
  knexObj.leftJoin('users AS forUser', 'sharelinks._personal', ShareLink.raw('"forUser"."_id"::varchar(255)'));
  //.leftJoin('files', 'sharelinks._files', '=', 'files._id');

  let knexObjForCount = null;
  knexObj.where("sharelinks._firm", "=", searchObj.firmId);
  //knexObj.where("quicktasks._firm", "=", searchObj.firmId);
  setGroupCriteria(searchObj.group, knexObj, criteriaFields);
  //knexObj.whereNotNull("quicktasks.signingLinks");
  if(searchObj.includeCount) {
    knexObjForCount = knexObj.clone();
  }

  knexObj.columns(selectFields);
  //knexObj.select(db.raw("string_agg(trim(link->>'signerName'::text, ' '), ', ') as signerNames"));
  //knexObj.joinRaw(", json_array_elements(CAST(quicktasks.signingLinks as json)) as link")

  setOrderBy(searchObj.orderBy, searchObj.sortOrderAscending, knexObj, orderByFields);
  if(ignoreLimits === false) {
    setLimits(searchObj.pageSize, searchObj.pageNumber, knexObj);
  }
  logger.debug(getFileIdentifier(), knexObj.toString());
  let result = await knexObj
    .then(list => {
      return {success: true, list};
    })
    .catch((err) => {
      logger.error('Error: ', err);
      return {success: false, message: 'An internal server error occurred. Please contact support.'};
    });
  //logger.debug('signatureDAO search result after await: ', result);
  if(result.success === false) {
    return result;
  }
  //logger.debug('signatureDAO - search - Here');
  let signatures = result.list;
  signatures = signatures || [];
  signatures.forEach(signature => {
    signature['signerNames'] = getSignerNames(signature.signingLinks);
    //logger.debug(getFileIdentifier(), 'signingLinks: ', signature.signingLinks, ', signerNames: ', signature['signerNames']);
    //signature.status = (signature.status !== 'closed' && !!signature.responseDate) ? 'partially signed' : signature.status;
    delete signature.signingLinks;
  });

  if(ignoreLimits === false && searchObj.includeCount) {
    let countResult2 = await knexObjForCount.count('*').then(countResult => {
      logger.debug(getFileIdentifier(), 'Returning ' + signatures.length + ' of ' + countResult[0].count + ' rows.');
      //logger.debug(getFileIdentifier(), countResult);
      return {success: true, list:signatures, totalCount: parseInt(countResult[0].count)};
    });
    return countResult2;
  }
  else {
    logger.debug(getFileIdentifier(), 'Returning ' + signatures.length + ' rows.');
    return {success: true, list:signatures, totalCount: null};
  }
}

exports.getSignature = async (signatureId) => {
  return ShareLink.query()
  .innerJoin('quicktasks', 'sharelinks._quickTask', '=', 'quicktasks._id')
  .where('sharelinks._id', signatureId)
  .columns([
    {id:'sharelinks._id'}
    , {firmId: 'sharelinks._firm'}
    , {clientId: 'sharelinks._client'}
    , {userId: 'sharelinks._personal'}
    , {createdById: 'sharelinks._createdBy'}
    , {quickTaskId: 'sharelinks._quickTask'}
    , {createdDateTime: 'sharelinks.created_at'}
    , {updatedDateTime: 'sharelinks.updated_at'}
    , {type: 'sharelinks.type'}
    , {status: 'quicktasks.status'}
    , {taskType: 'quicktasks.type'}
    , {title: 'quicktasks.prompt'}
    , {expireDate: 'sharelinks.expireDate'}
    , {signingLinks: 'quicktasks.signingLinks'}
    , {isExpiryEmailSent: 'quicktasks.isExpiryEmailSent'}
  ])
  .first();
}

exports.delete = async (signature, callback) => {
  logger.info(getFileIdentifier(), 'delete signature id=', signature._id);
  try {
    await db.transaction(async (trx) => {

      const deleteSignature = await ShareLink.query()
      .findById(signature._id)
      .del()
      .transacting(trx)
      .returning("*");

      if(!deleteSignature._quickTask) {
        return callback({ success: true, data: {signature: deleteSignature}, message: '' });
      }

      logger.info(getFileIdentifier(), 'About to delete quick task [id: ' + deleteSignature._quickTask + '].');
      const deletedQuickTask = await QuickTask.query()
      .findById(deleteSignature._quickTask)
      .del()
      .transacting(trx)
      .returning("*");

      callback({ success: true, data: {signature: deleteSignature, quickTask: deletedQuickTask}, message: '' });
    });  
  }
  catch(error) {
    logger.error(getFileIdentifier(), error);
    callback({ success: false, message: 'Could not delete signature request. Please retry or contact support.' });
  }
}

exports.getById = (shareLinkId, callback) => {
  logger.debug(getFileIdentifier(), 'get shareLink by id');
  ShareLink.query()
  .findById(shareLinkId)
  .then(shareLink => {
    if(shareLink) {
      return callback(true, '', shareLink);
    } else {
      return callback(false, "Signature request not found", null);
    }
  });
}

function getExpiredRequestsForNotification(callback) {
  let knexObj = ShareLink.query()
  .innerJoin('quicktasks', 'sharelinks._quickTask', '=', 'quicktasks._id')
  .innerJoin('users AS createdByUser', 'sharelinks._createdBy', '=', 'createdByUser._id')
  .leftJoin('clients', 'sharelinks._client', '=', 'clients._id')
  .where(function() {
    this.whereNotNull('sharelinks.expireDate');
    this.where('sharelinks.expireDate', "<", new Date());
    this.where('quicktasks.status', 'open');
    this.where('sharelinks.type', 'signature-request');
    this.whereNot('quicktasks.isExpiryEmailSent', true);
  })
  .columns([
    {id:'sharelinks._id'}
    , {firmId: 'sharelinks._firm'}
    , {clientId: 'sharelinks._client'}
    , {userId: 'sharelinks._personal'}
    , {createdById: 'sharelinks._createdBy'}
    , {quickTaskId: 'sharelinks._quickTask'}
    , {createdDateTime: 'sharelinks.created_at'}
    , {updatedDateTime: 'sharelinks.updated_at'}
    , {type: 'sharelinks.type'}
    , {clientName: 'clients.name'}
    , {createdByFirstName: 'createdByUser.firstname'}
    , {createdByLastName: 'createdByUser.lastname'}
    , {status: 'quicktasks.status'}
    , {taskType: 'quicktasks.type'}
    , {title: 'quicktasks.prompt'}
    , {expireDate: 'sharelinks.expireDate'}
    , {signingLinks: 'quicktasks.signingLinks'}
    , {isExpiryEmailSent: 'quicktasks.isExpiryEmailSent'}
  ])
  .orderBy('sharelinks._id', 'asc', 'first')


  knexObj.asCallback((err, signatures) => {
    logger.debug(getFileIdentifier(), 'reading data');
    signatures = signatures || [];
    //logger.debug(getFileIdentifier(), 'Returning ' + signatures.length + ' signature requests.');
    return callback(signatures);
  });

}

function getRequestsForReminderNotification(maxDueDate, callback) {
  let knexObj = ShareLink.query()
  .innerJoin('firms', 'sharelinks._firm', '=', 'firms._id')
  .innerJoin('quicktasks', 'sharelinks._quickTask', '=', 'quicktasks._id')
  .innerJoin('users', 'sharelinks._createdBy', '=', 'users._id')
  .leftJoin('clients', 'sharelinks._client', '=', 'clients._id');
  let selectFieldsAll = selectFields;
  selectFieldsAll.push({firmId:'firms._id'});
  selectFieldsAll.push({firmDomain:'firms.domain'});
  selectFieldsAll.push({firmLogoUrl:'firms.logoUrl'});
  knexObj.columns(selectFieldsAll)
  .where(function() {
    this.whereNotNull('sharelinks.expireDate');
    this.where('sharelinks.expireDate', "<=", maxDueDate);
    this.where('sharelinks.expireDate', ">", new Date());
    this.where('quicktasks.status', 'open');
    
    this.where(function() {
      this.whereNull('quicktasks.isReminderEmailSent');
      this.orWhere('quicktasks.isReminderEmailSent', false);
    });
    
    this.where('sharelinks.type', 'signature-request');
  })
  .orderBy('sharelinks._id', 'asc', 'first');
  logger.debug(knexObj.toString());


  knexObj.asCallback((err, signatures) => {
    console.log('reading data');
    signatures = signatures || [];
    return callback(signatures);
  });

}

exports.getExpiredRequestsForNotification = getExpiredRequestsForNotification;
exports.getRequestsForReminderNotification = getRequestsForReminderNotification;

function getSignerNames(signingLinks) {
  return _.join(_.map(signingLinks, _.property('signerName')), ', ');
}

function getFileIdentifier() {
  return 'signatureDAO -';
}
