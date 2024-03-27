exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable("payment_details", (table) => {
        table.increments("payment_detail_id").primary();
        table.timestamps(false, true);
        table.integer("client_id");
        table.integer("firm_id");
        table.string("payment_note", 1000);
        table.date("payment_date");
        table.string("payment_type", 1000);
        table.integer("invoice_number");
        table.integer('payment_header_id')
        table.foreign('payment_header_id').references('payment_header_id').inTable('payment_header')
      }),
    ]);
  };
  
  exports.down = function (knex, Promise) {
    return Promise.all([knex.schema.dropTable("payment_details")]);
  };
  