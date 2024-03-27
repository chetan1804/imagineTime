exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('firms', table => {
            table.boolean('allowRenameFiles').defaultTo(false)
            table.boolean('allowMoveFiles').defaultTo(false)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firms')
    ])
};