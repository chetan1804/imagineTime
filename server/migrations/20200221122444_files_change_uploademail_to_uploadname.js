// renaming uploadEmail to uploadName
exports.up = knex => Promise.all([
  knex.schema.table('files', table => {
    table.renameColumn('uploadEmail', 'uploadName') // entered by the user when a file is uploaded via sharelink with no login.
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('files', table => {
    table.renameColumn('uploadName', 'uploadEmail')
  })
]);