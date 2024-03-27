
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('notes', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('content', 4095)

      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_client')
      table.foreign('_client').references('_id').inTable('clients')

      table.integer('_file')
      table.foreign('_file').references('_id').inTable('files')
      table.integer('_clientTask')
      table.foreign('_clientTask').references('_id').inTable('clienttasks')
      table.integer('_clientWorkflow')
      table.foreign('_clientWorkflow').references('_id').inTable('clientworkflows')

      table.string('type') // TODO: change to enum once we figure out all the types

    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('notes')
  ])
};

