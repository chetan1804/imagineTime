const knex = require("knex");
const { Model } = require("objection");

Model.knex(db);

class PaymentHeader extends Model {
  static get tableName() {
    return "payment_header";
  }

  static get idColumn() {
    return "payment_header_id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        payment_header_id: { type: "integer" },
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

module.exports = PaymentHeader;