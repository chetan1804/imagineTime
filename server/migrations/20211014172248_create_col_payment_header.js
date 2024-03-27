exports.up = knex => Promise.all([
    knex.schema.table('payment_header', table => {
        table.float("amount");
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('payment_header')
]);