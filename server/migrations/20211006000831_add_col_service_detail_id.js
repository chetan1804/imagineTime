exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice_details", (table) => {
        table.integer('invoiceDetail_id')
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice_details')
  ]);
