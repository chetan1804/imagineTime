const User = require("./UserModel")

const { raw } = require('objection');

function generatePasswordHex() {
  return Math.floor(Math.random()*16777215).toString(16) + Math.floor(Math.random()*16777215).toString(16);
}

exports.checkIfUserExists = (email) => {
  return User.query()
    .where({
      username: email
    })
    .first()
    .then(user => {
      if(!!user) {
        return user
      } else {
        return {}
      }
    })
    .catch(err => {
      return {}
    })
}

exports.insertUser = (userBody) => {

  let passwordHex = generatePasswordHex();

  let userData = {};

  userData['username'] = userBody.email;
  userData['firstname'] = userBody.firstname;
  userData['lastname'] = userBody.lastname;
  userData['password_salt'] = User.createPasswordSalt();
  userData['password_hash'] = User.hashPassword(userData.password_hash, passwordHex);
  userData['firstLogin'] = true;
  userData['resetPasswordHex'] = passwordHex;
  userData['resetPasswordTime'] = new Date();

  console.log('create user userData', userData);

  return User.query()
    .insert(userData)
    .returning('*')
    .then(user => {
      if(!user) {
        return {};
      } else {
        return user;
      }
    })
    .catch(err => {
      console.log('failed to create user', err);
      return {};
    })
}

exports.updateUser = (userBody, userId) => {
  return User.query()
    .findById(userId)
    .update({...userBody})
    .returning('*')
}

exports.fetchStaffUsersDetailsByIds = (userIds, firmId) => {

  return User.query()
    .from('users as u')
    .leftJoin('addresses as a', 'a._id', 'u._primaryAddress')
    .leftJoin('phonenumbers as pn', 'pn._id', 'u._primaryPhone')
    .leftJoin('staff as s', 's._user', 'u._id')
    .whereIn('u._id', [...userIds])
    .where({
      's._firm': firmId
    })
    .select(['u.*'
      , raw('row_to_json(a) as address')
      , raw('row_to_json(pn) as phoneNumber')
      , raw('row_to_json(s) as staffDetails')
    ])
}

exports.fetchClientUserDetailsByIds = (userIds, firmId, clientId = '') => {

  let condition = {}
  condition['cu._firm'] = firmId;

  if(!!clientId)
    condition['cu._client'] = clientId;

  return User.query()
  .from('users as u')
  .leftJoin('addresses as a', 'a._id', 'u._primaryAddress')
  .leftJoin('phonenumbers as pn', 'pn._id', 'u._primaryPhone')
  .leftJoin('clientusers as cu', 'cu._user', 'u._id')
  .whereIn('u._id', [...userIds])
  .whereNot('cu.status', 'deleted')
  .where(condition)
  .select(['u.*'
    , raw('row_to_json(a) as address')
    , raw('row_to_json(pn) as phoneNumber')
    , raw('row_to_json(cu) as clientUserDetails')
  ])
}

exports.fetchUserById = (userId) => {
  return User.query()
  .findById(userId)
  .then(user => {
    if(!!user) {
      return user
    } else {
      return {}
    }
  })
  .catch(err => {
    return {}
  })
}