exports.up = knex => Promise.all([
    knex.schema.table('payment_header', table => {
        table.string("StaxID", 1000);
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('payment_header')
]);