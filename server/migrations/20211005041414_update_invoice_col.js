exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice", (table) => {
        table.string('description', 1000)
        table.string('invoice_type', 500)
        table.boolean('is_archived').defaultTo(false)
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice')
  ]);
