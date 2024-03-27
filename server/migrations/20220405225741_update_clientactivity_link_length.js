exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('clientactivities', table => {
            table.string('link', 2000).defaultTo('').alter()
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('clientactivities')
    ])
}; 
