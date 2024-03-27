exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('files', table => {
          table.string('uniqueId').defaultTo('')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('uniqueId')
    })
  ])
}; 