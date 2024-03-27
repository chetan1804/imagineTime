exports.up = knex => Promise.all([
    knex.schema.table('files', table => {
        table.string('_personal').nullable()
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('files', table => {
        table.dropColumn('_personal')
    })
]);