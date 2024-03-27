exports.up = knex => Promise.all([
    knex.schema.createTable('filesynchronization', table => {
        table.increments('_id').primary();
        table.timestamps(false, true);
        table.integer('_file');
        table.foreign('_file').references('_id').inTable('files');
        table.integer('_user');
        table.foreign('_user').references('_id').inTable('users');
        table.boolean('ison').defaultTo(true);
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('filesynchronization')
]);