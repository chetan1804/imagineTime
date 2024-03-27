const { cat } = require('shelljs');
const ClientUser = require('./ClientUserModel');

let logger = global.logger;

exports.getClientUser = async (userId, firmId, clientId) => {
  return ClientUser.query().where({_user: userId, _firm: firmId, _client: clientId}).returning('*').first();
}

exports.createClientUser = (clientUserBody) => {
  return ClientUser.query().insert(clientUserBody).returning('*')
}

exports.updateClientUser = (clientUserBody, clientUserId) => {
  return ClientUser.query()
    .findById(clientUserId)
    .update({...clientUserBody})
    .returning('*')
}

exports.getClientUserByUser = (firmId, clientId, userId) => {
  return ClientUser.query()
    .where({
      "_firm": firmId,
      "_client": clientId,
      "_user": userId
    })
    .whereNot({
      "status": "deleted"
    })
    .first()
    .then(clientUser => {
      if(!!clientUser) {
        return clientUser;
      } else {
        return {}
      }
    })
    .catch(err => {
      return {}
    })
}

exports.getClientUserByFirmClient = (condition, column = ['*']) => {
  return ClientUser.query()
    .where({...condition})
    .whereNot('status', 'deleted')
    .select(column)
}
