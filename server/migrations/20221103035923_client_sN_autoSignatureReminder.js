exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('clients', table => {
            table.boolean('sN_autoSignatureReminder').defaultTo(false)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('clients')
    ])
};