// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
    knex.schema.createTable('request', table => {
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
      table.specificType('delegatedAdmin', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
    })
  ]);
  
  exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('request')
  ]);