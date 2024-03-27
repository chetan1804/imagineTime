exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('folderpemission', table => {
          table.string('profile').defaultTo('')
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('folderpemission', table => {
      table.dropColumn('profile')
    })
  ])
}; 