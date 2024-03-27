exports.up = knex => Promise.all([
  knex.schema.table('clients', table => {
    table.string('identifier')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('clients', table => {
    table.dropColumn('identifier')
  })
]);