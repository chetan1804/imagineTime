// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("invoice", (table) => {
        table.dropForeign("client_id");
        table.dropForeign("firm_id");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ]);
