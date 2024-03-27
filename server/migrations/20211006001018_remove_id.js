// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("invoice_details", (table) => {
        table.dropColumn("invoiceDetail_id");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ]);
