// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
    knex.schema.createTable('requestfolder', table => {
      table.increments('_id').primary();
      table.timestamps(false, true);
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_client').nullable()
      table.foreign('_client').references('_id').inTable('clients')
      table.integer('_personal').nullable()
      table.foreign('_personal').references('_id').inTable('users')

      table.string('name').nullable()      
      table.string('type').nullable()
    })
]);

exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('requestfolder')
]);