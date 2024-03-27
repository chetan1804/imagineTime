
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('firms', table => {
      table.integer('mangoCompanyID').nullable()
    }),
    knex.schema.table('firms', table => {
      table.string('mangoApiKey').defaultTo('')
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('firms', table => {
      table.dropColumn('mangoCompanyID')
    }),
    knex.schema.table('firms', table => {
      table.dropColumn('mangoApiKey')
    }),
  ])
};
