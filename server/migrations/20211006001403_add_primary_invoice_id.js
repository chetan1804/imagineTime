exports.up = knex => Promise.all([
    knex.schema.table('invoice', table => {
        table.increments("invoice_id").primary();
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('invoice')
]);