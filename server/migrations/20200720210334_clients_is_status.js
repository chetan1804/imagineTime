exports.up = knex => Promise.all([
  knex.schema.table('clients', table => {
      table.string('status').defaultTo('visible')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('clients', table => {
      table.dropColumn('status').defaultTo('visible')
  })
]);