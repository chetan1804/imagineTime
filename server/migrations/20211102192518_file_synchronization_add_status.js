
exports.up = knex => Promise.all([
    knex.schema.table('filesynchronization', table => {
        table.string("status");
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('filesynchronization')
]);