
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('files', table => {
      table.integer('ParentID').nullable()
    }),
    knex.schema.table('files', table => {
      table.integer('YellowParentID').nullable()
    }),
    knex.schema.table('files', table => {
      table.integer('DMSParentID').nullable()
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('files', table => {
      table.dropColumn('ParentID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('YellowParentID')
    }),
    knex.schema.table('files', table => {
      table.dropColumn('DMSParentID')
    })
  ])
};
