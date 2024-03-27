

//call data access object
const userDao = require('../user/UserDAO');
const clientUserDao = require('../clientUser/clientUserDAO');
const addressDao = require('../address/addressDAO');
const phoneNumberDao = require('../phoneNumber/phoneNumberDAO');
const staffDao = require('../staff/staffDAO');

const email  = require('../../global/utils/email.js');
const { generatePromise } = require('../../global/utils/api');
const permissions = require('../../global/utils/permissions');

const Client = require('../client/ClientModel');


function addAddress (address) {

}

function addPhoneNumber (phoneNumber) {

}

function makePrimaryAddress (address) {

}

function makePrimaryContact (phoneNumber) {

}

/*client user requirements
  email
  firstname
  lastname
  _client
  _firm
  address
  phoneNumber
*/

// clientuser status [active, archived, deleted]

exports.createClientOrStaffUser = async (contactBody, userId = '', userType = '') => {
  const contactEmail = contactBody.email;

  let contactData = {}

  if(userType == 'staff') {
    contactData = {
      "_firm": contactBody._firm,
      "status": contactBody.status ? contactBody.status : "active",
      "owner": !!contactBody.owner
    }
  } else {
    contactData = {
      "_client": contactBody._client,
      "_firm": contactBody._firm,
      "status": contactBody.status ? contactBody.status : "active",
      "accessType": "noinvitesent",
      "position": contactBody.position
    }
  }


  //check if email is valid;
  if(!email.isValidEmail(contactEmail)) {
    return generatePromise(null, 'Invalid email') //return empty object
  }

  //check if user is exists

  let selectedUser = !userId ? await userDao.checkIfUserExists(contactEmail) : await userDao.fetchUserById(userId);

  console.log('selectedUser', selectedUser);
  if(!!(selectedUser && selectedUser._id)) {
    //check if user needs to update
    contactData['_user'] = selectedUser._id;
    if(contactBody.firstname != selectedUser.firstname ||
      contactBody.lastname != selectedUser.lastname ||
      contactBody.email != selectedUser.username) {
        //update user
        const userBody = {
          "firstname": contactBody.firstname,
          "lastname": contactBody.lastname,
          "username": contactBody.email
        }
        selectedUser = await userDao.updateUser(userBody, selectedUser._id);
      }

  } else {
    const userBody = {
      "firstname": contactBody.firstname,
      "lastname": contactBody.lastname,
      "email": contactBody.email
    }

    //check for the 2nd time if create user is success
    selectedUser = await userDao.insertUser(userBody);

    if(!!(selectedUser && selectedUser._id)) {
      contactData['_user'] = selectedUser._id;
    } else {
      return generatePromise(null, 'Failed to create user') // return empty object
    }
  }

  let userAddress;
  let userPhoneNumber;

  if(contactBody.hasOwnProperty('address')) {
    //check first if client/staff has an existing address
    const currentUserAddress = selectedUser && selectedUser._primaryAddress ? await addressDao.getAddressById(selectedUser._primaryAddress) : null;

    if(!currentUserAddress) {
      //add the address
      let address = {...contactBody.address};
      address['_user'] = selectedUser._id;
      userAddress = await addressDao.addAddress(address)
        .then(newAddress => {
          console.log(`new user address ${selectedUser._id}`, newAddress);
          return newAddress;
        })
    } else {
      //update the address
      let address = {...currentUserAddress, ...contactBody.address};
      userAddress = await addressDao.updateAddress(address)
        .then(newAddress => {
          console.log(`updated user address ${selectedUser._id}`, newAddress);
          return newAddress;
        })
    }

  }

  if(contactBody.hasOwnProperty('phoneNumber')) {
    //check first if client/staff has an existing phonenumber
    const currentPhoneNumber = selectedUser && selectedUser._primaryPhone ?  await phoneNumberDao.getPhoneNumberById(selectedUser._primaryPhone) : null;

    if(!currentPhoneNumber) {
      //add phonenumber
      let phoneNumber = {...contactBody.phoneNumber};
      phoneNumber['_user'] = selectedUser._id;
      userPhoneNumber = await phoneNumberDao.addPhoneNumber(phoneNumber)
        .then(newPhoneNumber => {
          console.log(`new user phone number ${selectedUser._id}`, newPhoneNumber);
          return newPhoneNumber;
        })
    } else {
      //update phonenumber
      let phoneNumber = {...currentPhoneNumber, ...contactBody.phoneNumber};
      phoneNumber['_user'] = selectedUser._id;
      userPhoneNumber = await phoneNumberDao.updatePhoneNumber(phoneNumber)
        .then(newPhoneNumber => {
          console.log(`updated user phone number ${selectedUser._id}`, newPhoneNumber);
          return newPhoneNumber;
        })
    }
  }

  selectedUser['_primaryAddress'] = userAddress && userAddress._id ? userAddress._id : selectedUser['primaryAddress'];
  selectedUser['_primaryPhone'] = userPhoneNumber && userPhoneNumber._id ? userPhoneNumber._id : selectedUser['primaryPhone'];

  const updatedUser = await userDao.updateUser(selectedUser, selectedUser._id)
    .then(updatedUser => {
      console.log('updatedUser', updatedUser);
      if(updatedUser && updatedUser._id) {
        return updatedUser;
      } else {
        return selectedUser;
      }
    })
    .catch(err => {
      console.log(`error updating user ${selectedUser._id}`, err);
      return selectedUser;
    });

  selectedUser = updatedUser;

  if(userType == "staff") {
    //check if staff user already added
    return staffDao.getStaffUserByUser(contactBody._firm, selectedUser._id)
      .then(async (staff) => {
        let user
        if((staff && staff._id)) {
          const userStaff = await staffDao.updateStaffUser(contactData, staff._id)
          .then(updatedStaffUser => {
            return updatedStaffUser
          })
          .catch(err => {
            console.log(`update client user error ${selectedUser._id}`, err);
            return staff;
          });

          user = {...selectedUser};
          delete user['password_hash'];
          delete user['password_salt'];
          delete user['resetPasswordHex'];
          delete user['resetPasswordTime'];

          user['status'] = userStaff.status;
          user['owner'] = userStaff.owner;
          user['address'] = userAddress;
          user['phone'] = userPhoneNumber;

          return generatePromise(user);
        } else {
          //create staff user
          return staffDao.createStaffUser(contactData)
          .then(newStaff => {
            if(newStaff && newStaff._id) {
              user = {...selectedUser}; 
              delete user['password_hash'];
              delete user['password_salt'];
              delete user['resetPasswordHex'];
              delete user['resetPasswordTime'];

              user['status'] = newStaff.status;
              user['owner'] = newStaff.owner;
              user['address'] = userAddress;
              user['phone'] = userPhoneNumber;

              return generatePromise(user);
            } else {
              return generatePromise({}, 'Failed to create client user');
            }
          })
          .catch(err => {
            console.log('create client user err', err);
            return generatePromise({}, err.message)
          })
        }
      })
  } else {
    //Check if client user already added
    return clientUserDao.getClientUserByUser(contactBody._firm, contactBody._client, selectedUser._id)
    .then(async (clientUser) => {
      let user;
      if((clientUser && clientUser._id)) {
        //return the existing client user    
        const userContact = await clientUserDao.updateClientUser(contactData, clientUser._id)
          .then(updatedClientUser => {
            return updatedClientUser
          })
          .catch(err => {
            console.log(`update client user error ${selectedUser._id}`, err);
            return clientUser;
          });

          user = {...selectedUser};
          delete user['password_hash'];
          delete user['password_salt'];
          delete user['resetPasswordHex'];
          delete user['resetPasswordTime'];

          user['status'] = userContact.status;
          user['position'] = userContact.position;
          user['address'] = userAddress;
          user['phone'] = userPhoneNumber;

        return generatePromise(user);
      } else {
        // create client user
        return clientUserDao.createClientUser(contactData)
          .then(newClientUser => {
            if(newClientUser && newClientUser._id) {
              user = {...selectedUser}; 
              delete user['password_hash'];
              delete user['password_salt'];
              delete user['resetPasswordHex'];
              delete user['resetPasswordTime'];

              user['status'] = newClientUser.status;
              user['position'] = newClientUser.position;
              user['address'] = userAddress;
              user['phone'] = userPhoneNumber;

              return generatePromise(user);
            } else {
              return generatePromise({}, 'Failed to create client user');
            }
          })
          .catch(err => {
            console.log('create client user err', err);
            return generatePromise({}, err.message)
          })
      }
    })
    .catch(err => {
      console.log('fetch client user error', err);
      return generatePromise({}, err.message)
    })
  }
}

