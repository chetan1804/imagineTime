/**
 * Sever-side controllers for Note.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Note
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

// import controller from resource 
const fileActivityCtrl = require('../fileActivity/fileActivityController');
const activitiesCtrl = require('../activity/activitiesController');
const notificationCtrl = require('../notification/notificationsController');

const Note = require('./NoteModel');
const File = require('../file/FileModel');

const noteDAO = require('./noteDAO');

const CSVUtils = require('../../global/utils/CSVUtils');
const stringUtils = require('../../global/utils/stringUtils.js');
const { getSearchObject } = require('../searchUtil');
const staffCtrl = require('../staff/staffController');

let DateTime = require('luxon').DateTime;

let logger = global.logger;

exports.search = (req, res) => {
  //logger.debug(getFileIdentifier(), 'requesting user id: ', req.user._id);
  logger.debug(getFileIdentifier(), 'request body: ', req.body);
  //logger.debug(getFileIdentifier(), 'req.header("Accept")', req.header('Accept'));
  let isAcceptCSV = req.header('Accept') === 'text/csv';
  
  const searchObj = getSearchObject(req.body);
  logger.debug(getFileIdentifier(), 'firmId: ', searchObj.firmId);
  if(!searchObj.firmId) {
      res.send({success: false, message: 'firmId is required.'})
      return;
  }
  //staffCtrl.utilGetLoggedInByFirm(100, searchObj.firmId, result => {
  staffCtrl.utilGetLoggedInByFirm(req.user._id, searchObj.firmId, result => {
    if(!result.success) {
      logger.error('Error, Problem fetching logged in staff object. Unable to complete request.')
      res.send(result)
    }
    else {
      if(isAcceptCSV) {
        searchObj.includeCount = false;
        searchObj.orderBy = 'id';
        searchObj.sortOrderAscending = true;
      }
      noteDAO.search(searchObj, isAcceptCSV).then(result => {
        result.list.forEach((item) => {
          item['userName'] = stringUtils.concatenate(item.userFirstName, item.userLastName, ' ', true);

          if(isAcceptCSV) {
            if(!!item.createdDateTime) {
              item.createdDateTime = DateTime.fromMillis(item.createdDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }
            if(!!item.updatedDateTime) {
              item.updatedDateTime = DateTime.fromMillis(item.updatedDateTime.getTime()).toFormat('yyyy-LL-dd HH:mm:ss');
            }

            delete item.fileCategory;
            delete item.fileContentType;
            delete item.userFirstName;
            delete item.userLastName;
          }
        });
        if(isAcceptCSV) {
          CSVUtils.toCSV(result.list)
          .then(csv => {
              res.setHeader('Content-Type', 'text/csv');
              res.setHeader('Content-Disposition', 'attachment; filename=FileNotes.csv');
              res.send(csv);
          })
          .catch(err => {
              logger.error('Error: ', err);
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
  
exports.bulkDelete = (req, res) => {
  const noteIds = req.body;
  logger.debug(getFileIdentifier(), 'bulk delete note ids=', noteIds);

  noteDAO.bulkDelete(noteIds)
  .then((result) => {
    //logger.debug(getFileIdentifier(), 'bulkDelete - result:', result);
    res.send({ success: true, message: 'Notes deleted successfully' });
  })
  .catch(err => {
    logger.debug(getFileIdentifier(), 'bulkDelete - error:', err);
    res.send({ success: false, message: err });
  });
}

exports.list = (req, res) => {
  Note.query()
  .then(notes => {
    res.send({success: true, notes});
  });
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: 'Not implemented for Postgres yet'});
  return;
  /**
   * returns list of notes queried from the array of _id's passed in the query param
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
    // Note.find({['_' + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notes) => {
    //     if(err || !notes) {
    //       res.send({success: false, message: `Error querying for notes by ${['_' + req.params.refKey]} list`, err});
    //     } else if(notes.length == 0) {
    //       Note.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notes) => {
    //         if(err || !notes) {
    //           res.send({success: false, message: `Error querying for notes by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, notes});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, notes});
    //     }
    // })
    Note.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, notes) => {
        if(err || !notes) {
          res.send({success: false, message: `Error querying for notes by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, notes});
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
    Note.query()
    .where(query)
    .then(notes => {
      res.send({success: true, notes})
    })
  }
}

exports.getById = (req, res) => {
  logger.debug(getFileIdentifier(), 'get note by id');
  Note.query().findById(req.params.id)
  .then(note => {
    if(note) {
      res.send({success: true, note})
    } else {
      res.send({success: false, message: 'Note not found'})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.debug(getFileIdentifier(), 'get note schema ');
  res.send({success: true, schema: Note.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.debug(getFileIdentifier(), 'get note default object');
  res.send({success: true, defaultObj: Note.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.debug(getFileIdentifier(), 'creating new note');
  console.log(req.body)
  // let note = new Note({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     note[k] = req.body[k];
  //   }
  // }


  Note.query().insert(req.body)
  .returning('*')
  .then(note => {
    if(note) {

      // logger.info('error', note)

      // // file activity
      // fileActivityCtrl.utilCreateFromResource(
      //   req
      //   , note._file, note._firm, note._client, note._user
      //   , 'visible'
      //   , `Comment by %USER%`
      //   , '' //
      //   , '' // shareLink.url
      // );      

      // res.send({success: true, note});

      // first find the file since we'll probably need this.
      File.query().findById(parseInt(note._file))
      .asCallback((err, file) => {

        if (file) {
          if(file._client) {
            activitiesCtrl.utilCreatePrivateNoteNotification(
              req.user
              , file
              , req.io
              , `/firm/${file._firm}/files/${file._client}/workspace/${file._id}`
              , `%USER% left a note in ${file.filename}`);
          } else if (file._personal) {
            let workspaceLink = `/firm/${file._firm}/files/${file._personal}/personal/${file._id}`;
            let fromUserString = '';
            if (req.user && req.user._id) {
              fromUserString = req.user.firstname + ' ' + req.user.lastname;
            }
            notificationCtrl.sendNotifLinkByUserId(
              req.io
              , [file._personal]
              , file._firm
              , file._client
              , workspaceLink
              , ''
              , `%USER% left a note in ${file.filename}`
              , fromUserString
              , result => console.log('res', result)
            );
          } else {
            activitiesCtrl.utilCreatePrivateNoteNotification(
              req.user
              , file
              , req.io
              , `/firm/${file._firm}/files/public/${file._id}`
              , `%USER% left a note in ${file.filename}`);
          }
        }
      }); 

      fileActivityCtrl.utilCreateFromResource(
        req
        , note._file, note._firm, note._client, note._user
        , 'visible'
        , `Comment by %USER%`
        , '' //
        , '' // shareLink.url
      ); 

      res.send({success: true, note});
    } else {
      res.send({ success: false, message: 'Could not save Note'})
    }
  });
}

exports.update = (req, res) => {
  logger.debug(getFileIdentifier(), 'updating note');

  const noteId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  Note.query()
  .findById(noteId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(note => {
    console.log('Note', note)
    res.send({success: true, note})
  })
}

exports.delete = (req, res) => {
  logger.debug(getFileIdentifier(), 'deleting note');
  
  // TODO: needs testing and updating
  const noteId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM notes WHERE id = ' + noteId + ';'

  console.log(query);
  db.query(query, (err, result) => {
    if(err) {
      console.log('ERROR')
      console.log(err);
      res.send({success: false, message: err});
    } else {
      res.send({success: true})
    }
  })
}

function getFileIdentifier() {
  return 'signatureController -';
}
