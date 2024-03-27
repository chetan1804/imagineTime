
exports.up = knex => Promise.all([
  knex.schema.table('firms', table => {
    table.string('contextIdentifier') // DocumentNOW Account Context Identifier. Located under account settings.
    table.string('contextUsername')   // The email address entered as the username under account users.
    table.string('apiKey')            // The API key generated when you create an API user on AssureSign.
    table.string('apiUsername')       // The API username generated when you create an API user on AssureSign.
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('firms', table => {
    table.dropColumn('contextIdentifier')
    table.dropColumn('contextUsername')
    table.dropColumn('apiKey')
    table.dropColumn('apiUsername')
  })
]);