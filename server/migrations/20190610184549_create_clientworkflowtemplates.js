
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('clientworkflowtemplates', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)

      table.string('description', 1023)
      table.string('title')
      table.string('purpose') // Visible to the firm. Describes the purpose of this template.
      table.enu('status', ['archived', 'draft', 'published']).defaultTo('draft')
      table.json('items').defaultTo(JSON.stringify([]))

      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.specificType('_tags', 'INT[]').defaultTo('{}')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('clientworkflowtemplates')
  ])
};

','