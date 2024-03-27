// add boolean for eSigAccess for firms.

exports.up = knex => Promise.all([
  knex.schema.table('firms', table => {
    table.boolean('eSigAccess').defaultTo(false)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('firms', table => {
    table.dropColumn('eSigAccess')
  })
]);