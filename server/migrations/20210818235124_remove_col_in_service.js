exports.up = function (knex, Promise) {
  // return knex.schema.table("service", function (table) {
  //   table.dropForeign(columns, "invoice_id");
  // });
  return Promise.all([])
};

exports.down = function (knex, Promise) {
  return Promise.all([])
};
