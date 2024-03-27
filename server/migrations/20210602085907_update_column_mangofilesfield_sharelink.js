
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('sharelinks', table => {
      table.integer('ParentID').nullable()
    }),
    knex.schema.table('sharelinks', table => {
      table.integer('YellowParentID').nullable()
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('sharelinks', table => {
      table.dropColumn('ParentID')
    }),
    knex.schema.table('sharelinks', table => {
      table.dropColumn('YellowParentID')
    }),
  ])
};
