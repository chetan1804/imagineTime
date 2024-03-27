exports.up = knex => Promise.all([
  knex.schema.table('tags', table => {
    table.integer('_firm') // optional
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('tags', table => {
    table.dropColumn('_firm')
    table.dropColumn('_createdBy')
  })
]);