exports.up = knex => Promise.all([
    knex.schema.table('quicktasks', table => {
        table.string('selectedStaff').defaultTo('')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('quicktasks', table => {
        table.dropColumn('selectedStaff')
    })
]);