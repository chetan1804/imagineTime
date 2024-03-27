exports.up = knex => Promise.all([
    knex.schema.table('payment_header', table => {
        table.integer("invoice_id");
        table.integer("invoice_number");
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('payment_header')
]);