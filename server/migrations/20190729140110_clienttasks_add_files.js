exports.up = knex => Promise.all([
  knex.schema.table('clienttasks', table => {
    table.specificType('_files', 'INT[]').defaultTo('{}') //https://stackoverflow.com/questions/30933266/empty-array-as-postgresql-array-column-default-value
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('clienttasks', table => {
    table.dropColumn('_files')
  })
]);