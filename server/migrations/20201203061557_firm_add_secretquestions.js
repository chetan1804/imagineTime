exports.up = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.string('secretQuestions').defaultTo('')
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('firms', table => {
        table.dropColumn('secretQuestions')
    })
]);