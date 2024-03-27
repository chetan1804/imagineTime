exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('staff', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')
      table.boolean('owner').defaultTo(false)
      table.string('status').defaultTo('active')

      // TODO: enum on status
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('staff')
  ])
};

