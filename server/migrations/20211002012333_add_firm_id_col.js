exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice", (table) => {
        table.integer('firm_id')
        table.foreign('firm_id').references('_id').inTable('firms')
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice')
  ]);
