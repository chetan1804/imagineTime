
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('mangoDMSParentID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('mangoFileID')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('mangoDMSParentID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('mangoFileID')
    })
  ])
};
