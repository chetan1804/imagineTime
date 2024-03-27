exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.alterTable('files', table => {
          table.string('uploadName').alter()
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('uploadName')
    })
  ])
}; 