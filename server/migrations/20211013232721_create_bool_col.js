exports.up = knex => Promise.all([
    knex.schema.table('invoice', table => {
        table.boolean("isPaid").defaultTo(false);
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('invoice')
]);