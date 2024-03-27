exports.up = knex => Promise.all([
    knex.schema.table('sharelinks', table => {
        table.integer('attempt')
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.table('sharelinks', table => {
        table.dropColumn('attempt')
    })
]);