
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('folderpermission', table => {
      table.dropColumn('allowRead')
      table.dropColumn('allowCreate')
      table.dropColumn('allowDelete')
      table.dropColumn('allowUpload')
      table.dropColumn('allowDownload')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([])
};
