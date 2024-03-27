exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('addresses', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      table.string('city')
      table.string('country')
      table.string('formatted_address')
      table.string('localTZ')
      table.string('postal')
      table.string('state')
      table.string('street1')
      table.string('street2')

      // TODO:
      // location/coordinates
      // optional references

    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('addresses')
  ])
};

