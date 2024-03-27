exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.table('phonenumbers', table => {
            table.string('extNumber')
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('phonenumbers')
    ])
};
