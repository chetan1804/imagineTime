exports.up = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.string('expireLinks').defaultTo('None')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.dropColumn('expireLinks')
    })
]);