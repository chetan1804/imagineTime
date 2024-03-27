// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
    knex.schema.createTable('taskactivity', table => {
      table.increments('_id').primary();
      table.timestamps(false, true);
      table.integer('_createdBy')
      table.foreign('_createdBy').references('_id').inTable('users')
      table.integer('_requestTask')
      table.foreign('_requestTask').references('_id').inTable('requesttask')
      table.specificType('_file', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
      table.string('text')
      table.string('note')
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('taskactivity')
]);