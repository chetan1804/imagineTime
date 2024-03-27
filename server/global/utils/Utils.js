exports.getErrorMessage = (err) => {
    if(typeof err === 'string') {
        logger.debug('Error Object is String. Value is "', err, '"');
        return err;
    }
    if(typeof err === 'object') {
        logger.debug('Error Object is Object:', err);
        if(!!Array.isArray(err)) {
            logger.debug('Error Object is Array of length', err.length);
            return exports.getErrorMessage(err[0]);
        }
        if(!!err.error) {
            logger.debug('Error message is in attribute "error". Value is "', err.error, '"');
            return exports.getErrorMessage(err.error);
        }
        if(!!err.message) {
            logger.debug('Error message is in attribute "message". Value is "', err.message, '"');
            return exports.getErrorMessage(err.message);
        }
        if(!!err.detail) {
            logger.debug('Error message is in attribute "detail". Value is "', err.detail, '"');
            return exports.getErrorMessage(err.detail);
        }
        logger.debug('Error Object is attribute is unknown');
    }

    logger.debug('Error Object is neither String nor Object. Type is', typeof err, '. Value is "', err, '"');
    return err;
  }
  