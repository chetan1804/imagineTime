exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('firm_settings', table => {
            table.increments('_id').primary()
            table.timestamps(false, true)
            table.integer('_firm')
            table.foreign('_firm').references('_id').inTable('firms')
            table.boolean('email_useLoggedInUserInfo').notNullable().defaultTo(true)
            table.string('email_fromName', 250).defaultTo(null)
            table.string('email_replyTo', 250).defaultTo(null)
        })
    ])
};
  
exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('firm_settings')
    ])
};
  