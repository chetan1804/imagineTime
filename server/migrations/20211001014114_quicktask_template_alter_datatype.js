exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('quicktasks', table => {
            table.json('template').defaultTo(JSON.stringify([]))
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('quicktasks')
    ])
}; 
