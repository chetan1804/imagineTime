exports.up = knex => Promise.all([
    knex.schema.table('viewdownloads', table => {
        table.string('ipaddress').nullable()
    })
]);

exports.down = knex => Promise.all([
    knex.schema.table('viewdownloads', table => {
        table.dropColumn('ipaddress')
    })
]);