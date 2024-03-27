exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('clients', table => {
        table.string('externalId').defaultTo('');
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('clients')
  ])
};