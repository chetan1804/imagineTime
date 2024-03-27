const ClientPost = require('./ClientPostModel');
const dbUtils = require('../../global/utils/dbUtils');

let logger = global.logger;
let db = global.db;

const { selectFields, criteriaFields, orderByFields } = require('./clientPostConstants');
const { setLimits, setOrderBy, setGroupCriteria, getColumnsList } = require('../searchUtil');

exports.search = async (searchObj) => {
  //logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId, ', group: ', searchObj.group);
  let knexObj = ClientPost.query();
  knexObj.innerJoin('clients AS client', 'clientposts._client', '=', 'client._id');
  knexObj.leftJoin('users AS createdBy', 'clientposts._createdBy', 'createdBy._id');
  if(searchObj.includeReplyCount === true) {
    knexObj.leftJoin('clientpostreplies AS replies', 'clientposts._id', 'replies._clientPost');
  }

  let knexObjForCount = null;
  knexObj.where('clientposts._firm', '=', searchObj.firmId);
  knexObj.where('client.status', '<>', 'deleted');
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
    if(searchObj.includeReplyCount === true) {
      knexObj.count({replyCount: 'replies._id'});
      knexObj.groupBy(columns.map(item => Object.values(item)[0]));
    }
  }

  setOrderBy(searchObj.orderBy, searchObj.sortOrderAscending, knexObj, orderByFields);
  if(searchObj.ignoreLimit !== true) {
    setLimits(searchObj.pageSize, searchObj.pageNumber, knexObj);
  }
  logger.debug(getFileIdentifier(), knexObj.toString());
  let clientPosts = await knexObj.then(clientPosts => clientPosts)
  .catch((err) => {
    logger.error(getFileIdentifier(), 'Error: ', err);
    return {success: false, list:[], message: 'An internal server error occurred. Please contact support.'};
  });

  clientPosts = clientPosts || [];
  
  if(searchObj.ignoreLimit !== true && searchObj.includeCount) {
    let result = await knexObjForCount.count('*').then(result => result);
    logger.debug(getFileIdentifier(), 'Returning ' + clientPosts.length + ' of ' + result[0].count + ' rows.');
    //logger.debug(result);
    return {success: true, list: clientPosts, totalCount: parseInt(result[0].count)};
  }
  else {
    logger.debug(getFileIdentifier(), 'Returning ' + clientPosts.length + ' rows.');
    return {success: true, list: clientPosts, totalCount: null};
  }
}

exports.delete = (clientPostId, callback) => {
  logger.debug(getFileIdentifier(), 'delete client post id=', clientPostId);
  ClientPost.query()
  .findById(clientPostId)
  .del()
  .returning('*')
  .asCallback((err, clientPost) => {
    if (err) {
      return callback({ success: false, message: dbUtils.translateDBErrorMessage(err, dbUtils.OPERATION_DELETE, 'client message') });
    } else {
      return callback({ success: true, data: {clientPost}, message: '' });
    }
  });
}

function getFileIdentifier() {
  return 'clientPostDAO -';
}
