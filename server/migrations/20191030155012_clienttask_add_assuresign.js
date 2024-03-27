
exports.up = knex => Promise.all([
  knex.schema.table('clienttasks', table => {
    table.string('envelopeId')
    // An array of objects returned by assuresign.
    table.json('signingLinks').defaultTo(JSON.stringify([]))
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('clienttasks', table => {
    table.dropColumn('envelopeId')
    table.dropColumn('signingLinks')
  })
]);