exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice_details", (table) => {
        table.string('stax_payment_method_id', 1000)
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice_details')
  ]);
