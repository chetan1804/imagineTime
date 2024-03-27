exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('files', table => {
          table.dropColumn('requestedby');
          table.dropColumn('uploadedby');
          table.integer('requestedBy').defaultTo(null)
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('requestedBy')
    })
  ])
}; 