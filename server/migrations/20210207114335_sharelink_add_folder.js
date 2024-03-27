exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('sharelinks', table => {
            table.string('_folder').nullable()
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('sharelinks')
    ])
}; 