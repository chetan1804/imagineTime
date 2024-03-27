// add boolean for sendNotifs for staffClients.

exports.up = knex => Promise.all([
  knex.schema.table('staffclients', table => {
    table.boolean('sendNotifs').defaultTo(true)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('staffclients', table => {
    table.dropColumn('sendNotifs')
  })
]);