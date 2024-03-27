exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('sharelinktokens', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_client')
      table.foreign('_client').references('_id').inTable('clients')
      table.string('token', 255)
      table.string('queryParemeters', 4095)
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('sharelinktokens')
  ])
};

