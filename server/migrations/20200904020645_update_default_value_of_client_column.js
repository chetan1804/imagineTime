exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('clients', table => {
            table.boolean('sN_viewed').defaultTo(false).alter()
            table.boolean('sN_downloaded').defaultTo(false).alter()

        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('clients')
    ])
};