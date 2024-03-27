exports.up = (knex) =>
  Promise.all([
    knex.schema.table("invoice", (table) => {
        table.integer('client_id')
        table.foreign('client_id').references('_id').inTable('clients')
    }),
  ]);
  
exports.down = (knex) =>
  Promise.all([
    knex.schema.dropTable('invoice')
  ]);
