exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('request', table => {
            table.integer('_request')
            table.foreign('_request').references('_id').inTable('request')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('request')
    ])
};
