exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable('invoice', (table) => {
        table.increments('_id').primary()
        table.timestamps(false, true)
        table.string('bill_from')
        table.string('bill_to')
        table.date('invoice_date')
        table.date('payment_due_date')
        table.string('invoice_number')
        table.string('terms')
        table.string('discount')
        table.string('sales_tax')
  
        // TODO:
        // location/coordinates
        // optional references
      })
    ])
  };

  exports.down = function (knex, Promise) {
    return Promise.all([knex.schema.dropTable('invoice')])
  };