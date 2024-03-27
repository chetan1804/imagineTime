const knex = require('knex')
const { Model } = require('objection')

Model.knex(db)

class Product extends Model {

  static get tableName() {
    return 'products'
  }

  static get idColumn() {
    // manually set this to interact better with yote front end
    return '_id';
  }

  static get jsonSchema() {
    // see https://github.com/Vincit/objection.js/blob/master/examples/express-es6/models/Animal.js
    return {
      type: 'object',
      required: ['title'],
      properties: {
        _id: { type: 'integer' },
        title: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: 'string', minLength: 1, maxLength: 255 }
      }
    }
  }

  static get defaultObject() {
    // define defaults
    return {
      title: ''
      , description: ''
    }
  }

  static get relationMappings() {
    return {
      // TODO: see above as well. can use for joins and stuff
    }
  }

  // any additional static methods below

}

module.exports = Product; 