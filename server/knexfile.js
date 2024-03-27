/**
 * this is annoying but this file NEEDS to exist for the knex cli to work
 * however all the info will end up being duplicated from the existing config file
 * so we're going to load it in dynamically from the config instead
 */

let config = require('./config');

module.exports = {

  development: {
    client: 'pg'
    , connection: config['development'].connection
    , migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'pg',
    connection: config['staging'].connection
    , pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  demo: {
    client: 'pg',
    connection: config['demo'].connection
    , pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: config['production'].connection
    , pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
