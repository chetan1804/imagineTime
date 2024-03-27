// add fields for user secret question and answer.

exports.up = knex => Promise.all([
  knex.schema.table('users', table => {
    table.string('sharedSecretPrompt')
    table.string('sharedSecretAnswer')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('users', table => {
    table.dropColumn('sharedSecretPrompt')
    table.dropColumn('sharedSecretAnswer')
  })
]);