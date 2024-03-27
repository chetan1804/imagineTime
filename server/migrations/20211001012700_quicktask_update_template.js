exports.up = function(knex, Promise) {
    return Promise.all([
        // knex.schema.table('quicktasks', table => {
        //     table.string('template', 4096).defaultTo('').alter()
        // })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        // knex.schema.dropTable('quicktasks')
    ])
}; 
