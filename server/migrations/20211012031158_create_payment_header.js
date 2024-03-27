exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable("payment_header", (table) => {
        table.increments("payment_header_id").primary();
        table.timestamps(false, true);
        table.integer("client_id");
        table.integer("firm_id");
        table.string("payment_note", 1000);
        table.date("payment_date");
        table.string("payment_type", 1000);
      }),
    ]);
  };
  
  exports.down = function (knex, Promise) {
    return Promise.all([knex.schema.dropTable("payment_header")]);
  };
  