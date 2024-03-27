exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('taskactivity', table => {
            table.integer('_user').nullable()
            table.foreign('_user').references('_id').inTable('users')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('taskactivity')
    ])
}; 