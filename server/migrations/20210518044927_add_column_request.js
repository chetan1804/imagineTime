exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('request', table => {
            table.integer('_requestFolder')
            table.foreign('_requestFolder').references('_id').inTable('requestfolder')
            table.integer('tasks').defaultTo(0)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('request')
    ])
};
