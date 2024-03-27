exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('docutemplates', table => {
            table.json('tags').defaultTo(JSON.stringify([]))
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('docutemplates')
    ])
}; 
