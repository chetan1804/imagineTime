/**
 * pseudo schema 
 * 
 *    username:          { type: String } 
 *    firstname:         { type: String }
 *    lastname:          { type: String }
 *    password_salt:     { type: String, 511 }
 *    password_hash:     { type: String }
 *    admin:             { type: boolean, default: false }
 *    onBoarded:         { type: boolean, default: false }
 *    
 *    resetPasswordTime: { type: Date }
 *    resetPasswordHex:  { type: String }
 *
 *    _primaryAddress:   { type: ObjectId, ref: 'Address' }
 *    _primaryPhone:     { type: ObjectId, ref: 'PhoneNumber' }
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

// get application secrets
let secrets = require('../../config')[process.env.NODE_ENV].secrets;
let tokenSecret = secrets.tokenSecret; // Or generate your own randomized token here.
let crypto = require('crypto');

Model.knex(db)
class User extends Model {

  static get tableName() {
    return 'users'
  }

  static get idColumn() {
    return '_id';
  }

  static get jsonSchema() {
    // // from objection repo:
    // Optional JSON schema. This is not the database schema!
    // No tables or columns are generated based on this. This is only
    // used for input validation. Whenever a model instance is created
    // either explicitly or implicitly it is checked against this schema.
    // See http://json-schema.org/ for more info.

    // also see https://github.com/Vincit/objection.js/blob/master/examples/express-es6/models/Animal.js
    return {
      type: 'object',
      required: ['username'],
      properties: {
        id: { type: 'integer' },
        username: { type: 'string', minLength: 1, maxLength: 255 },
      }
    }
  }

  static get relationMappings() {
    return {
      // TODO: see above as well. can use for joins and stuff
    }
  }

  // USER MODEL FUNCTIONS
  // TODO: token stuff for mobile, probably not need for this project

  static hasRole(user, role) {
    return user.role.includes(role)
  }

  static authenticate(user, password) {
    return this.hashPassword(user.password_salt, password) === user.password_hash;
  }

  static createPasswordSalt() {
    return crypto.randomBytes(256).toString('base64');
  }

  static hashPassword(salt, password) {
    if(salt && password) {
      var hmac = crypto.createHmac('sha1', salt);
      return hmac.update(password).digest('hex');
    } else {
      return false;
    }
  }

}

module.exports = User; 