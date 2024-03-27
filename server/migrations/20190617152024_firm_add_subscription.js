exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('firms', table => {
      table.integer('_subscription')
      table.foreign('_subscription').references('_id').inTable('subscriptions')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('firms', table => {
      table.dropColumn('_subscription')
    })
  ])
};
