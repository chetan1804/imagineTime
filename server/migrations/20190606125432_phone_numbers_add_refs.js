exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('phonenumbers', table => {
      table.integer('_user')
      table.foreign('_user').references('_id').inTable('users')
      table.integer('_firm')
      table.foreign('_firm').references('_id').inTable('firms')
      table.integer('_client')
      table.foreign('_client').references('_id').inTable('clients')
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('phonenumbers', table => {
      table.dropColumn('_user')
      table.dropColumn('_client')
    })
  ])
};