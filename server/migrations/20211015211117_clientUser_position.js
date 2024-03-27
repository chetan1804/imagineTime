exports.up = knex => Promise.all([
    knex.schema.table('clientusers', table => {
        table.string("position");
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.dropTableIfExists('clientusers')
]);