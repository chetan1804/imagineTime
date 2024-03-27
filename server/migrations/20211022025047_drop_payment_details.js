exports.up = (knex) =>
  Promise.all([
    knex.schema.dropTable("payment_details"),
  ]);
  
exports.down = (knex) =>
  Promise.all([]);
