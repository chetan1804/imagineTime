exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('products', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('description')
      table.string('title')
      table.unique('title')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('products')
  ])
};
