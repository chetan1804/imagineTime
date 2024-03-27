exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable('service', (table) => {
        table.increments('_id').primary()
        table.timestamps(false, true)
        table.string('service')
        table.string('description')
        table.string('price')
  
        // TODO:
        // location/coordinates
        // optional references
      })
    ])
  };

  exports.down = function (knex, Promise) {
    return Promise.all([knex.schema.dropTable('service')])
  };