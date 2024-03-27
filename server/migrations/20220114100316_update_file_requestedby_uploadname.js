exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('files', table => {
          table.string('requestedby').defaultTo('')
          table.string('uploadedby').defaultTo('')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('requestedby')
      table.dropColumn('uploadedby')
    })
  ])
}; 