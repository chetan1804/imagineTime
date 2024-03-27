exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('sharelinks', table => {
            table.boolean('sN_clientAutoSignatureReminder').defaultTo(false)
            table.boolean('sN_creatorAutoSignatureReminder').defaultTo(false)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('sharelinks')
    ])
};