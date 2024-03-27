exports.up = knex => Promise.all([
    knex.schema.table('invoice', table => {
        table.string("paynow_token", 1000);
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('invoice')
]);