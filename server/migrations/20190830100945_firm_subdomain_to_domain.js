exports.up = knex => Promise.all([
  knex.schema.table('firms', table => {
    table.dropColumn('subdomain')
    table.string('domain')
  })
]);

exports.down = knex => Promise.all([
  knex.schema.table('firms', table => {
    table.dropColumn('domain')
    table.string('subdomain')  
  })
]);