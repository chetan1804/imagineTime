exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('firms', table => {
            table.boolean('allowCreateFolder').defaultTo(false);
            table.boolean('allowDeleteFiles').defaultTo(false);
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firms')
    ])
};
