exports.up = function (knex, Promise) {
    return Promise.all([
      knex.schema.createTable("card_details", (table) => {
        table.increments("CustomerCardID").primary();
        table.timestamps(false, true);
        table.integer("client_id");
        table.integer("firm_id");
        table.string("CardNo", 10);
        table.string("ExpiryDate");
        table.string("NameOnCard");
        table.string("FirstName");
        table.string("LastName");
        table.string("StaxToken", 1000);
        table.string("StaxCustomerID", 1000);
        table.string("StaxPaymentMethodID", 1000);
        table.string("TransType");
      }),
    ]);
  };
  
  exports.down = function (knex, Promise) {
    return Promise.all([knex.schema.dropTable("card_details")]);
  };
  