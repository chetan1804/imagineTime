exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('clientusers', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_client')
      table.foreign('_client').references('_id').inTable('clients')
      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')

      table.string('status').defaultTo('active')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('clientusers')
  ])
};

