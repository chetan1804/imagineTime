const NoteModel = require('./NoteModel');
const File = require('../file/FileModel');
const Client = require('../client/ClientModel');
const User = require('../user/UserModel');

let logger = global.logger;
let db = global.db;

const { selectFields, criteriaFields, orderByFields } = require('./noteConstants');
const { setLimits, setOrderBy, setGroupCriteria } = require('../searchUtil');

exports.search = async (searchObj, ignoreLimits=false) => {
  logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId, ', group: ', searchObj.group);
  let knexObj = NoteModel.query();
  knexObj.innerJoin('files', 'notes._file', '=', 'files._id');
  knexObj.leftJoin('users AS noteUser', 'notes._user', 'noteUser._id');
  knexObj.leftJoin('clients AS noteClient', 'notes._client', '=', 'noteClient._id');
  //knexObj.leftJoin('users AS fileCreatedByUser', 'files._user', 'fileCreatedByUser._id');
  // type casting because the data type of files._personal db field is 'varchar'
  //knexObj.leftJoin('users AS fileUser', 'files._personal', NoteModel.raw('"fileUser"."_id"::varchar(255)'));

  let knexObjForCount = null;
  knexObj.where('notes._firm', '=', searchObj.firmId);
  knexObj.whereIn('files.status', ['visible', 'locked', 'archived']);
  knexObj.where(builder => {
    builder.whereNull('noteClient.status')
    .orWhere('noteClient.status', '<>', 'deleted');
  });
  setGroupCriteria(searchObj.group, knexObj, criteriaFields);
  if(searchObj.includeCount) {
    knexObjForCount = knexObj.clone();
  }

  knexObj.columns(selectFields);

  setOrderBy(searchObj.orderBy, searchObj.sortOrderAscending, knexObj, orderByFields);
  if(!ignoreLimits) {
    setLimits(searchObj.pageSize, searchObj.pageNumber, knexObj);
  }
  logger.debug(getFileIdentifier(), knexObj.toString());
  let notes = await knexObj
  .then(notes => notes)
  .catch((err) => {
    logger.error(getFileIdentifier(), "Error: ", err);
    return {success: false, list:[], message: 'An internal server error occurred. Please contact support.'};
  });

  notes = notes || [];
  
  if(ignoreLimits === false && searchObj.includeCount) {
    let result = await knexObjForCount.count('*').then(result => result);
    logger.debug(getFileIdentifier(), 'Returning ' + notes.length + ' of ' + result[0].count + ' notes.');
    //logger.info(result);
    return {success: true, list: notes, totalCount: parseInt(result[0].count)};
  }
  else {
    logger.debug(getFileIdentifier(), 'Returning ' + notes.length + ' notes.');
    return {success: true, list: notes, totalCount: null};
  }
}

exports.bulkDelete = async (noteIds) => {
  logger.debug(getFileIdentifier(), 'delete note ids=', noteIds);
  return NoteModel.query().whereIn('_id', noteIds).del();
}

exports.getById = (noteId, callback) => {
  logger.debug(getFileIdentifier(), 'get note by id');
  NoteModel.query()
  .findById(noteId)
  .then(note => {
    if(note) {
      return callback(true, '', note);
    } else {
      return callback(false, "Note not found", null);
    }
  });
}

function getFileIdentifier() {
  return 'noteDAO -';
}
