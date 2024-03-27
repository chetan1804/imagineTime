// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.table("firms", (table) => {
      table.string("stax_merchant_id");
      table.string("stax_status");
      table.string("stax_merchant_apikey", 500);
      table.string("stax_public_key", 500);
      table.string("stax_token", 500);
      table.boolean("is_stax_enrollment_started").defaultTo(false)
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('firm')
  ]);
