/**
 * pseudo schema 
 * 
 *    description:            { type: String } 
 *    title:                  { type: String } 
 *    status:                 { type: String, enu: ['archived', 'deleted', 'draft', 'published'], default: 'draft' }
 *    
 *    items:                  [{ 
 *                               _clientTask:       { type: ObjectId} 
 *                               _clientWorkflow:   { type: ObjectId} // sub-tasks 
 *                            }]
 *    _createdBy:             { type: ObjectId, ref: 'User' }
 *    _firm:                  { type: ObjectId, ref: 'Firm' }
 *    _client:                { type: ObjectId, ref: 'Client' }
 *    _tags:                  [{ type: Int }] // specificType
 *
 *    _parent:                { type: ObjectId, ref: 'ClientWorkflow' } // from migration file
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class ClientWorkflow extends Model {

  static get tableName() {
    return 'clientworkflows'
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
      items: []
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

module.exports = ClientWorkflow; 