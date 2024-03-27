exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('clients', table => {
            table.boolean('sN_viewed').defaultTo(false)
            table.boolean('sN_downloaded').defaultTo(false)
            table.boolean('sN_upload').defaultTo(true)
            table.boolean('sN_signingCompleted').defaultTo(true)
            table.boolean('sN_leaveComment').defaultTo(true)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('clients')
    ])
};