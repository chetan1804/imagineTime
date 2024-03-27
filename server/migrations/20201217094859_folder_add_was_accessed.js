exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('files', table => {
            table.boolean('wasAccessed').defaultTo(true)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('files')
    ])
}; 