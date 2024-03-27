const Address = require('./AddressModel');

exports.getAddressByUser = (userId) => {
  return Address.query()
    .where({ 
      _user: userId
      , "_firm": null
      , "_client": null
    })
    .first()
    .then(address => {
      return address;
    })
    .catch(err => {
      return null;
    })
}

exports.getAddressById = (id) => {
  return Address.query()
  .findById(id)
  .then(address => {
    return address;
  })
  .catch(err => {
    return null;
  })
}

exports.addAddress = (addressBody) => {
  return Address.query().insert(addressBody).returning('*');
}

exports.updateAddress = (addressBody) => {
  return Address.query().findById(addressBody._id).update({...addressBody}).returning('*');
}