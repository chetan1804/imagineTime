/**
 * pseudo schema 
 * 
 *    _firm:          { type: ObjectId, ref: 'Firm' } 
 *    _user:          { type: ObjectId, ref: 'User' }
 *    _client:        { type: ObjectId, ref: 'Client' }
 *    _staff:         { type: ObjectId, ref: 'Staff' }
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class StaffClient extends Model {

  static get tableName() {
    return 'staffclients'
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
    // TODO: see above as well. can use for joins and stuff
    // See: https://vincit.github.io/objection.js/guide/relations.html#examples
    const Staff = require('../staff/StaffModel')
    return {
      staff: {
        relation: Model.BelongsToOneRelation,
        modelClass: Staff,
        join: {
          from: 'staffclients._staff',
          to: 'staff._id'
        }
      }
    }
  }

  // any additional static methods below

}

module.exports = StaffClient; 