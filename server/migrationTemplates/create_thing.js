// nice default "create" schema - replace "thing" below

exports.up = knex => Promise.all([
  knex.schema.createTable('thing', table => {
    table.increments('_id').primary();
    table.timestamps(false, true);
  })
]);

exports.down = knex => Promise.all([
  knex.schema.dropTableIfExists('thing')
]);