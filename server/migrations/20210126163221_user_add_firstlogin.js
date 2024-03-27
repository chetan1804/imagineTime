exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('users', table => {
            table.boolean('firstLogin').defaultTo(false)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('users')
    ])
}; 