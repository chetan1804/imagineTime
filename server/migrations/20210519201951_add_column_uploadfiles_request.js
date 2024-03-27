exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('request', table => {
            table.integer('uploadedFiles').defaultTo(0)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('request')
    ])
};