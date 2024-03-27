const { Model } = require("objection");

Model.knex(db);

class CardDetails extends Model {
  static get tableName() {
    return "card_details";
  }

  static get idColumn() {
    return "CustomerCardID";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        CustomerCardID: { type: "integer" },
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

module.exports = CardDetails;