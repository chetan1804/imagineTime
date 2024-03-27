/**
 * pseudo schema 
 * 
 *    _firm:                     { type: ObjectId, ref: 'Firm' }
 *    email_useLoggedInUserInfo: { type: Boolean, default: true }
 *    email_fromName:            { type: String, default: null }
 *    email_replyTo              { type: String, default: null }
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class FirmSetting extends Model {

  static get tableName() {
    return 'firm_settings'
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
      //required: ['_firm', 'email_useLoggedInUserInfo'],
      properties: {
        _id: { type: 'integer' },
        _firm: { type: ['integer', 'null'] },
        email_useLoggedInUserInfo: { type: ['boolean', true] },
        email_fromName: { type: 'string', minLength: 0, maxLength: 255 },
        email_replyTo: { type: 'string', minLength: 0, maxLength: 255 }
      }
    }
  }

  static get defaultObject() {
    // define defaults
    return {
      _firm: null
      , email_useLoggedInUserInfo: true
      , email_fromName: null
      , email_replyTo: null
    }
  }

  static get relationMappings() {
    return {
      // TODO: see above as well. can use for joins and stuff
    }
  }

  // any additional static methods below

}

module.exports = FirmSetting; 