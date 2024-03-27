const filterUtils = {
  // This is not yet in use.
  filterClient(testString, client) {
    if(!client) {
      return true;
    }
    let clientString = "";
    clientString += client.accountType;
    clientString += client.name;
    clientString += client.website;
    clientString += client.engagementTypes ? client.engagementTypes.map(type => type) : null;
    clientString = clientString.replace(/[^a-zA-Z0-9]/g,'');
    return clientString.toLowerCase().indexOf(testString) > -1;
  }
  , filterClientContact(testString, contact) {
    let contactString = "";
    contactString += contact.username
    contactString += contact.firstname
    contactString += contact.lastname
    contactString += contact.clientName
    contactString = contactString.replace(/[^a-zA-Z0-9]/g,'');
    return contactString.toLowerCase().indexOf(testString) > -1;
  }
  , filterTag(testString, tag) {
    // or userTemplates
    let tagString = "";
    tagString += tag.name;
    tagString = tagString.replace(/[^a-zA-Z0-9]/g,'');
    return tagString.toLowerCase().indexOf(testString) > -1;
  }
  , filterUser(testString, user) {
    // or userTemplates
    let userString = "";
    userString += user.username;
    userString += user.firstname;
    userString += user.lastname;
    userString += user.handle;
    userString += user.firstname;
    userString += user.handle;
    userString += user.username;
    userString += user.handle;
    userString += user.firstname;
    userString += user.username;
    userString += user.lastname;

    userString = userString.replace(/[^a-zA-Z0-9]/g,'');
    return userString.toLowerCase().indexOf(testString) > -1;
  }
  , filterFile(testString, file) {
    // fileTemplates
    let fileString = "";
    fileString += file.filename;
    fileString += file.created_at;
    fileString += file.status;
    fileString += file.fullname;
    fileString += file.username;
    fileString += file.uploadName;

    fileString = fileString.replace(/[^a-zA-Z0-9]/g,'');
    return fileString.toLowerCase().indexOf(testString) > -1;
  }
}



export default filterUtils;
