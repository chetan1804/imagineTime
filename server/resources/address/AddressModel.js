/**
 * pseudo schema 
 * 
 *    city:               { type: String }
 *    country:            { type: String }
 *    formatted_address:  { type: String }
 *    localTZ:            { type: String }
 *    postal:             { type: String }
 *    state:              { type: String }
 *    street1:            { type: String }
 *    street2:            { type: String }
 * 
 *    _user:
 *    _firm:
 *    _client:
 * 
 */


const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class Address extends Model {

  static get tableName() {
    return 'addresses'
  }

  static get idColumn() {
    // manually set this to interact better with yote front end
    return '_id';
  }

  static get jsonSchema() {
    // see https://github.com/Vincit/objection.js/blob/master/examples/express-es6/models/Animal.js
    return {
      // MUST BE CHANGED FOR EACH RESOURCE
      type: 'object',
      properties: {
        _id: { type: 'integer' },
        // city: { type: 'string', minLength: 1, maxLength: 255 },
      }
    }
  }

  static get defaultObject() {
    // define defaults
    return {
      city: ''
      , country: ''
      , formatted_address: ''
      , localTZ: ''
      , postal: ''
      , state: ''
      , street1: ''
      , street2: ''
    }
  }

  static get relationMappings() {
    return {
      // TODO: see above as well. can use for joins and stuff
    }
  }

  // any additional static methods below

}

module.exports = Address; 