exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('file_activities', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)

            table.string('text')
            table.string('workspace') // link 
            table.string('portal') // link
            table.string('status')
            table.integer('_client').nullable()
            table.integer('_user').nullable()
            table.integer('_file')
            table.foreign('_file').references('_id').inTable('files')
            table.integer('_firm')
            table.foreign('_firm').references('_id').inTable('firms')

            // gonna ignore the object/verb stuff for the time being

        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('file_activities')
    ])
};