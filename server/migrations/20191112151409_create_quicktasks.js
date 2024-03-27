// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
  knex.schema.createTable('quicktasks', table => {
    table.increments('_id').primary();
    table.timestamps(false, true);

    table.integer('_client')
    table.foreign('_client').references('_id').inTable('clients')
    table.integer('_createdBy')
    table.foreign('_createdBy').references('_id').inTable('users')
    table.integer('_firm')
    table.foreign('_firm').references('_id').inTable('firms')
    table.specificType('_returnedFiles', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
    table.specificType('_unsignedFiles', 'INT[]').defaultTo('{}')
    table.string('envelopeId')
    table.string('prompt')
    table.date('responseDate')
    table.json('signingLinks').defaultTo(JSON.stringify([]))
    table.string('status') // 'open', 'closed'
    table.string('type') // 'file', 'signature'
    table.string('visibility').defaultTo('active') // 'active', 'archived'
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTableIfExists('quicktasks')
]);