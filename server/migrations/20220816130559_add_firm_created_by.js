exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('firms', table => {
        table.string('created_by').defaultTo('')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('firms')
  ])
};