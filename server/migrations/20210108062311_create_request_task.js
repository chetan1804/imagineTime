// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
    knex.schema.createTable('requesttask', table => {
      table.increments('_id').primary();
      table.timestamps(false, true);
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_request')
      table.foreign('_request').references('_id').inTable('request')
      table.string('status').defaultTo("unpublished")
      table.string('category').nullable()
      table.json('assignee').defaultTo(JSON.stringify([]))
      table.date('dueDate')
      table.date('responseDate').nullable()
      table.string('hex')
      table.unique('hex')
      table.string('url') 
      table.specificType('_attachedmentFiles', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
      table.specificType('_returnedFiles', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('requesttask')
]);