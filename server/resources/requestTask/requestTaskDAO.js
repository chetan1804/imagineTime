const RequestTaskModel = require('./RequestTaskModel');
const TaskActivityModel = require('../taskActivity/TaskActivityModel');
const dbUtils = require('../../global/utils/dbUtils');

let logger = global.logger;
let db = global.db;

const { selectFields, criteriaFields, orderByFields } = require('./requestTaskConstants');
const { setLimits, setOrderBy, setGroupCriteria, getColumnsList } = require('../searchUtil');

exports.search = async (searchObj) => {
  logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId, ', group: ', searchObj.group);
  let knexObj = RequestTaskModel.query();
  knexObj.innerJoin('users AS createdByUser', 'requesttask._createdBy', 'createdByUser._id');
  knexObj.innerJoin('request AS requestList', 'requesttask._request', 'requestList._id');
  //knexObj.leftJoin('users AS forUser', 'requestList._personal', 'forUser._id');
  knexObj.leftJoin('clients AS requestClient', 'requestList._client', '=', 'requestClient._id');

  let knexObjForCount = null;
  knexObj.where('requestList._firm', '=', searchObj.firmId);
  knexObj.where(builder => {
    builder.whereNull('requestClient._id')
    .orWhere('requestClient.status', '<>', 'deleted');
  });
  setGroupCriteria(searchObj.group, knexObj, criteriaFields);

  if(searchObj.includeCount) {
    knexObjForCount = knexObj.clone();
  }

  let columns = getColumnsList(searchObj.columns, selectFields);
  if(searchObj.distinct === true) {
    knexObj.distinct(columns);
  }
  else {
    knexObj.columns(columns);
  }

  setOrderBy(searchObj.orderBy, searchObj.sortOrderAscending, knexObj, orderByFields);
  if(searchObj.ignoreLimit !== true) {
    setLimits(searchObj.pageSize, searchObj.pageNumber, knexObj);
  }
  logger.debug(getFileIdentifier(), knexObj.toString());
  let requestTasks = await knexObj
  .then(requestTasks => requestTasks)
  .catch((err) => {
    logger.error(getFileIdentifier(), '- search -', err);
    return {success: false, list:[], message: 'An internal server error occurred. Please contact support.'};
  });
  requestTasks = requestTasks || [];

  if(searchObj.ignoreLimit !== true && searchObj.includeCount) {
    let result = await knexObjForCount.count('*').then(result => result);
    logger.debug(getFileIdentifier(), 'Returning ' + requestTasks.length + ' of ' + result[0].count + ' request list tasks.');
    //logger.info(result);
    return {success: true, list: requestTasks, totalCount: parseInt(result[0].count)};
  }
  else {
    logger.debug(getFileIdentifier(), 'Returning ' + requestTasks.length + ' request list tasks.');
    return {success: true, list: requestTasks, totalCount: null};
  }
}

exports.delete = (requestTaskId, callback) => {
  logger.debug('delete request list task id=', requestTaskId);
  // TODO Any emails to be sent?
  TaskActivityModel.query()
  .where('_requestTask', requestTaskId)
  .del()
  .then(result => {
    RequestTaskModel.query()
    .findById(requestTaskId)
    .del()
    .returning('*')
    .asCallback((err, requestTask) => {
      if (err) {
        return callback({ success: false, message: dbUtils.translateDBErrorMessage(err, dbUtils.OPERATION_DELETE, 'request list task') });
      } else {
        return callback({ success: true, data: {requestTask}, message: '' });
      }
    });
  })
  .catch(err => {
    return callback({ success: false, message: dbUtils.translateDBErrorMessage(err, dbUtils.OPERATION_DELETE, 'task activity') });
  });
}

exports.getById = (requestTaskId, callback) => {
  logger.debug(getFileIdentifier(), 'get request list task by id');
  RequestTaskModel.query()
  .findById(requestTaskId)
  .then(requestTask => {
    if(requestTask) {
      return callback(true, '', requestTask);
    } else {
      return callback(false, 'Request list task not found', null);
    }
  });
}

function getFileIdentifier() {
  return 'requestTaskDAO -';
}
