/**
 * pseudo schema 
 * 
 *    description:            { type: String }
 *    title:                  { type: String }
 *    purpose:                { type: String } // visible to the firm. Describes the purpose of this workflow.
 *    status:                 { type: String, enu: ['archived', 'draft', 'published'], default: 'draft' }
 *    items:                  [{ _clientTaskTemplate: id }]
 *
 *    _createdBy:             { type: ObjectId, ref: 'User' }
 *    _firm:                  { type: ObjectId, ref: 'Firm' }
 *
 *    _tags:                  [{ type: Int }] // specificType
 *
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class ClientWorkflowTemplate extends Model {

  static get tableName() {
    return 'clientworkflowtemplates'
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

module.exports = ClientWorkflowTemplate;