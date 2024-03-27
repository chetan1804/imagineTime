exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('requesttask', table => {
            table.date('requestDate').nullable()
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('requesttask')
    ])
}; 