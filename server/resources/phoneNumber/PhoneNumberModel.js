/**
 * pseudo schema 
 * 
 *    type:     { type: String, enum: ['mobile', 'home', 'work', 'main', 'home fax', 'work fax', 'other fax', 'other']}
 *    number:   { type: String }
 * 
 *    _user:
 *    _firm:
 *    _client:
 * 
 */


const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class PhoneNumber extends Model {

  static get tableName() {
    return 'phonenumbers'
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

module.exports = PhoneNumber; 