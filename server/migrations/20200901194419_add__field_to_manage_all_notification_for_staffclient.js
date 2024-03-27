exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('staffclients', table => {
            table.boolean('sN_viewed').defaultTo(true)
            table.boolean('sN_downloaded').defaultTo(true)
            table.boolean('sN_upload').defaultTo(true)
            table.boolean('sN_signingCompleted').defaultTo(true)
            table.boolean('sN_leaveComment').defaultTo(true)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('staffclients')
    ])
};


