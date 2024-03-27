exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('requesttask', table => {
            table.integer('_client').nullable()
            table.foreign('_client').references('_id').inTable('clients')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('requesttask')
    ])
}; 