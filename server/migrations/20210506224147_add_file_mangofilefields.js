
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('files', table => {
      table.integer('mangoCompanyID').nullable()
    }),
    knex.schema.table('files', table => {
      table.integer('mangoClientID').nullable()
    }),
    knex.schema.table('files', table => {
      table.integer('mangoFileID').nullable()
    }),
    knex.schema.table('files', table => {
      table.integer('mangoDMSParentID').nullable()
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('mangoCompanyID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('mangoClientID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('mangoFileID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('mangoDMSParentID')
    })
  ])
};
