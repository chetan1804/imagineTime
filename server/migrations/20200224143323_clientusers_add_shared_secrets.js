// add fields for client secret question and answer.

exports.up = knex => Promise.all([
  knex.schema.table('clientusers', table => {
    table.string('sharedSecretPrompt')
    table.string('sharedSecretAnswer')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('clientusers', table => {
    table.dropColumn('sharedSecretPrompt')
    table.dropColumn('sharedSecretAnswer')
  })
]);