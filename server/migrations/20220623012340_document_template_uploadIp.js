// add ip address to file uploads

exports.up = knex => Promise.all([
    knex.schema.table('docutemplates', table => {
      table.string('uploadIp')
    })
  ]);
  
exports.down = knex => Promise.all([
    knex.schema.table('docutemplates', table => {
      table.dropColumn('uploadIp')
    })
]);