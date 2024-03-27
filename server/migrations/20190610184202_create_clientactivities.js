
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('clientactivities', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)

      table.string('text')
      table.string('link')
      table.boolean('isReminder').defaultTo(false)
      table.boolean('sendEmail').defaultTo(false)
      
      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')
      table.integer('_client')
      table.foreign('_client').references('_id').inTable('clients')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')

      // gonna ignore the object/verb stuff for the time being

    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('clientactivities')
  ])
};

