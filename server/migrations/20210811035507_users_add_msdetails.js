
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('users', table => {
      table.string('MSUsername').defaultTo('')
      table.string('MSUniqueId').defaultTo('')
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users')
  ])
};
