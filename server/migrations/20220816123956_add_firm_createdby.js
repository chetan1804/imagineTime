exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('firms', table => {
        table.dropColumn('created_by')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('firms')
  ])
};