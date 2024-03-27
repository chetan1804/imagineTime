const knex = require("knex");
const { Model } = require("objection");

Model.knex(db);

class Invoice extends Model {
  static get tableName() {
    return "invoice";
  }

  static get idColumn() {
    return "invoice_id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        invoice_id: { type: "integer" },
      },
    };
  }

  static get defaultObject() {
    return {};
  }

  static get relationMappings() {
    return {};
  }
}

module.exports = Invoice;