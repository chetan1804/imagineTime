exports.up = knex => Promise.all([
    knex.schema.table('invoice_details', table => {
        table.increments('invoiceDetail_id').primary();
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('invoice_details')
]);