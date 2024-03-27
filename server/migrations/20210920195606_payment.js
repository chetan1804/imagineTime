exports.up = function (knex, Promise) {
  return Promise.all([
    knex.schema.createTable("payment", (table) => {
      table.increments("_id").primary();
      table.timestamps(false, true);
      table.integer("bank_account_no");
      table.integer("card_no");
      table.integer("client_id");
      table.foreign("client_id").references("_id").inTable("clients");
      table.integer("firm_id");
      table.foreign("firm_id").references("_id").inTable("firms");
      table.string("first_name");
      table.string("last_name");
      table.string("stax_customer_id");
      table.string("stax_payment_method_id");
      table.string("stax_token");
      table.string("transaction_type");
    }),
  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([knex.schema.dropTable("payment")]);
};
