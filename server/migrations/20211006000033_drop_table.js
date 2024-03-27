exports.up = (knex) =>
  Promise.all([
    knex.schema.dropTable("invoice_service"),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    // knex.schema.dropTable('invoice_details')
  ]);
