// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("firms", (table) => {
      table.dropColumn("stax_merchant_id");
      table.dropColumn("stax_status");
      table.dropColumn("stax_merchant_apikey");
      table.dropColumn("stax_public_key");
      table.dropColumn("stax_token");
      table.dropColumn("is_stax_enrollment_started")
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ]);
