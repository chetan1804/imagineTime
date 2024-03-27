exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('sharelinks', table => {
            table.boolean('sN_signingCompleted').defaultTo(true)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('sharelinks')
    ])
};