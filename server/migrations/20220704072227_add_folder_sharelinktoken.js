exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('sharelinktokens', table => {
          table.integer('_folder').nullable()
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('sharelinktokens')
  ])
}; 