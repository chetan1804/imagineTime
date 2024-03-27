// nice default "create" schema - replace "thing" below
exports.up = knex => Promise.all([
    knex.schema.createTable('foldertemplates', table => {
      table.increments('_id').primary();
      table.timestamps(false, true);
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.specificType('_user', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
      table.string('name')
      table.string('description')
      table.json('subfolder').defaultTo(JSON.stringify([]))
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTable('foldertemplates')
]);