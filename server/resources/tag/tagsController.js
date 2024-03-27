/**
 * Sever-side controllers for Tag.
 * By default, Yote's server controllers are dynamic relative
 * to their models -- i.e. if you add fields to the Tag
 * model, the create and update controllers below will respect
 * the new schema.
 *
 * NOTE: HOWEVER, you still need to make sure to account for
 * any model changes on the client
 */

const Tag = require('./TagModel');
const Client = require('../client/ClientModel');
let logger = global.logger;

const permissions = require('../../global/utils/permissions');

exports.utilSearch = (vectorQueryString, firmId, callback) => {
  // firmId there for when we have firm-specific tags
  if (vectorQueryString && vectorQueryString.indexOf('-AMPERSAND-') > -1) {
    vectorQueryString = vectorQueryString.replace(/-AMPERSAND-/g, '&');
  }
  vectorQueryString = vectorQueryString && vectorQueryString.trim().toLowerCase();
  
  Tag.query()
  // .whereRaw(`document_vectors @@ to_tsquery('${vectorQueryString}')`)
  .where(builder => {
    const queryArr = vectorQueryString.split(' & ');
    builder.whereRaw('LOWER(name) LIKE ?', `%${vectorQueryString}%`)
    if (queryArr && queryArr.length) {
      queryArr.map(item => {
        builder.orWhereRaw('LOWER(name) LIKE ?', `%${item}%`)
      });
    }
  })
  .then(tags => {
    callback({success: true, tags})
  })
  // .catch(err => {
  //   console.log("err", err);
  //   callback({success: false, message: err})
  // })
}

exports.list = (req, res) => {
  Tag.query()
  .then(tags => {
    res.send({success: true, tags})
  })
}

exports.listByValues = (req, res) => {
  res.send({success: false, message: "Not implemented for Postgres yet"});
  return;
  /**
   * returns list of tags queried from the array of _id's passed in the query param
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
    // Tag.find({["_" + req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, tags) => {
    //     if(err || !tags) {
    //       res.send({success: false, message: `Error querying for tags by ${["_" + req.params.refKey]} list`, err});
    //     } else if(tags.length == 0) {
    //       Tag.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, tags) => {
    //         if(err || !tags) {
    //           res.send({success: false, message: `Error querying for tags by ${[req.params.refKey]} list`, err});
    //         } else {
    //           res.send({success: true, tags});
    //         }
    //       })
    //     } else  {
    //       res.send({success: true, tags});
    //     }
    // })
    Tag.find({[req.params.refKey]: {$in: [].concat(req.query[req.params.refKey]) }}, (err, tags) => {
        if(err || !tags) {
          res.send({success: false, message: `Error querying for tags by ${[req.params.refKey]} list`, err});
        } else  {
          res.send({success: true, tags});
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
  let query = {}
  let clientPermissionId = null;
  let firmPermissionId = null;
  const refKey = req.params.refKey
  if(!refKey.includes('~')) {
    query[refKey] = req.params.refId === 'null' ? null : req.params.refId
  } else {
    /**
     * The query includes a tilde (~). This is a special field that allows us to do 
     * custom overrides, which can be sub queries or additional permission checks.
     */
    if(refKey == '~firm') {
      /**
       * Now that we have custom firm tags, in most cases the user will want all tags
       * with their firmID AND all tags with no firmId (global tags). That's the purpose
       * of this override. This should allow access to clients, staff, and super admins.
       */
      // Save the firm id for permission checks below.
      firmPermissionId = req.params.refId
    } else if(refKey == '~client') {
      // We have to be able to do the same check for clients. They should have access to
      // global tags for now.
      // Save the client id for the permission checks below.
      clientPermissionId = req.params.refId
      // NOTE: We aren't adding _client to the query here because there is no reference to client on tags.
    }
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
        if(nextParams.split("/")[i].includes("~")) {
          // See line 99 above for further explanation.
          if(nextParams.split("/")[i] == "~firm") {
            firmPermissionId = nextParams.split("/")[i+1]
            query._firm = nextParams.split("/")[i+1]
          } else if(nextParams.split("/")[i] == "~client") {
            clientPermissionId = nextParams.split("/")[i+1]
          }
        } else {
          query[nextParams.split("/")[i]] = nextParams.split("/")[i+1] === 'null' ? null : nextParams.split("/")[i+1]
        }
      }
    }
    // Put the initial query together.
    let TagQuery = Tag.query()
      .where(query)

    if(firmPermissionId) {
      if(req.firm && req.firm._id && (req.firm._id == firmPermissionId)) {
        TagQuery
        .where({_firm: firmPermissionId})
        .orWhere(builder => {
          builder
          .orWhereNull('_firm')
        })
        .asCallback((err, tags) => {
          if(err || !tags) {
            res.send({success: false, message: err || "There was a problem finding the requested tags."})
          } else {
            res.send({success: true, tags})
          }
        });
      } else {
        exports.utilListByFirmPermission(req.user, firmPermissionId, TagQuery, result => {
          res.send(result)
        })
      }

    } else if(clientPermissionId) {
      exports.utilListByClientPermission(req.user, clientPermissionId, TagQuery, result => {
        res.send(result)
      })
    } else if(req.user.admin) {
      TagQuery
      .asCallback((err, tags) => {
        if(err || !tags) {
          res.send({success: false, message: err || "There was a problem finding the requested tags."})
        } else {
          res.send({success: true, tags})
        }
      });
    } else {
      logger.info("user does not have permission");
      res.send({success: false, message: "You do not have permission to access this API route."})
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
    Tag.find(mongoQuery).skip((page-1)*per).limit(per).exec((err, tags) => {
      if(err || !tags) {
        res.send({ success: false, message: err });
      } else {
        res.send({
          success: true
          , tags: tags
          , pagination: {
            per: per
            , page: page
          }
        });
      }
    });
  } else {
    Tag.find(mongoQuery).exec((err, tags) => {
      if(err || !tags) {
        res.send({ success: false, message: err });
      } else {
        res.send({ success: true, tags: tags });
      }
    });
  }
}

