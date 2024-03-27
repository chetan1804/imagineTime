/**
 * pseudo schema 
 * 
 *    filename:         { type: String } 
 *    fileExtension:    { type: String }
 *    category:         { type: String }
 *    contentType:      { type: String }
 *    rawUrl:           { type: String }
 * 
 *    status:           { type: String }, 'hidden', 'visible', 'locked', 'archived', 'deleted'
 *
 *    _firm:            { type: ObjectId, ref: 'Firm' }
 *    _user:            { type: ObjectId, ref: 'User' }
 *    _client:          { type: ObjectId, ref: 'Client' }
 *
 *    _clientTask:      { type: ObjectId, ref: 'ClientTask' } // from migration file
 *    _clientWorkflow:        { type: ObjectId, ref: 'ClientWorkflow' } // from migration file
 *    
 *    _tags:            [{ type: ObjectId, ref: 'Tag' }] // specificType
 * 
 *    NOTE: New fields required for file renaming below.
 *    
 *    prefix: This will be a random hex. TODO: We've decided against using this. A new migration will have to be run to remove this field.
 *    folderString: Currently unused. Meant to allow more detailed folder structure. ie, "/taxes/2019/files/"
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class File extends Model {

  static get tableName() {
    return 'files'
  }

  static get idColumn() {
    // manually set this to interact better with yote front end
    return '_id';
  }

  static get jsonSchema() {
    // see https://github.com/Vincit/objection.js/blob/master/examples/express-es6/models/Animal.js
    return {
      // we can do validation here if we set this up
      type: 'object',
      properties: {
        _id: { type: 'integer' },
      }
    }
  }

  static get defaultObject() {
    // define defaults
    return {
      // what will return to the "defaultObj" api call
    }
  }
  static get relationMappings() {
    return {
      // TODO: see above as well. can use for joins and stuff
    }
  }

  // any additional static methods below

}

module.exports = File; 