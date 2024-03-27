
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('users', table => {
      table.string('ssotoken').defaultTo('')
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users')
  ])
};
