exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('firms', table => {
            table.boolean('showNewLabel').defaultTo(true)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firms')
    ])
};