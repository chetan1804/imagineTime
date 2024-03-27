exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('firms', table => {
          table.boolean('outward_firm').defaultTo(false)
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('firms')
  ])
};