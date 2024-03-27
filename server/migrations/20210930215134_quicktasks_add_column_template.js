exports.up = knex => Promise.all([
    // knex.schema.table('quicktasks', table => {
    //     table.string('template').defaultTo('')
    // })
]);

exports.down = knex => Promise.all([
    // knex.schema.table('quicktasks', table => {
    //     table.dropColumn('template')
    // })
]);