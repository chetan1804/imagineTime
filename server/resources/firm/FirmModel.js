/**
 * pseudo schema 
 * 
 *    name:               { type: String }
 *    logoUrl             { type: String, default: '' }
 *    domain:             { type: String }
 *    eSigAccess:         { type: Boolean }
 *    _file:              { type: ObjectId, ref: 'File' } // from migration file
 *    _primaryAddress:    { type: ObjectId, ref: 'Address } 
 *    _primaryPhone:      { type: ObjectId, ref: 'PhoneNumber } 
 *    _subscription:      { type: ObjectId, ref: 'Subscription' } // from migration file
 *    // assuresign credentials
 *    contextIdentifier:  { type: String }
 *    contextUsername:    { type: String }
 *    apiUsername:        { type: String }
 *    apiKey:             { type: String }
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class Firm extends Model {

  static get tableName() {
    return 'firms'
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
      //required: ['name'],
      properties: {
        _id: { type: 'integer' },
        name: { type: 'string', minLength: 1, maxLength: 255 },
      }
    }
  }

  static get defaultObject() {
    // define defaults
    return {
      name: ''
      , logoUrl: ''
      , created_by: ''
    }
  }

  static get relationMappings() {
    return {
      // TODO: see above as well. can use for joins and stuff
    }
  }

  // any additional static methods below

}

module.exports = Firm; 