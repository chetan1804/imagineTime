
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('clienttasktemplates', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)

      table.string('title')
      table.string('description', 1023)
      table.date('dueDate')
      table.string('type')
      table.boolean('needsApproval').defaultTo(false)
      table.integer('_clientWorkflowTemplate')
      table.foreign('_clientWorkflowTemplate').references('_id').inTable('clientworkflowtemplates')
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('clienttasktemplates')
  ])
};