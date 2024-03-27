
const Client = require('../../resources/client/ClientModel');
const ClientUser = require('../../resources/clientUser/ClientUserModel');
const Firm = require('../../resources/firm/FirmModel');
const Staff = require('../../resources/staff/StaffModel');
const StaffClient = require('../../resources/staffClient/StaffClientModel');
const ShareLinkToken = require('../../resources/shareLinkToken/ShareLinkTokenModel');

exports.utilCheckFirmPermission = (user, firmId, level="access", callback) => {
  /**
   * checks for firm permission.
   * returns true if:
   * a) admin
   * b) staff and admin
   * c) staff and active
   * 
   * FUTURE:
   * also add the ability to specify a "level" of access to check against
   * in theory, level could be "modify address" or "send invoice". this 
   * is mostly TBD though and here just for future proofing
   * 
   * current levels: 
   * admin: can do admin level things
   * access: can do firm level things
   * client: any of the above, OR an active client user of the firm
   */

  if (!firmId) {
    callback(false);
  } else if(user && user.admin) {
    callback(true)
  } else {
    // find Staff object
    Staff.query()
    .findOne({_user: user._id, _firm: firmId, status: 'active'})
    .then(staff => {
      if(staff) {
        user['owner'] = staff.owner;
        // firm checks
        if(level == "admin") {
          callback(staff.owner)
        } else {
          // having a staff object automatically gives "access" and "client"
          callback(true);
        }
      } else {
        // need to see if they have a client user object for this firm
        ClientUser.query()
        .findOne({_user: user._id, _firm: firmId, status: 'active'})
        .then(clientUser => {
          if(clientUser && level == "client") {
            callback(true)
          } else {
            console.log("Illegal firm permission access request: " + level + ", user: " + user.username);
            callback(false)
          }
        })
      }
    })
  }
}

exports.utilCheckClientPermission = (user, clientId, level="access", callback) => {
  /**
   * checks for client permission.
   * returns true if:
   * a) admin
   * b) staff and admin
   * c) staffClient and active
   * d) clientUser and active
   * 
   * FUTURE:
   * also add the ability to specify a "level" of access to check against
   * in theory, level could be "modify address" or "send invoice". this 
   * is mostly TBD though and here just for future proofing
   * 
   * current levels: 
   * admin - do anything
   * access - firm side, can do firm client things
   * client - client side, can do client portal things
   */

  // 1. true if admin
  if(user && user.admin) {
    callback(true)
  } else {
    // query client
    Client.query()
    .findById(clientId)
    .then(client => {
      if(!client) {
        callback(false) // can't find that client
      } else {
        // 2. true if user has firm admin access, since they automatically have all client access
        exports.utilCheckFirmPermission(user, client._firm, "admin", firmAdminAccess => {
          if(firmAdminAccess) {
            callback(true);
          } else if(level == "admin") {
            // no admin access
            callback(false);
          } else {
            // query StaffClient, then check if active
            StaffClient.query()
            // can't get this to work
            // .select('staff.owner', 'staff.status', 'staffclients._user', 'staffclients._firm')
            // .leftJoin('staff', 'staffclients._staff', '=', 'staff._id')
            .findOne({_user: user._id, _firm: client._firm, _client: clientId})
            .then(staffClient => {
              if(staffClient) {
                // fetch staff
                Staff.query()
                .findOne({_user: user._id, _firm: client._firm, status: 'active'})
                .then(staff => {
                  if(staff) {
                    // 3. if has a staffClient and an active Staff, they have both remaining access levels (access and client)
                    callback(true)
                  } else {
                    // staffClient but no longer active
                    callback(false)
                  }
                })
              } else {
                // no staffClient, need to check ClientUser
                // 4. return false for all levels other than "client"
                if(level == "client") {
                  ClientUser.query()
                  .findOne({_user: user._id, _firm: client._firm, _client: clientId, status: 'active'})
                  .then(clientUser => {
                    if(clientUser) {
                      callback(true)
                    } else {
                      callback(false)
                    }
                  })
                } else {
                  console.log("Illegal client permission access request: " + level + ", user: " + user.username);
                  callback(false)
                }
              }
            })
          }
        })
      }
    });

  }
}

exports.utilCheckisStaffOwner = (user, firmId, callback) => {
  if (user && (user.admin || (user.roles && user.roles.includes('admin')))) {
    callback(true);
  } else {
    Staff.query().where({ _user: user._id, _firm: firmId, owner: true }).first().then(staff => {
      if (staff) {
        callback(true);
      } else {
        callback(false);
      }
    });
  }
}

exports.utilCheckClientContactPermission = (user, clientId, firmId, type, callback) => {
  Firm.query().findById(firmId).then(firm => {
    if (firm) {
      const checkFirmPermission = (response) => {
        if (type === "rename") {
          response(firm && firm.allowRenameFiles);
        } else if (type === "status") {
          response(firm && firm.allowDeleteFiles);
        } else if (type === "move") {
          response(firm && firm.allowMoveFiles);
        } else {
          response(false)
        }
      }
      checkFirmPermission(permission => {
        if (permission) {
          ClientUser.query().where({
            _user: user._id
            , _client: clientId
            , status: 'active'
          })
          .first()
          .then(clientUser => {
            if (clientUser) {
              callback(true);
            } else {
              callback(false);
            }
          });
        } else {
          callback(false);
        }
      });
    } else {
      callback(false);
    }
  });
  
}

exports.checkSharelinkToken = (token) => {

  return ShareLinkToken.query()
    .where({
      token
    })
    .first()
    .then(sharelinktoken => {
      if(!sharelinktoken) {
        return null;
      } else {
        if(!!sharelinktoken._firm) {
          return Firm.query()
          .findById(sharelinktoken._firm)
          .then(firm => {
            if(!firm)
              return null;
            else
              return firm;
          })
          .catch(err => {
            return null
          })
        } else {
          return null;        
        }
      }
    })
}

exports.utilCheckPermission = (user, searchFirmId, searchClientId, callback) => {
  if (searchFirmId) {
    exports.utilCheckFirmPermission(user, searchFirmId, "client", permission => {
      callback(permission);
    });
  } else if (searchClientId) {
    exports.utilCheckClientPermission(user, searchClientId, "client", permission => {
      callback(permission);
    });
  } else {
    callback(false);
  }
}