exports.up = knex => Promise.all([
  knex.schema.table('sharelinks', table => {
    table.integer('_quickTask') // optional
    table.foreign('_quickTask').references('_id').inTable('quicktasks')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('sharelinks', table => {
    table.dropColumn('_quickTask')
  })
]);