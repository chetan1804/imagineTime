// nice default "add column" schema - replace "thing" and "column" below

exports.up = knex => Promise.all([
  knex.schema.table('thing', table => {
    table.string('column')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('thing', table => {
    table.dropColumn('column')
  })
]);