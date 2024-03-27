exports.up = knex => Promise.all([
    knex.schema.table('sharelinks', table => {
        table.string('_personal').nullable()
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('sharelinks', table => {
        table.dropColumn('_personal')
    })
]);