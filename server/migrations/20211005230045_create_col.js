exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice", (table) => {
        table.string('client')
        table.integer('invoice_number')
        table.integer('client_id')
        table.integer('firm_id')
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice')
  ]);
