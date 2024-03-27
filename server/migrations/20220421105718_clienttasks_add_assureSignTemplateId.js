exports.up = knex => Promise.all([
    knex.schema.table('clienttasks', table => {
        table.string('assureSignTemplateId').defaultTo('')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('clienttasks', table => {
        table.dropColumn('assureSignTemplateId')
    })
]);
