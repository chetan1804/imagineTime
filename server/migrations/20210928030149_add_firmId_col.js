// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice", (table) => {
      table.integer("firm_id");
      table.float("invoice_amount");
      table.float("invoice_balance");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice')
  ]);
