exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('firms', table => {
        table.string('company_name').defaultTo('')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('firms')
  ])
};