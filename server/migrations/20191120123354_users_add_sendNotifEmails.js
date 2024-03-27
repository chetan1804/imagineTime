// add boolean for notification email preferences.

exports.up = knex => Promise.all([
  knex.schema.table('users', table => {
    table.boolean('sendNotifEmails').defaultTo(true)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('users', table => {
    table.dropColumn('sendNotifEmails')
  })
]);