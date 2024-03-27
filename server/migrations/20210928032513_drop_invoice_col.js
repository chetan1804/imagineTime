// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("invoice", (table) => {
      table.dropColumn("bill_from");
      table.dropColumn("firm_id");
      table.dropColumn("discount");
      table.dropColumn("sales_tax");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ]);
