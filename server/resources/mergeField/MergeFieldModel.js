/**
 * NOTE:  ClientNotes are notes that visible to clients 
 * 
 */

/**
 * pseudo schema 
 * 
 *    content:          { type: String } 
 *    
 *    user:             { type: ObjectId, ref: 'User' }
 *    _createdBy:       { type: ObjectId, ref: 'User' }
 *    _firm:            { type: ObjectId, ref: 'Firm' }
 *    _client:          { type: ObjectId, ref: 'Client' }
 *    
 *    _file:            { type: ObjectId, ref: 'File' }
 *    
 *    type:             { type: String } // TODO: change to enum once all types are defined
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class MergeField extends Model {

  static get tableName() {
    return 'mergefields'
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

module.exports = MergeField; 