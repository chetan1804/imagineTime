// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('payment')
  ]);
