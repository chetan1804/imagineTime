/**
 * pseudo schema 
 * 
 *    content:          { type: String }
 
 *    _createdBy:       { type: ObjectId, ref: 'User' }
 *    _client:          { type: ObjectId, ref: 'Client' }
 *    _firm:            { type: ObjectId, ref: 'Firm' }
 *    _clientPost:      { type: ObjectId, ref: 'ClientPost' }
 * 
 */

const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class ClientPostReply extends Model {

  static get tableName() {
    return 'clientpostreplies'
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


  // instance methods

  // async $afterUpdate(options, queryContext) {
  //   await super.$afterUpdate(options, queryContext);
  //   console.log('queryContext', queryContext);
  //   console.log('this', this) // The updated fields on ClientPostReply
  //   console.log('options.old', options.old); // The previous version of this ClientPostReply. This is only populated if we use $query on the update method.
  //   /**
  //    * It could make sense to trigger activity creation here. Any time a ClientPostReply is updated
  //    * this method will run. We can compare the updated values to the previous values and decide
  //    * what type of activity to build.
  //    * More info: https://vincit.github.io/objection.js/api/model/instance-methods.html#afterupdate
  //    */
  // }
  
}

module.exports = ClientPostReply; 