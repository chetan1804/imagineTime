exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('firms', table => {
          table.boolean('developer_account').defaultTo(false)
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('firms')
  ])
};