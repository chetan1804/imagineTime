exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('sharelinks', table => {
            table.boolean('sN_viewed').defaultTo(false)
            table.boolean('sN_downloaded').defaultTo(false)
            table.boolean('sN_upload').defaultTo(false)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('sharelinks')
    ])
};