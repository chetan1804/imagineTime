
exports.up = knex => Promise.all([
  knex.schema.table('sharelinks', table => {
    table.json('sentTo').defaultTo(JSON.stringify([]))
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('sharelinks', table => {
    table.dropColumn('sentTo')
  })
]);