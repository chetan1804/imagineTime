const { Model } = require("objection");

Model.knex(db);

class InvoiceDetails extends Model {
  static get tableName() {
    return "invoice_details";
  }

  static get idColumn() {
    return "invoiceDetail_id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        invoiceDetail_id: { type: "integer" },
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

module.exports = InvoiceDetails;