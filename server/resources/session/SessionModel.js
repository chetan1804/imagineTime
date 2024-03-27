const { Model } = require("objection");

class Session extends Model {
  static get tableName() {
    return "sessions";
  }
}

module.exports = Session;

