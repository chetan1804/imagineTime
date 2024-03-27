const { Model } = require("objection");

Model.knex(db);

class Service extends Model {
  static get tableName() {
    return "service";
  }

  static get idColumn() {
    return "_id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        _id: { type: "integer" },
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

module.exports = Service;