const FileActivity = require('./FileActivityModel');
const fileActivityDAO = require('./fileActivityDAO');

const CSVUtils = require('../../global/utils/CSVUtils');
const { getSearchObject } = require('../searchUtil');
const staffCtrl = require('../staff/staffController');
const permissions = require('../../global/utils/permissions.js');
const stringUtils = require('../../global/utils/stringUtils.js');

let DateTime = require('luxon').DateTime;

const async = require('async');
const User = require('../user/UserModel');
const { raw } = require('objection');

// define 'safe' user fields to return to the api
const safeUserFields = [
    '_id', 'username', 'firstname', 'lastname'
    , '_primaryAddress', '_primaryPhone', 'onBoarded', 'admin'
    , 'created_at', 'updated_at', 'sendNotifEmails'
    , 'sharedSecretPrompt', 'sharedSecretAnswer'
    , 'firstLogin'
]

exports.search = (req, res) => {
    //logger.debug(getFileIdentifier(), 'requesting user id: ', req.user._id);
    //logger.debug(getFileIdentifier(), 'request body: ', req.body);
    //logger.debug(getFileIdentifier(), 'req.header('Accept')', req.header('Accept'));
    let isAcceptCSV = req.header('Accept') === 'text/csv';

    const searchObj = getSearchObject(req.body);
    //logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId);
    if(!searchObj.firmId) {
        res.send({success: false, message: 'firmId is required.'})
        return;
    }
    if(isAcceptCSV || searchObj.ignoreLimit === true) {
        searchObj.includeCount = false;
        searchObj.ignoreLimit = true;
    }
    
    //staffCtrl.utilGetLoggedInByFirm(100, searchObj.firmId, result => {
    staffCtrl.utilGetLoggedInByFirm(req.user._id, searchObj.firmId, result => {
        if(!result.success) {
            logger.error(getFileIdentifier(), 'Problem fetching logged in staff object. Unable to complete request.')
            res.send(result)
        }
        else {
            if(isAcceptCSV) {
                searchObj.includeCount = false;
                searchObj.orderBy = 'id';
                searchObj.sortOrderAscending = true;
            }
            fileActivityDAO.search(searchObj).then(result => {
                result.list.forEach((item) => {
                    item['userName'] = stringUtils.concatenate(item.userFirstName, item.userLastName, ' ', true);

                    if(isAcceptCSV) {
                        if(!!item.createdDateTime) {
                            item.createdDateTime = DateTime.fromMillis(item.createdDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
                        }
                        if(!!item.updatedDateTime) {
                            item.updatedDateTime = DateTime.fromMillis(item.updatedDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
                        }
                    
                        delete item.clientId;
                        delete item.userFirstName;
                        delete item.userLastName;
                    }
                });
                if(isAcceptCSV) {
                    CSVUtils.toCSV(result.list)
                    .then(csv => {
                        res.setHeader('Content-Type', 'text/csv');
                        res.setHeader('Content-Disposition', 'attachment; filename=FileActivities.csv');
                        res.send(csv);
                    })
                    .catch(err => {
                        logger.debug('Error: ', err);
                        res.setHeader('Content-Type', 'text/csv');
                        res.setHeader('Content-Disposition', 'attachment; filename=InternalError.csv');
                        res.status(500).send(err);
                    });
                }
                else {
                    res.send({success: result.success, results:result.list, totalCount: result.totalCount});
                }
            });
        }
    });
}

exports.list = (req, res) => {
    FileActivity.query()
    .then(json => {
        res.send({success: true, json});
    });
}


exports.listByValues = (req, res) => {
    res.send({success: false, message: 'Not implemented for Postgres yet'});
    return;
}

exports.listByRefs = (req, res) => {
    logger.error('error listByRefs')
    /**
     * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
     * TODO: server side pagination
     */
  
     // build query
    let query = {
        [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
    }
    logger.error('error listByRefs', query)
    // test for optional additional parameters
    const nextParams = req.params['0'];
    if (nextParams.split('/').length % 2 == 0) {
        // can't have length be uneven, throw error
        // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want 'length == 2' technically we need to check for length == 3
        res.send({success: false, message: 'Invalid parameter length'});
    } else {
        if (nextParams.length !== 0) {
            for(let i = 1; i < nextParams.split('/').length; i+= 2) {
                query[nextParams.split('/')[i]] = nextParams.split('/')[i+1] === 'null' ? null : nextParams.split('/')[i+1]
            }
        }

        if (Object.values(query).every(item => !item || item === 'undefined' || item === 'null') || Object.keys(query).length === 0) {
            res.send({ success: true, data: [] });
        } else {
            const selectFields = query.action === "get-viewed-log" ? ['a.*'] : ['a.*', raw('json_agg(b) as user')];
            const newQuery = {};
            Object.keys(query).map(ky => {
                if (ky === '_new') {
                    // do nothing
                } else if (ky !== 'action' && query[ky] && query[ky] !== 'undefined' && query[ky] !== 'null') {
                    newQuery[`a.${ky}`] = query[ky];
                }
            });
            delete newQuery._new;
            FileActivity.query().from('file_activities as a')
            .leftJoin('users as b', 'a._user', 'b._id')
            .where(newQuery)
            .where(builder => {
                if (query.action) {
                    builder.where('text', 'like', '%iewed%')
                }
            })
            .select(...selectFields)
            .groupBy('a._id')
            .orderBy('a._id', 'desc')
            .then(result => {
                if (result) {
                    res.send({ success: true, data: result });
                } else {
                    res.send({ success: false, message: 'File activity not found' });
                }
            })
        }
    }
}
  
/*
exports.search = (req, res) => {
    res.send({success: false, message: 'Not implemented for Postgres yet'});
    return;
}
*/

exports.getById = (req, res) => {
    logger.info('get activity by id');
    FileActivity.query().findById(req.params.id)
        .then(json => {
            if(json) {
                res.send({success: true, json})
            } else {
                res.send({success: false, message: 'File Activity not found'})
            }
    });
}
  
exports.getSchema = (req, res) => {
    // TODO: need to figure out how/if this can work with the existing yote stuff
    /**
     * This is admin protected and useful for displaying REST api documentation
     */
    logger.info('get activity schema ');
    res.send({success: true, schema: Activity.jsonSchema});
}
  
exports.getDefault = (req, res) => {
    /**
     * This is an open api call by default (see what I did there?) and is used to
     * return the default object back to the Create components on the client-side.
     *
     * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
     * will otherwise return null. 
     */
    logger.info('get activity default object');
    res.send({success: true, defaultObj: FileActivity.defaultObject});
    // res.send({success: false})
}

exports.create = (req, res) => {

}
  
exports.utilCreateFromResource = (req
    , _file , _firm , _client , _user
    , status , text
    , workspace
    , portal) => {

    logger.info('file activity debug');

    const data = {
        _file, _firm, _client, _user
        , status, text, workspace, portal
    };
    
    FileActivity.query()
        .insert(data)
        .returning('*')
        .then(json => {
            logger.info('File activity', json)
            if(json._user) 
                req.io.to(json._user).emit('receive_file_activity', json);
        });

}

exports.getByClientId = (req, res) => {

    const clientId = req.params.clientId;
    if (clientId) {
        FileActivity.query().where({
            _client: clientId
        })
        .then(result => {
            res.send({ success: true, data: result });
        });
    } else {
        res.send({ success: false, message: 'Client not found' });        
    }
}