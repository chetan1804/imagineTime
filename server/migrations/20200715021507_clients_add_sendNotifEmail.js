exports.up = knex => Promise.all([
    knex.schema.table('clients', table => {
        table.boolean('sendNotifEmails').defaultTo(false)
    })
]);
  
exports.down = knex => Promise.all([
    knex.schema.table('clients', table => {
        table.dropColumn('sendNotifEmails').defaultTo(false)
    })
]);