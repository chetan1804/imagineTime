exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable("invoice_details", (table) => {
        table.increments("_id").primary();
        table.timestamps(false, true);
        table.integer("client_id");
        table.integer("firm_id");
        table.string("invoice_description", 1000);
        table.float("invoice_amount");
        table.integer("service_id");
        table.string("stax_payment_method_id");
        table.integer("invoice_id");
        table.foreign("invoice_id").references("_id").inTable("invoice");
      }),
    ]);
  };
  
  exports.down = function (knex, Promise) {
    return Promise.all([knex.schema.dropTable("invoice_details")]);
  };
  