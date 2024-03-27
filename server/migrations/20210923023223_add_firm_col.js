// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.table("firms", (table) => {
      table.string("stax_merchant_id", 1000);
      table.string("stax_status");
      table.string("stax_merchant_apikey", 1000);
      table.string("stax_public_key", 1000);
      table.string("stax_token", 1000);
      table.boolean("is_stax_enrollment_started").defaultTo(false)
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('firm')
  ]);
