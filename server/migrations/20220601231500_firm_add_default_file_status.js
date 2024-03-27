exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('firms', table => {
            table.string('default_file_status').defaultTo('');
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firms')
    ])
};
