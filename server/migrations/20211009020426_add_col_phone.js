exports.up = knex => Promise.all([
    knex.schema.table('card_details', table => {
        table.string("phone");
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('card_details')
]);