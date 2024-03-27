/**
 * Sever-side controllers for ClientNote.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the ClientNote
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const ClientNote = require('./ClientNoteModel');
const File = require('../file/FileModel');
let logger = global.logger;
const permissions = require('../../global/utils/permissions')

// import controller
const clientUsersCtrl = require('../clientUser/clientUsersController');
const activitiesCtrl = require('../activity/activitiesController');

exports.list = (req, res) => {
  ClientNote.query()
  .then(clientNotes => {
    res.send({success: true, clientNotes})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of clientNotes queried from the array of _id's passed in the query param
   *
   * NOTES:
   * 1) looks like the best syntax for this is, "?id=1234&id=4567&id=91011"
   *    still a GET, and more or less conforms to REST uri's
   *    additionally, node will automatically parse this into a single array via "req.query.id"
   * 2) node default max request headers + uri size is 80kb.
   *    experimentation needed to determie what the max length of a list we can do this way is
   * TODO: server side pagination
   */

  if(!req.query[req.params.refKey]) {
    // make sure the correct query params are included
    res.send({success: false, message: `Missing query param(s) specified by the ref: ${req.params.refKey}`});
  } else {
    // // as in listByRef below, attempt to query for matching ObjectId keys first. ie, if "user" is passed, look for key "_user" before key "user"
    // ClientNote.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientNotes) => {
    //     if(err || !clientNotes) {
    //       res.send({success: false, message: `Error querying for clientNotes by ${["_" + req.params.refKey]} list`, err});
    //     } else if(clientNotes.length == 0) {
    //       ClientNote.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientNotes) => {
    //         if(err || !clientNotes) {
    //           res.send({success: false, message: `Error querying for clientNotes by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, clientNotes});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, clientNotes});
    //     }
    // })
    ClientNote.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, clientNotes) => {
        if(err || !clientNotes) {
          res.send({success: false, message: `Error querying for clientNotes by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, clientNotes});
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
  if(nextParams.split("/").length % 2 == 0) {
    // can't have length be uneven, throw error
    // ^ annoying because if you lead with the character you are splitting on, it puts an empty string first, so while we want "length == 2" technically we need to check for length == 3
    res.send({success: false, message: "Invalid parameter length"});
  } else {
    if(nextParams.length !== 0) {
      for(let i = 1; i < nextParams.split("/").length; i+= 2) {
        query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
      }
    }

    if (query && query.fileIds) {
      // get last note of every file by id
      const fileIds = query.fileIds.split('-');
      ClientNote.query()
      .whereIn('_file', fileIds)
      .then(clientNotes => {

        const objClientNotes = { isFetched: true };
        clientNotes.forEach(item => {
          if (objClientNotes[item._file]) {
            if (objClientNotes[item._file]._id < item._id) {
              objClientNotes[item._file] = item;
            }
          } else {
            objClientNotes[item._file] = item;
          }
        })
        res.send({success: true, clientNotes: [], objClientNotes });
      });
    } else {
      ClientNote.query()
      .where(query)
      .then(clientNotes => {
        res.send({success: true, clientNotes})
      });
    }
  }
}

exports.search = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  // search by query parameters
  // NOTE: It's up to the front end to make sure the params match the model
  let mongoQuery = {};
  let page, per;

  for(const key in req.query) {
    if(req.query.hasOwnProperty(key)) {
      if(key == "page") {
        page = parseInt(req.query.page);
      } else if(key == "per") {
        per = parseInt(req.query.per);
      } else {
        logger.debug("found search query param: ", key);
        mongoQuery[key] = req.query[key];
      }
    }
  }

  logger.info(mongoQuery);
  if(page || per) {
    page = page || 1;
    per = per || 20;
    ClientNote.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, clientNotes) => {
      if(err || !clientNotes) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , clientNotes: clientNotes
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    ClientNote.find(mongoQuery).exec((err, clientNotes) => {
      if(err || !clientNotes) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, clientNotes: clientNotes });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get clientNote by id');
  ClientNote.query().findById(req.params.id)
  .then(clientNote => {
    if(clientNote) {
      res.send({success: true, clientNote})
    } else {
      res.send({success: false, message: "ClientNote not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get clientNote schema ');
  res.send({success: true, schema: ClientNote.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get clientNote default object');
  res.send({success: true, defaultObj: ClientNote.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new clientNote');
  console.log(req.body)
  // let clientNote = new ClientNote({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     clientNote[k] = req.body[k];
  //   }
  // }


  const isClientUser = req.body.isClientuser;
  delete req.body.isClientuser;
  ClientNote.query().insert(req.body)
  .returning('*')
  .then(clientNote => {
    if(clientNote) {
      res.send({success: true, clientNote});

      // first find the file since we'll probably need this.
      File.query().findById(parseInt(clientNote._file))
      .asCallback((err, file) => {
        if (!err && file && file.status !== 'hidden') {
          file.isClientUser = isClientUser;

          // notify user connected in this client
          if (file._client && file._firm) {
            activitiesCtrl.utilCreateFromResource(
              req.user._id, file._firm, file._client
              , `%USER% started chatting in ${file.filename}`
              , `/firm/${file._firm}/workspaces/${file._client}/files/${file._id}`
              , false, true
              , `%USER% started chatting in ${file.filename}`
              , `/portal/${file._client}/files/${file._id}`
              , false, true
              , req.io
              , result => console.log(result)
            )
          }
        }
      }); 
    } else {
      res.send({ success: false, message: "Could not save ClientNote"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating clientNote');

  const clientNoteId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  ClientNote.query()
  .findById(clientNoteId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(clientNote => {
    console.log("ClientNote", clientNote)
    res.send({success: true, clientNote})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting clientNote");
  
  // TODO: needs testing and updating
  const clientNoteId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM clientNotes WHERE id = ' + clientNoteId + ';'

  console.log(query);
  db.query(query, (err, result) => {
    if(err) {
      console.log("ERROR")
      console.log(err);
      res.send({success: false, message: err});
    } else {
      res.send({success: true})
    }
  })
}
