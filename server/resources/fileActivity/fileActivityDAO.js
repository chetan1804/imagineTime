const FileActivity = require('./FileActivityModel');
const stringUtils = require('../../global/utils/stringUtils.js');
let logger = global.logger;

const _ = require('lodash');

const { selectFields, criteriaFields, orderByFields } = require('./fileActivityConstants');
const { setLimits, setOrderBy, setGroupCriteria, getColumnsList } = require('../searchUtil');

exports.search = async (searchObj) => {
  logger.debug('firmId: ', searchObj.firmId, ', group: ', searchObj.group);
  let knexObj = FileActivity.query();
  knexObj.innerJoin('files', 'file_activities._file', '=', 'files._id');
  knexObj.leftJoin('users AS activityUser', 'file_activities._user', 'activityUser._id');
  knexObj.leftJoin('clients AS activityClient', 'file_activities._client', '=', 'activityClient._id');
  //knexObj.leftJoin('users AS fileCreatedByUser', 'files._user', 'fileCreatedByUser._id');
  // type casting because the data type of files._personal db field is 'varchar'
  //knexObj.leftJoin('users AS fileUser', 'files._personal', FileActivity.raw(''fileUser'.'_id'::varchar(255)'));

  let knexObjForCount = null;
  knexObj.where('file_activities._firm', '=', searchObj.firmId);
  //knexObj.whereNotNull('files.filename');
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
  let fileActivities = await knexObj
  .then(fileActivities => fileActivities)
  .catch((err) => {
    logger.error(getFileIdentifier(), 'Error: ', err);
    return {success: false, list:[], message: 'An internal server error occurred. Please contact support.'};
  });
  fileActivities = fileActivities || [];
  
  //logger.debug('About to call function to replace place holders.');
  await replacePlaceHolders(fileActivities).then(array => array);
  //logger.debug('Place holders replaced');

  if(searchObj.ignoreLimit !== true && searchObj.includeCount) {
    let result = await knexObjForCount.count('*').then(result => result);
    logger.debug(getFileIdentifier(), 'Returning ' + fileActivities.length + ' of ' + result[0].count + ' file activities.');
    //logger.info(result);
    return {success: true, list: fileActivities, totalCount: parseInt(result[0].count)};
  }
  else {
    logger.debug(getFileIdentifier(), 'Returning ' + fileActivities.length + ' file activities.');
    return {success: true, list: fileActivities, totalCount: null};
  }
}

async function replacePlaceHolders(list) {
  return _.forEach(list, (item) => {
    if(!!item.activityText) {
      //logger.debug('About to replace place holders for text: ', item.activityText, ', User Name: ', getFullName(item.userFirstName, item.userLastName), ', Client Name: ', item.clientName);
      item.activityText = item.activityText.replace('%USER%', stringUtils.concatenate(item.userFirstName, item.userLastName, ' ', true));
      item.activityText = item.activityText.replace('%CLIENT%', item.clientName);
      //logger.debug('place holders replaced. New text : ', item.activityText);
    }
  });
}

function getFileIdentifier() {
  return 'requestTaskDAO -';
}
