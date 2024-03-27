/**
 * Sever-side controllers for ClientPost.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientPost
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientPost = require('./ClientPostModel');
const ClientWorkflow = require('../clientWorkflow/ClientWorkflowModel');

let activitiesCtrl = require('../activity/activitiesController')

const clientPostDAO = require('./clientPostDAO');

const CSVUtils = require('../../global/utils/CSVUtils');
const stringUtils = require('../../global/utils/stringUtils.js');
const { getSearchObject } = require('../searchUtil');
const staffCtrl = require('../staff/staffController');

const async = require('async');
let DateTime = require('luxon').DateTime;

let logger = global.logger;

exports.utilCheckAndGenerateActivity = (user, io, finalObj, callback = () => {}) => {
  activitiesCtrl.utilCreateFromResource(
    user._id, finalObj._firm, finalObj._client
    , `%USER% sent a message`
    , `/firm/${finalObj._firm}/workspaces/${finalObj._client}/messages`
    , false, true
    , `%USER% sent a message`
    , `/portal/${finalObj._client}/client-posts`
    , false, true
    , io
    , result => callback(result) 
  )
}

exports.utilSearch = (vectorQueryString, firmId = null, clientId = null, callback) => {
  
}

exports.list = (req, res) => {
  ClientPost.query()
  .then(clientPosts => {
    res.send({success: true, clientPosts})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: 'Not implemented for Postgres yet'});
  return;
  /**
   * returns list of clientPosts queried from the array of _id's passed in the query param
   *
   * NOTES:
   * 1) looks like the best syntax for this is, '?id=1234&id=4567&id=91011'
   *    still a GET, and more or less conforms to REST uri's
   *    additionally, node will automatically parse this into a single array via 'req.query.id'
   * 2) node default max request headers + uri size is 80kb.
   *    experimentation needed to determie what the max length of a list we can do this way is
   * TODO: server side pagination
   */

  if(!req.query[req.params.refKey]) {
    // make sure the correct query params are included
    res.send({success: false, message: `Missing query param(s) specified by the ref: ${req.params.refKey}`});
  } else {
    // // as in listByRef below, attempt to query for matching ObjectId keys first. ie, if 'user' is passed, look for key '_user' before key 'user'
    // ClientPost.find({['_' + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientPosts) => {
    //     if(err || !clientPosts) {
    //       res.send({success: false, message: `Error querying for clientPosts by ${['_' + req.params.refKey]} list`, err});
    //     } else if(clientPosts.length == 0) {
    //       ClientPost.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientPosts) => {
    //         if(err || !clientPosts) {
    //           res.send({success: false, message: `Error querying for clientPosts by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientPosts});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientPosts});
    //     }
    // })
    ClientPost.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientPosts) => {
        if(err || !clientPosts) {
          res.send({success: false, message: `Error querying for clientPosts by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientPosts});
        }
    })
  }
}

exports.listByRefs = (req, res) => {
  /**
   * NOTE: This let's us query by ANY string or pointer key by passing in a refKey and refId
   * TODO: server side pagination
   */

   // build query
  let query = {
    [req.params.refKey]: req.params.refId === 'null' ? null : req.params.refId
  }
  // test for optional additional parameters
  const nextParams = req.params['0'];
  if(nextParams.split('/').length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want 'length == 2' technically we need to check for length == 3
    res.send({success: false, message: 'Invalid parameter length'});
  } else {
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split('/').length; i+= 2) {
        query[nextParams.split('/')[i]] = nextParams.split('/')[i+1] === 'null' ? null : nextParams.split('/')[i+1]
      }
    }
    ClientPost.query()
    .where(query)
    .then(clientPosts => {
      res.send({success: true, clientPosts})
    })
  }
}

exports.search = (req, res) => {
  //logger.debug('requesting user id: ', req.user._id);
  //logger.debug(getFileIdentifier(), 'request body: ', req.body);
  //logger.debug('req.header('Accept')', req.header('Accept'));
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
      clientPostDAO.search(searchObj).then(result => {
        result.list.forEach((item) => {
          item['createdByName'] = stringUtils.concatenate(item.createdByFirstName, item.createdByLastName, ' ', true);

          if(isAcceptCSV) {
            if(!!item.createdDateTime) {
              item.createdDateTime = DateTime.fromMillis(item.createdDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if(!!item.updatedDateTime) {
              item.updatedDateTime = DateTime.fromMillis(item.updatedDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            delete item.createdByFirstName;
            delete item.createdByLastName;
          }
        });
        if(isAcceptCSV) {
          CSVUtils.toCSV(result.list)
          .then(csv => {
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader('Content-Disposition', 'attachment; filename=ClientMessages.csv');
              res.send(csv);
          })
          .catch(err => {
              logger.error(getFileIdentifier(), 'Error: ', err);
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
  
exports.getById = (req, res) => {
  logger.debug(getFileIdentifier(), 'get clientPost by id');
  ClientPost.query().findById(req.params.id)
  .then(clientPost => {
    if(clientPost) {
      res.send({success: true, clientPost})
    } else {
      res.send({success: false, message: 'ClientPost not found'})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.debug(getFileIdentifier(), 'get clientPost schema ');
  res.send({success: true, schema: ClientPost.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.debug(getFileIdentifier(), 'get clientPost default object');
  res.send({success: true, defaultObj: ClientPost.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.debug(getFileIdentifier(), 'creating new clientPost');
  let clientPost = req.body;
  clientPost._createdBy = req.user._id;
  ClientPost.query().insert(clientPost)
  .returning('*')
  .then(clientPost => {
    if(clientPost) {
      /**
       * TODO: Hit a util here that generates an activity and a clientActivity.
       */
      exports.utilCheckAndGenerateActivity(req.user, req.io, clientPost);
      res.send({success: true, clientPost})
    } else {
      res.send({ success: false, message: 'Could not save ClientPost'})
    }
  });
}

exports.update = (req, res) => {
  logger.debug(getFileIdentifier(), 'updating clientPost');

  const clientPostId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientPost.query()
  .findById(clientPostId)
  .then(oldClientPost => {

    ClientPost.query()
    .findById(clientPostId)
    .update(req.body) //valiation? errors?? 
    .returning('*') // doesn't do this automatically on an update
    .then(clientPost => {
      console.log('clientPost', clientPost)
      res.send({success: true, clientPost})
    })
  })
}

exports.delete = (req, res) => {
  logger.warn(getFileIdentifier(), 'deleting clientPost');
  // TODO: needs testing and updating
  const clientPostId = parseInt(req.params.id) // has to be an int

  ClientPost.query()
  .findById(clientPostId)
  .del()
  .returning('*')
  .then(clientPost => {
    console.log('clientPost deleted: ', clientPost)
    res.send({success: true, clientPost})
  })
  .catch(err => {
    logger.error(getFileIdentifier(), err);
    res.send({success: false, message: err})
  });
}

exports.bulkDelete = (req, res) => {
  const clientPostIds = req.body;
  logger.debug(getFileIdentifier(), 'bulk delete client post ids=', clientPostIds);

  async.map(clientPostIds,
    (clientPostId, callback) => {
      deleteClientPost(clientPostId, req.user._id, result => {
        if(result.success) {
          return callback(null, {id: clientPostId, message: ''});
        }
        else {
          return callback(null, {id: clientPostId, message: result.message});
        }
      });
    },
    (err, list) => {
      logger.debug(getFileIdentifier(), 'success client post bulk delete', err, list);
      if(err) {
        res.send({ success: false, message: err });
      }
      else {
        let errors = list.filter(item => {
          return (!!item.message);
        });
        res.send({ success: (!errors || errors.length < 1), data: list });
        return;
      }
    }
  );
}

const deleteClientPost = (clientPostId, loggedInUserId, callback) => {
  logger.debug(getFileIdentifier(), 'delete client post id=', clientPostId);
  ClientPost.query()
  .where({_id: clientPostId})
  .then(clientPosts => {
    if(clientPosts) {
      staffCtrl.utilGetLoggedInByFirm(loggedInUserId, clientPosts[0]._firm, staffResult => {
        if(!staffResult.success) {
          logger.error(getFileIdentifier(), 'Permission issues: Logged in user[id: ' + loggedInUserId + '] is not from the same firm[id: ' + clientPosts[0]._firm + '].')
          return callback({success: false, message: 'You do not have permission to delete this client message.'})
        } else {
          clientPostDAO.delete(clientPosts[0]._id, (result) => {
            return callback(result);
          });
        }
      });
    } else {
      return callback({success: false, message: 'Invalid client message'})
    }
  });
}

function getFileIdentifier() {
  return 'clientPostController -';
}