exports.fetchStaffUsers = async (firmId) => {
  //get all staff by firm
  const staffUsers = await staffDao.getStaffByFirm(firmId, '_user')
    .then(staffUsers => {
      if(!staffUsers) {
        return []
      } else {
        return staffUsers
      }
    })
    .catch(err => {
      console.log('error fetch staff users by firm', err);
      return[]
    }).map(s => s._user);
    
  if(staffUsers.length > 0) {
    return userDao.fetchStaffUsersDetailsByIds(staffUsers, firmId)
    .then(staffs => {
      console.log('staffs', staffs);
      staffs.map(user => {
        delete user['password_hash'];
        delete user['password_salt'];
        delete user['resetPasswordHex'];
        delete user['resetPasswordTime'];
      })
      return staffs;
    })
    .catch(err => {
      console.log('failed to fetch users details', err);
      return []
    })
  } else {
    return generatePromise([])
  }
}

exports.fetchClientUsers = async (firmId, clientId = "") => {
  let condition = {};

  condition['_firm'] = firmId;

  if(!!clientId)
    condition['_client'] = clientId;

  let clientUsers = await clientUserDao.getClientUserByFirmClient(condition, ['_user'])
    .then(clientUsers => {
      if(!clientUsers) {
        return []
      } else {
        return clientUsers
      }
    })
    .catch(err => {
      console.log('failed to fetch users details', err);
      return []
    }).map(cu => cu._user);

  if(clientUsers.length > 0) {
    //remove duplicates
    let userIds = Array.from(new Set(clientUsers));

  return userDao.fetchClientUserDetailsByIds(userIds, firmId, clientId)
    .then(clientUsers => {
      clientUsers.map(user => {
        delete user['password_hash'];
        delete user['password_salt'];
        delete user['resetPasswordHex'];
        delete user['resetPasswordTime'];
      })
      return clientUsers;
    })
    .catch(err => {
      console.log('failed to fetch users details', err);
      return []
    })
  } else {
    return generatePromise([])
  }  
}

exports.createStaff = {

}

exports.hasPermission = (req, firmId) => {

  if(req.firm && (req.firm._id == firmId)) {
    return generatePromise(true);
  } else if(req.user && req.user._id) {
    return new Promise((resolve, reject) => {
      permissions.utilCheckFirmPermission(req.user, firmId, 'access', (permission) => {
        if(!!permission) {
          return resolve(true);
        } else {
          return reject(false, "You don't have permission to access this firm");
        }
      })
    })
  } else {
    return generatePromise(false, "You don't have permission to access this firm");
  }
}

exports.hasClientPermission = (req, firmId, clientId) => {
  return Client.query()
    .findById(clientId)
    .whereNot({
      status: 'deleted'
    })
    .select(['_id', '_firm', 'status'])
    .then(client => {
      if(!client) {
        return false;
      } else {
        if(req.firm && (req.firm._id == client._firm)) {
          return true;
        } else {
          return new Promise((resolve, reject) => {
            permissions.utilCheckClientPermission(req.user, clientId, 'access', (permission) => {
              if(!!permission) {
                return resolve(true);
              } else {
                return reject(false);
              }
            })
          })
        }
      }
    })
    .catch(err => {
      return false;
    })
}
