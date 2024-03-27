exports.up = (knex) =>
  Promise.all([
    knex.schema.dropTable("payment"),
  ]);
  
exports.down = (knex) =>
  Promise.all([]);
