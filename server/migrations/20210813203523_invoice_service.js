exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable('invoice_service', (table) => {
        table.increments('_id').primary()
        table.timestamps(false, true)
        table.integer('invoice_id')
        table.foreign('invoice_id').references('_id').inTable('invoice')
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
    return Promise.all([knex.schema.dropTable('invoice_service')])
  };