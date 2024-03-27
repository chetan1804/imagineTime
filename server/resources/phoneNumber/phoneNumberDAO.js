
const PhoneNumber = require('./PhoneNumberModel');

exports.getPhoneNumberByUser = (userId) => {
  return PhoneNumber.query()
    .where({ 
      _user: userId
      , "_firm": null
      , "_client": null
    })
    .first()
    .then(phonenumber => {
      return phonenumber;
    })
    .catch(err => {
      return null;
    })
}

exports.getPhoneNumberById = (id) => {
  return PhoneNumber.query()
  .findById(id)
  .then(phonenumber => {
    return phonenumber;
  })
  .catch(err => {
    return null;
  })
}

exports.addPhoneNumber = (phoneNumber) => {
  return PhoneNumber.query().insert(phoneNumber).returning('*')
}

exports.updatePhoneNumber = (phoneNumber) => {
  return PhoneNumber.query().findById(phoneNumber._id).update(phoneNumber).returning('*')
}