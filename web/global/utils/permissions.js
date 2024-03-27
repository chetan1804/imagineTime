/**
 * This is a series of utilities to provide route protection for react-router
 * before the route is entered.
 *
 * TODO: Rework this so the user info is pulled from the store, not 'window'
 */

const permissions = {
  isStaffOwner(staffStore, user, firmId) {
    return (
      (
        staffStore.loggedInByFirm[firmId] 
        && staffStore.loggedInByFirm[firmId].staff 
        && staffStore.loggedInByFirm[firmId].staff.owner
        && staffStore.loggedInByFirm[firmId].staff.status === 'active'
      ) 
      || 
      ( user 
        && (
          user.admin 
          || (
            user.roles 
            && 
            user.roles.includes('admin')
            )
          )
      )
    )
  },
  isStaff(staffStore, user, firmId) {
    return (
      (
        staffStore.loggedInByFirm[firmId] 
        && staffStore.loggedInByFirm[firmId].staff 
        && staffStore.loggedInByFirm[firmId].staff.status === 'active'
      ) 
      || 
      ( user 
        && (
          user.admin 
          || (
            user.roles 
            && 
            user.roles.includes('admin')
            )
          )
      )
    )
  }, 
  hasESignAccess(staffStore, firmId) {
    return (
      staffStore.loggedInByFirm[firmId] 
      && staffStore.loggedInByFirm[firmId].staff

      && staffStore.loggedInByFirm[firmId].staff.eSigAccess
      && staffStore.loggedInByFirm[firmId].staff.status === 'active'
    )
  },
  isClientUser(clientUserStore, user, clientId) {
    console.log(clientUserStore, user, clientId)
    return (
      (
        clientUserStore.loggedInByClient[clientId] 
        && clientUserStore.loggedInByClient[clientId].clientUser 
        && clientUserStore.loggedInByClient[clientId].clientUser.status === 'active'
      ) 
      || 
      ( user 
        && (
          user.admin 
          || (
            user.roles 
            && 
            user.roles.includes('admin')
            )
          )
      )
    )
  },
  getUserRole(user, firmId, clientId, staffStore, clientUserStore) {
    if(!!user.admin) {
      return "admin"
    } else if(this.isStaffOwner(staffStore, user, firmId)) {
      return "owner"
    } else if(this.isStaff(staffStore, user, firmId)) {
      return "staff"
    } else if(this.isClientUser(clientUserStore, user, clientId)) {
      return "contact"
    } else {
      return "";
    }
  },
  hasPermission(firm, parentFolder, selectedFolder, permission) {

    return true;
    // console.log('permission parameters');
    // console.log(firm, parentFolder, selectedFolder, permission)
    if(selectedFolder && selectedFolder._id) {
      if(selectedFolder.category == 'folder') {
        //check folder permission
        return !!selectedFolder && selectedFolder.permission && selectedFolder.permission[permission];
      } else if (parentFolder && parentFolder._id) {
        //check parent folder permission
        return !!parentFolder && parentFolder.permission && parentFolder.permission[permission];
      } else {
        //check group folder permission
        return !!firm && firm.permission[permission];
      }
    } else if (parentFolder && parentFolder._id) {
      return !!parentFolder && parentFolder.permission && parentFolder.permission[permission];
    } else {
      return !!firm && firm.permission[permission];
    }
  }
}

export default permissions;