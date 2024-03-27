// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("invoice", (table) => {
      table.dropColumn("bill_to");
      table.dropColumn('invoice_number')
      table.dropColumn('client_id')
      table.dropColumn('firm_id')
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ]);
