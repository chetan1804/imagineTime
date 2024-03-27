exports.up = knex => Promise.all([
    knex.schema.table('card_details', table => {
        table.string("email");
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('card_details')
]);