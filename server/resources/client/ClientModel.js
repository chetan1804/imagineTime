/**
 * pseudo schema 
 * 
 *    name:             { type: String }
 *    website:          { type: String, default: '' }
 *    accountType:      { type: String, default: '' }
 *    engagementTypes:  { type: String } // specificType
 *    onBoarded:        { type: Boolean, default: false }
 *    _firm:            { type: ObjectId, ref: 'Firm' }
 *    
 *    _primaryContact:  { type: ObjectId, ref: 'User' }
 * 
 *    NOTE 1.3.2 - this should not be a user object, it should be a ClientUser. 
 * 
 *    _primaryAddress:  { type: ObjectId, ref: 'Address' }
 *    _primaryPhone:    { type: ObjectId, ref: 'PhoneNumber' }
 *    sharedSecretPrompt: { type: String, default: '' }
 *    sharedSecretAnswer: { type: String, default: '' } // To be hashed on the front end before being sent to the server.
 * 
 *    status: { Type: String, default: 'visible'} visiblie, archived, deleted
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class Client extends Model {

  static get tableName() {
    return 'clients'
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

  // Right now the logic below is handled by /server/migrations/
  // But if we ever want to trigger some other logic on certain events
  // here is one way we could do it.
  // See: https://vincit.github.io/objection.js/recipes/timestamps.html
  // Also: https://vincit.github.io/objection.js/api/model/instance-methods.html
  // $beforeInsert() {
  //   this.created_at = new Date().toISOString();
  // }

  // $beforeUpdate() {
  //   this.updated_at = new Date().toISOString();
  // }
}

module.exports = Client; 