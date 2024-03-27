let logger = global.logger;

exports.OPERATION_DELETE = 'Delete';

exports.OPERATION_UPDATE = 'Update';

exports.OPERATION_INSERT = 'Insert';

exports.translateDBErrorMessage = (err, operation, entityName) => {
  if(!err || !err.code) {
    logger.warn('db error:', err);
    return 'Unknown error';
  }

  if(err.code === '23503') {
    let message = 'This ' + entityName + ' has child records in table ' + err.table + '.';
    if(operation === exports.OPERATION_DELETE) {
      message += ' Please delete them before deleting this ' + entityName + '.';
    }
    else if(operation === exports.OPERATION_UPDATE) {
      message += ' Please delete them before updating the primary key of this ' + entityName + '.';
    }

    return message;
  }
  
  // TODO add more db error descriptions
  logger.warn('db error:', err);
  return 'Unknown error';
}
