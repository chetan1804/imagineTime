// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
  knex.schema.createTable('sharelinks', table => {
    table.increments('_id').primary();
    table.timestamps(false, true);
    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')
    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
    table.date('expireDate')
    // table.enu('authType', ['none', 'secret-question', 'tax-id', 'pin'])
    table.string('authType')
    table.string('password')
    table.string('hex')
    table.unique('hex')
    table.string('url') 
    // table.enu('type', ['share', 'request'])
    table.string('type')
    table.string('prompt') // goes with password, i.e. "What year were you born?" 
    table.specificType('_files', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
    
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTableIfExists('sharelinks')
]);