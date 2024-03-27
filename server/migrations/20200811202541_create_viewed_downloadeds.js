
exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('viewdownloads', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)

            table.integer('_user')
            table.foreign('_user').references('_id').inTable('users')
    
            table.integer('_file')
            table.foreign('_file').references('_id').inTable('files')

            table.string('type') 
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('viewdownloads')
    ])
};
  
  