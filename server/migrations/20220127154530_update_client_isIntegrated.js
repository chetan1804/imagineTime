
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('clients', table => {
      table.boolean('isIntegrated').defaultTo(false)
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('clients', table => {
      table.dropColumn('isIntegrated')
    }),
  ])
};
