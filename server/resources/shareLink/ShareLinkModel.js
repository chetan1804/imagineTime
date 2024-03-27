/**
 * pseudo schema 
 * 
 *    _client:     { type: pointer, ref: 'Client' }
 *    _createdBy:  { type: pointer, ref: 'User' }
 *    _file:       { type: pointer, ref: 'File' }
 *    _files:      [{ type: ObjectId, ref: 'File' }] // specificType
 *    _firm:       { type: pointer, ref: 'Firm' }
 *    _quickTask:  { type: pointer, ref: 'QuickTask' }
 *    expireDate:  { type: Date }
 *    authType:    { type: String, enum: ['none', 'secret-question', 'shared-client-secret', 'tax-id', 'pin'], default: 'tax-id' }
 *    prompt:      { type: String } // this is what we show to the user who lands on the link to enter a password
 *    password:    { type: String }
 *    sentTo:      { type: Array } // an array of email addresses
 *    hex:         { type: String } TODO:  make this forced unique 
 *    type:        { type: String, enum: ['share', 'signature-request', 'file-request'], default: 'share' }
 *    _folder      { type: String }
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class ShareLink extends Model {

  static get tableName() {
    return 'sharelinks'
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

module.exports = ShareLink; 