exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('firms', table => {
          table.boolean('tcFileAccess').defaultTo(false)
          table.string('tcContents', 65535).defaultTo('')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('firms')
  ])
};