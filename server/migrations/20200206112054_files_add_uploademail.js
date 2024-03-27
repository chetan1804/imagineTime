
exports.up = knex => Promise.all([
  knex.schema.table('files', table => {
    table.string('uploadEmail') // entered by the user when a file is uploaded via sharelink with no login.
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('files', table => {
    table.dropColumn('uploadEmail')
  })
]);