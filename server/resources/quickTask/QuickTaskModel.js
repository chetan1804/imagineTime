
/**
 * pseudo schema 
 * 
 *    _client:        { type: ObjectId, ref: 'Client' }
 *    _createdBy:     { type: ObjectId, ref: 'User' }
 *    _firm:          { type: ObjectId, ref: 'Firm' }
 *    _returnedFiles: [{ type: ObjectId, ref: 'File' }]
 *    _unsignedFiles: [{ type: ObjectId, ref: 'File' }]
 *    envelopeId:     { type: String }
 *    prompt:         { type: String }
 *    responseDate:   { type: Date }
 *    signingLinks:   [{
 *                      envelopeId:     { type: String }
 *                      signatoryEmail: { type: String }
 *                      url:            { type: String }
 *                    }]
 *    status:         { type: String, enum: ['open', 'closed']}
 *    type:           { type: String, enum: ['file', 'signature']}
 *    visibility:     { type: String, enum: ['active', 'archived']}
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class QuickTask extends Model {

  static get tableName() {
    return 'quicktasks'
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

module.exports = QuickTask; 
