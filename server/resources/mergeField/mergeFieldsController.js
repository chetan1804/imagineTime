/**
 * Sever-side controllers for MergeField.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the MergeField
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const MergeField = require('./MergeFieldModel');
const File = require('../file/FileModel');
let logger = global.logger;
const permissions = require('../../global/utils/permissions')

// import controller
const clientUsersCtrl = require('../clientUser/clientUsersController');
const activitiesCtrl = require('../activity/activitiesController');

exports.list = (req, res) => {
  MergeField.query()
  .then(mergeFields => {
    res.send({success: true, mergeFields})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of mergeFields queried from the array of _id's passed in the query param
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
    // MergeField.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, mergeFields) => {
    //     if(err || !mergeFields) {
    //       res.send({success: false, message: `Error querying for mergeFields by ${["_" + req.params.refKey]} list`, err});
    //     } else if(mergeFields.length == 0) {
    //       MergeField.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, mergeFields) => {
    //         if(err || !mergeFields) {
    //           res.send({success: false, message: `Error querying for mergeFields by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, mergeFields});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, mergeFields});
    //     }
    // })
    MergeField.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, mergeFields) => {
        if(err || !mergeFields) {
          res.send({success: false, message: `Error querying for mergeFields by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, mergeFields});
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
  }
  
  exports.mergeFieldDefaultList({ firmId: query._firm }, mergeFields => {
    res.send({success: true, mergeFields });
  });
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
    MergeField.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, mergeFields) => {
      if(err || !mergeFields) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , mergeFields: mergeFields
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    MergeField.find(mongoQuery).exec((err, mergeFields) => {
      if(err || !mergeFields) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, mergeFields: mergeFields });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get mergeField by id');
  MergeField.query().findById(req.params.id)
  .then(mergeField => {
    if(mergeField) {
      res.send({success: true, mergeField})
    } else {
      res.send({success: false, message: "MergeField not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get mergeField schema ');
  res.send({success: true, schema: MergeField.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get mergeField default object');
  res.send({success: true, defaultObj: MergeField.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new mergeField');
  console.log(req.body)
  // let mergeField = new MergeField({});

  // // run through and create all fields on the model
  // for(var k in req.body) {
  //   if(req.body.hasOwnProperty(k)) {
  //     mergeField[k] = req.body[k];
  //   }
  // }

  MergeField.query().insert(req.body)
  .returning('*')
  .asCallback((err, mergeField) => {
    if(!err && mergeField) {
      res.send({success: true, mergeField});
    } else {
      res.send({ success: false, message: err || "Could not save MergeField"})
    }
  });
}

exports.update = (req, res) => {
  logger.info('updating mergeField');

  const mergeFieldId = parseInt(req.params.id) // has to be an int
  
  // using knex/objection models
  MergeField.query()
  .findById(mergeFieldId)
  .update(req.body) //valiation? errors?? 
  .returning('*') // doesn't do this automatically on an update
  .then(mergeField => {
    console.log("MergeField", mergeField)
    res.send({success: true, mergeField})
  })
}

exports.delete = (req, res) => {
  logger.warn("deleting mergeField");
  
  // TODO: needs testing and updating
  const mergeFieldId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM mergeFields WHERE id = ' + mergeFieldId + ';'

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

exports.mergeFieldDefaultList = (params, callback) => {

  const {
    firmId
  } = params;

  const defaultField = {
    _id: null
    , _createdBy: null
    , created_at: '2021-10-22T14:36:49.352Z'
    , updated_at: '2021-10-22T14:36:49.352Z'
    , status: "visible"
    , _firm: null
  }

  if (firmId) {
    defaultField._firm = Number(firmId);
  }

  const mergeField = [
    { ...defaultField, tag: "firm", _id: "Firm.Name", name: "Firm.Name", value: "", sortLoc: "a"  }
    // , { ...defaultField, tag: "firm", _id: "Firm.PhoneNumber", name: "Firm.PhoneNumber", value: "", sortLoc: "b" }
    // , { ...defaultField, tag: "firm", _id: "Firm.Address", name: "Firm.Address", value: "", sortLoc: "c" }
    , { ...defaultField, tag: "firm", _id: "Firm.Address.Street", name: "Firm.Address.Street", value: "", sortLoc: "d" }
    , { ...defaultField, tag: "firm", _id: "Firm.Address.City", name: "Firm.Address.City", value: "", sortLoc: "f" }
    , { ...defaultField, tag: "firm", _id: "Firm.Address.State", name: "Firm.Address.State", value: "", sortLoc: "g" }
    , { ...defaultField, tag: "firm", _id: "Firm.Address.ZipCode", name: "Firm.Address.ZipCode", value: "", sortLoc: "h" }
    , { ...defaultField, tag: "firm", _id: "Firm.Address.Country", name: "Firm.Address.Country", value: "", sortLoc: "i" }

    // , { ...defaultField, tag: "user", _id: "User.FullName", name: "User.FullName", value: "", sortLoc: "a" }
    , { ...defaultField, tag: "user", _id: "User.FirstName", name: "User.FirstName", value: "", sortLoc: "b" }
    , { ...defaultField, tag: "user", _id: "User.LastName", name: "User.LastName", value: "", sortLoc: "c" }
    , { ...defaultField, tag: "user", _id: "User.UserName", name: "User.UserName", value: "", sortLoc: "d" }
    , { ...defaultField, tag: "user", _id: "User.PhoneNumber", name: "User.PhoneNumber", value: "", sortLoc: "e" }
    // , { ...defaultField, tag: "user", _id: "User.Address", name: "User.Address", value: "", sortLoc: "f" }
    , { ...defaultField, tag: "user", _id: "User.Address.Street", name: "User.Address.Street", value: "", sortLoc: "g" }
    , { ...defaultField, tag: "user", _id: "User.Address.City", name: "User.Address.City", value: "", sortLoc: "h" }
    , { ...defaultField, tag: "user", _id: "User.Address.State", name: "User.Address.State", value: "", sortLoc: "i" }
    , { ...defaultField, tag: "user", _id: "User.Address.ZipCode", name: "User.Address.ZipCode", value: "", sortLoc: "j" }
    , { ...defaultField, tag: "user", _id: "User.Address.Country", name: "User.Address.Country", value: "", sortLoc: "k" }

    , { ...defaultField, tag: "client", _id: "Client.Name", name: "Client.Name", value: "", sortLoc: "a" }
    , { ...defaultField, tag: "client", _id: "Client.Identifier", name: "Client.Identifier", value: "", sortLoc: "b" }
    , { ...defaultField, tag: "client", _id: "Client.PhoneNumber", name: "Client.PhoneNumber", value: "", sortLoc: "c" }
    // , { ...defaultField, tag: "client", _id: "Client.Address", name: "Client.Address", value: "", sortLoc: "d" }
    , { ...defaultField, tag: "client", _id: "Client.Address.Street", name: "Client.Address.Street", value: "", sortLoc: "e" }
    , { ...defaultField, tag: "client", _id: "Client.Address.City", name: "Client.Address.City", value: "", sortLoc: "f" }
    , { ...defaultField, tag: "client", _id: "Client.Address.State", name: "Client.Address.State", value: "", sortLoc: "g" }
    , { ...defaultField, tag: "client", _id: "Client.Address.ZipCode", name: "Client.Address.ZipCode", value: "", sortLoc: "h" }
    , { ...defaultField, tag: "client", _id: "Client.Address.Country", name: "Client.Address.Country", value: "", sortLoc: "i" }

    // , { ...defaultField, tag: "client-primary", _id: "Client.Primary.FullName", name: "Client.Primary.FullName", value: "", sortLoc: "a" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.FirstName",  name: "Client.Primary.FirstName", value: "", sortLoc: "b" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.LastName", name: "Client.Primary.LastName", value: "", sortLoc: "c" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.UserName", name: "Client.Primary.UserName", value: "", sortLoc: "d" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.PhoneNumber", name: "Client.Primary.PhoneNumber", value: "", sortLoc: "e" }
    // , { ...defaultField, tag: "client-primary", _id: "Client.Primary.Address", name: "Client.Primary.Address", value: "", sortLoc: "f" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.Address.Street", name: "Client.Primary.Address.Street", value: "", sortLoc: "g" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.Address.City", name: "Client.Primary.Address.City", value: "", sortLoc: "h" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.Address.State", name: "Client.Primary.Address.State", value: "", sortLoc: "i" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.Address.ZipCode", name: "Client.Primary.Address.ZipCode", value: "", sortLoc: "j" }
    , { ...defaultField, tag: "client-primary", _id: "Client.Primary.Address.Country", name: "Client.Primary.Address.Country", value: "", sortLoc: "k" }
    
    // , { ...defaultField, tag: "contact", _id: "Contact#.FullName", name: "Contact#.FullName", value: "", sortLoc: "a" }
    , { ...defaultField, tag: "contact", _id: "Contact#.FirstName", name: "Contact#.FirstName", value: "", sortLoc: "b" }
    , { ...defaultField, tag: "contact", _id: "Contact#.LastName", name: "Contact#.LastName", value: "", sortLoc: "c" }
    , { ...defaultField, tag: "contact", _id: "Contact#.UserName", name: "Contact#.UserName", value: "", sortLoc: "d" }
    , { ...defaultField, tag: "contact", _id: "Contact#.PhoneNumber", name: "Contact#.PhoneNumber", value: "", sortLoc: "e" }
    // , { ...defaultField, tag: "contact", _id: "Contact#.Address", name: "Contact#.Address", value: "", sortLoc: "f" }
    , { ...defaultField, tag: "contact", _id: "Contact#.Address.Street", name: "Contact#.Address.Street", value: "", sortLoc: "g" }
    , { ...defaultField, tag: "contact", _id: "Contact#.Address.City", name: "Contact#.Address.City", value: "", sortLoc: "h" }
    , { ...defaultField, tag: "contact", _id: "Contact#.Address.State", name: "Contact#.Address.State", value: "", sortLoc: "i" }
    , { ...defaultField, tag: "contact", _id: "Contact#.Address.ZipCode", name: "Contact#.Address.ZipCode", value: "", sortLoc: "j" }
    , { ...defaultField, tag: "contact", _id: "Contact#.Address.Country", name: "Contact#.Address.Country", value: "", sortLoc: "k" }

    , { ...defaultField, tag: "date", _id: "Date.Now", name: "Date.Now", value: "", sortLoc: "a" }
    , { ...defaultField, tag: "date", _id: "DateTime.Now", name: "DateTime.Now", value: "", sortLoc: "b" }
    , { ...defaultField, tag: "date", _id: "Date.Document.Creation", name: "Date.Document.Creation", value: "", sortLoc: "c" }
    , { ...defaultField, tag: "date", _id: "DateTime.Document.Creation", name: "DateTime.Document.Creation", value: "", sortLoc: "d" }
  ];
  callback(mergeField);
}

exports.mergeFieldDefaultListByObject = (firmId, callback) => {
  exports.mergeFieldDefaultList({ firmId }, response => {
    const objKey = {};
    response.forEach(item => {
      objKey[item._id] = item;
    });
    callback(objKey);
  });
}