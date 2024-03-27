exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('clientusers', table => {
            table.string('accessType').defaultTo('')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('clientusers')
    ])
}; 
