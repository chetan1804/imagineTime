
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('subscriptions', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)

      table.string('status').defaultTo('trialing')
      table.integer('licenses').defaultTo(1)

      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_lastUpdatedBy')
      table.foreign('_lastUpdatedBy').references('_id').inTable('users')

      // TODO: plans

    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('subscriptions')
  ])
};

