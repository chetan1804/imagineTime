exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('requesttask', table => {
            table.string('_folder').defaultTo(null)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('requesttask')
    ])
}; 