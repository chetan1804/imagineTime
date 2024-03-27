exports.up = knex => Promise.all([
    knex.schema.table('card_details', table => {
        table.string("merchant_id", 1000);
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('card_details')
]);