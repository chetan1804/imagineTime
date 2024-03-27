exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('firms', table => {
            table.string('fileVersionType').defaultTo('default')
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firms')
    ])
};