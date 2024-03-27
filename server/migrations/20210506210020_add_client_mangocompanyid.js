
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('clients', table => {
      table.integer('mangoCompanyID').nullable()
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('clients', table => {
      table.dropColumn('mangoCompanyID')
    }),
  ])
};
