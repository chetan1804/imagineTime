exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('phonenumbers', table => {
      table.increments('_id').primary()
      table.timestamps(false, true)
      // table.string('type')
      table.enu('type', ['mobile', 'home', 'work','main','home fax', 'work fax', 'other fax', 'other'])
      table.string('number')
      
      // TODO:
      // type enum
    })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('phonenumbers')
  ])
};

