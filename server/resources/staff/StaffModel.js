/**
 * pseudo schema 
 * 
 *    _firm:       { type: pointer, ref: 'Firm' }
 *    _user:       { type: pointer, ref: 'User' }
 *    owner:       { type: boolean, default: false }
 *    status:      { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' } 
 * 
 * TODO: do we need invite status or something? 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class Staff extends Model {

  static get tableName() {
    return 'staff'
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

module.exports = Staff; 