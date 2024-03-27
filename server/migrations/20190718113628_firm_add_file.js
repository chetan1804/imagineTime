exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('firms', table => {
      table.integer('_file')
      table.foreign('_file').references('_id').inTable('files')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('firms', table => {
      table.dropColumn('_file')
    })
  ])
};
