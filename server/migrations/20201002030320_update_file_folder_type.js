exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('files', table => {
            table.string('_folder').alter()
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('files')
    ])
}; 