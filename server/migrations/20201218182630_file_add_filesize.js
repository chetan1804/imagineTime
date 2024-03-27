exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('files', table => {
            table.string('fileSize').defaultTo('')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('files')
    ])
}; 