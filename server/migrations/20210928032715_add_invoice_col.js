// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice", (table) => {
      table.string("firm_id");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice')
  ]);
