exports.up = knex => Promise.all([
  knex.schema.table('clientworkflowtemplates', table => {
    table.integer('_parent') // optional
    table.foreign('_parent').references('_id').inTable('clientworkflowtemplates')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('clientworkflowtemplates', table => {
    table.dropColumn('_parent')
  })
]);