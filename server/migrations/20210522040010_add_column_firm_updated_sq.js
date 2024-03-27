exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('firms', table => {
            table.boolean('updated_sq').defaultTo(false)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firms')
    ])
};