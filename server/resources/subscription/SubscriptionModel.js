/**
 * pseudo schema 
 * 
 *    status:           { type: String, default: 'trialing' }
 *    licenses:         { type: Int, default: 1 }
 *    
 *    _firm:            { type: ObjectId, ref: 'Firm' }
 *    _createdBy:       { type: ObjectId, ref: 'User' }
 *    _lastUpdatedBy:   { type: ObjectId, ref: 'User' }
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class Subscription extends Model {

  static get tableName() {
    return 'subscriptions'
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

module.exports = Subscription; 