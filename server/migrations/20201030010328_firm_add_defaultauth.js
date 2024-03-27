exports.up = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.string('authDefault').defaultTo('Direct')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.dropColumn('authDefault')
    })
]);