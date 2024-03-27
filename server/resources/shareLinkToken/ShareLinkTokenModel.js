/**
 * pseudo schema 
 * 
 *    _client:     { type: pointer, ref: 'Client' }
 *    _firm:  { type: pointer, ref: 'Firm' }
 */

 const knex = require('knex')
 const { Model } = require('objection')
 
 Model.knex(db)
 
 class ShareLinkToken extends Model {
 
   static get tableName() {
     return 'sharelinktokens'
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
 
 module.exports = ShareLinkToken; 