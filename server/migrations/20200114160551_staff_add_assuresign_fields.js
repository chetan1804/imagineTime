
exports.up = knex => Promise.all([
  knex.schema.table('staff', table => {
    table.string('contextUsername')   // The email address entered as the username under account users on AssureSign.
    table.string('apiKey')            // The API key generated when you create an API user on AssureSign.
    table.string('apiUsername')       // The API username generated when you create an API user on AssureSign.
    table.boolean('eSigAccess').defaultTo(false)
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('staff', table => {
    table.dropColumn('contextUsername')
    table.dropColumn('apiKey')
    table.dropColumn('apiUsername')
    table.dropColumn('eSigAccess')
  })
]);