exports.getById = (req, res) => {
  logger.info('get tag by id');
  Tag.query().findById(req.params.id)
  .then(tag => {
    if(tag) {
      res.send({success: true, tag})
    } else {
      res.send({success: false, message: "Tag not found"})
    }
  });
}

exports.getSchema = (req, res) => {
  // TODO: need to figure out how/if this can work with the existing yote stuff
  /**
   * This is admin protected and useful for displaying REST api documentation
   */
  logger.info('get tag schema ');
  res.send({success: true, schema: Tag.jsonSchema});
}

 exports.getDefault = (req, res) => {
  /**
   * This is an open api call by default (see what I did there?) and is used to
   * return the default object back to the Create components on the client-side.
   *
   * NOTE: uses /global/utils/api.js to return default values IF defined on the model.
   * will otherwise return null. 
   */
  logger.info('get tag default object');
  res.send({success: true, defaultObj: Tag.defaultObject});
  // res.send({success: false})
}

exports.create = (req, res) => {
  logger.info('creating new tag');
  let newTag = req.body;
  newTag._createdBy = req.user._id
  // console.log(newTag)
  // Only staff owners and super admins can create tags.
  permissions.utilCheckFirmPermission(req.user, newTag._firm || null, "admin", adminPermission => {
    console.log("create tags admin permission check", adminPermission)
    if(adminPermission) {
      Tag.query().insert(req.body)
      .returning('*')
      .asCallback((err, tag) => {
        if(err || !tag) {
          logger.error("ERROR: ")
          logger.info(err)
          res.send({ success: false, message: "Could not save Tag"})
        } else {
          res.send({success: true, tag})
        }
      });
    } else {
      res.send({ success: false, message: "You do not have permission to create tags."})
    }
  })
}

exports.update = (req, res) => {
  logger.info('updating tag');

  const tagId = parseInt(req.params.id) // has to be an int
  // build query
  let TagQuery = Tag.query()
    .findById(tagId)
    .update(req.body) //valiation? errors?? 
    .returning('*') // doesn't do this automatically on an update

  if(!req.body._firm) {
    // Only super admins can update tags where _firm === null (global tags)
    if(req.user.admin) {
      logger.info("updating global tag with super admin permission.")
      TagQuery
      .asCallback((err, tag) => {
        if(err || !tag) {
          logger.error("ERROR: ")
          logger.info(err)
          res.send({ success: false, message: "Could not update Tag"})
        } else {
          res.send({success: true, tag})
        }
      });
    } else {
      res.send({success: false, message: "You do not have permission to update global tags."})
    }
  } else {
    // The tag has a firm id, Only allow staffOwners from that firm (or super admins) to update it.
    permissions.utilCheckFirmPermission(req.user, req.body._firm, "admin", adminPermission => {
      console.log("update tags admin permission check", adminPermission)
      if(adminPermission) {
        TagQuery
        .asCallback((err, tag) => {
          if(err || !tag) {
            logger.error("ERROR: ")
            logger.info(err)
            res.send({ success: false, message: "Could not update Tag"})
          } else {
            res.send({success: true, tag})
          }
        });
      } else {
        res.send({ success: false, message: "You do not have permission to update this tag."})
      }
    });
  }
}

exports.delete = (req, res) => {
  logger.warn("deleting tag");
  
  // TODO: needs testing and updating
  const tagId = parseInt(req.params.id) // has to be an int

  let query = 'DELETE FROM tags WHERE id = ' + tagId + ';'

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

exports.utilListByFirmPermission = (user, firmId, TagQuery, callback) => {
  permissions.utilCheckFirmPermission(user, firmId, "access", accessPermission => {
    logger.info('tags by firm access permission check', accessPermission)
    if(!accessPermission) {
      logger.info('User does not have permission to access tags by firmId: ', firmId);
      callback({success: false, message: 'You do not have permission to access this api route.'});
    } else {
      logger.info('fetching files as staff')
      TagQuery
      .where({_firm: firmId})
      .orWhere(builder => {
        builder
        .orWhereNull('_firm')
      })
      .asCallback((err, tags) => {
        if(err || !tags) {
          callback({success: false, message: err || "There was a problem finding the requested tags."})
        } else {
          callback({success: true, tags})
        }
      });
    }
  })
}

exports.utilListByClientPermission = (user, clientId, TagQuery, callback) => {
  permissions.utilCheckClientPermission(user, clientId, "client", clientPermission => {
    logger.info("tags by client access permission check", clientPermission)
    if(!clientPermission) {
      logger.info('User does not have permission to access tags by clientId: ', clientId);
    } else {
      // for now clients only get access to global tags (where _firm === null)
      TagQuery
      .where({_firm: null})
      .asCallback((err, tags) => {
        if(err || !tags) {
          callback({success: false, message: err || "There was a problem finding the requested tags."})
        } else {
          callback({success: true, tags})
        }
      });
    }
  })

}
