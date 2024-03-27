exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('clientworkflows', table => {
      table.integer('_parent') // optional
      table.foreign('_parent').references('_id').inTable('clientworkflows')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('clientworkflows', table => {
      table.dropColumn('_parent')
    })
  ])
};
