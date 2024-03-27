exports.up = function(knex, Promise) {
  return Promise.all([
      knex.schema.table('sharelinktokens', table => {
        table.string('type').defaultTo('');
        table.json('files').defaultTo(JSON.stringify([]));
        table.dropColumn('queryParemeters');
      })
  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([
      knex.schema.dropTable('sharelinktokens')
  ])
};