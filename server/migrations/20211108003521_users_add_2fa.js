
exports.up = function(knex, Promise) {
  return Promise.all([ 
    knex.schema.table('users', table => {
      table.string('secret_2fa').defaultTo('')
      table.string('qrcode_2fa').defaultTo('')
      table.boolean('verified_2fa').defaultTo(false)
      table.boolean('enable_2fa').defaultTo(false)
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('users')
  ])
};
