exports.up = knex => Promise.all([
    knex.schema.createTable('docutemplates', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('filename')
      table.string('name')
      table.string('fileExtension')
      table.string('category')
      table.string('contentType')
      table.string('status')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTable('docutemplates')
]);
