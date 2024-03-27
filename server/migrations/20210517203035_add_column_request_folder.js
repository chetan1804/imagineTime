exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('requestfolder', table => {
            table.integer('requests').defaultTo(0)
            table.integer('tasks').defaultTo(0)
            table.integer('uploadedFiles').defaultTo(0)
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('requestfolder')
    ])
};