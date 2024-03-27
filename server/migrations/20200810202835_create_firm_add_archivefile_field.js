exports.up = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.string('archiveFile').defaultTo('None')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.dropColumn('archiveFile')
    })
]);