exports.up = knex => Promise.all([
    knex.schema.table('quicktasks', table => {
        table.string('assureSignTemplateId').defaultTo('')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('quicktasks', table => {
        table.dropColumn('assureSignTemplateId')
    })
]);
