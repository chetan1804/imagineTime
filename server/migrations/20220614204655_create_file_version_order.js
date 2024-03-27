exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('files', table => {
            table.integer('versionOrder').defaultTo(null)
        })
    ])
  };
  
exports.down = function(knex, Promise) {
    return Promise.all([
      knex.schema.table('files', table => {
        table.dropColumn('versionOrder')
      })
    ])
}; 