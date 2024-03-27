exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice_details", (table) => {
      table.integer("invoice_id");
      table.foreign("invoice_id").references("invoice_id").inTable("invoice");
    }),
  ]);

exports.down = (knex) =>
  Promise.all([knex.schema.dropTableIfExists("invoice_details")]);
