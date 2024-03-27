
exports.up = knex => Promise.all([
  knex.schema.table('files', table => {
    table.string('prefix')
    table.string('folderString')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('files', table => {
    table.dropColumn('prefix')
    table.dropColumn('folderString')
  })
]);