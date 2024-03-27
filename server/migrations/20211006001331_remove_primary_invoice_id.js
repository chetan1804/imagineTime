// nice default "add column" schema - replace "thing" and "column" below

exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("invoice", (table) => {
        table.dropColumn("_id");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ]);
