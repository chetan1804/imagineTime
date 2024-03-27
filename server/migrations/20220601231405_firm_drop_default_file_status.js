exports.up = (knex) =>
  Promise.all([
    knex.schema.alterTable("firms", (table) => {
        table.dropColumn("default_file_status");
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
  ])