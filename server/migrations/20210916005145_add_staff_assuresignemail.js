
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('staff', table => {
      table.string('eSigEmail').defaultTo('')
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('staff')
  ])
};
