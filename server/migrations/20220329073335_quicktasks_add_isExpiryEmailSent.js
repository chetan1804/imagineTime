exports.up = knex => Promise.all([
    knex.schema.table('quicktasks', table => {
        table.boolean('isExpiryEmailSent').defaultTo(false)
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('quicktasks', table => {
        table.dropColumn('isExpiryEmailSent')
    })
]);
