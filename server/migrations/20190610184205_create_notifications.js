
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('notifications', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('content')
      table.string('link')
      table.boolean('acknowledged').defaultTo(false)

      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')

      table.integer('_activity')
      table.foreign('_activity').references('_id').inTable('activities')
      table.integer('_clientActivity')
      table.foreign('_clientActivity').references('_id').inTable('clientactivities')

    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('notifications')
  ])
};

