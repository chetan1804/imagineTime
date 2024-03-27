
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable("folderpemission"),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([]);
};
