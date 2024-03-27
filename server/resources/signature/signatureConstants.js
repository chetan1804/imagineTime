/**
 * Fields, of signature request records, exposed via the API so that the client
 * can specify which field values it needs while making a search API call.
 */
exports.selectFields = [
    {id:'sharelinks._id'}
    , {clientId: 'sharelinks._client'}
    , {clientName: 'clients.name'}
    , {userId: 'sharelinks._personal'}
    , {userName: 'forUser.firstname'} // to be replaced by full name before sending back to the client
    , {userFirstName: 'forUser.firstname'}
    , {userLastName: 'forUser.lastname'}
    , {createdById: 'sharelinks._createdBy'}
    , {createdBy: 'createdByUser.firstname'} // to be replaced by full name before sending back to the client
    , {createdByFirstName: 'createdByUser.firstname'}
    , {createdByLastName: 'createdByUser.lastname'}
    , {createdDateTime: 'sharelinks.created_at'}
    , {updatedDateTime: 'sharelinks.updated_at'}
    , {type: 'sharelinks.type'}
    , {expireDate: 'sharelinks.expireDate'}
    , {quickTaskId: 'sharelinks._quickTask'}
    , {taskType: 'quicktasks.type'}
    , {title: 'quicktasks.prompt'}
    , {signingLinks: 'quicktasks.signingLinks'} // they are returned as signerNames
    , {responseDate: 'quicktasks.responseDate'}
    , {isExpiryEmailSent: 'quicktasks.isExpiryEmailSent'}
    , {isReminderEmailSent: 'quicktasks.isReminderEmailSent'}
    , {status: 'quicktasks.status'}
];

/**
 * Fields, of signature request records, exposed via the API so that the client
 * can use them to define the criteria to filter desired records while making a
 * search API call.
 */
 exports.criteriaFields = {
    clientName: {name: 'clients.name', dataType: 'String'}
    , clientId: {name: 'sharelinks._client', dataType: 'Integer'}
    , status: {name: 'quicktasks.status', dataType: 'String'}
    , expireDate: {name: 'sharelinks.expireDate', dataType: 'DateTime'}
    , userId: {name: 'sharelinks._personal', dataType: 'String'}
    , createdById: {name: 'sharelinks._createdBy', dataType: 'Integer'}
    , createdByFirstName: {name: 'createdByUser.firstname', dataType: 'String'}
    , createdByLastName: {name: 'createdByUser.lastname', dataType: 'String'}
    , type: {name: 'sharelinks.type', dataType: 'String'}
    , createdDateTime: {name: 'sharelinks.created_at', dataType: 'DateTime'}
    , updatedDateTime: {name: 'sharelinks.updated_at', dataType: 'DateTime'}
    , responseDate: {name: 'quicktasks.responseDate', dataType: 'DateTime'}
};
  
/**
 * Fields, of signature request records, exposed via the API so that the client
 * can sort the desired record by them while making a search API call.
 */
 exports.orderByFields = {
    id:'sharelinks._id'
    , clientName: 'clients.name'
    , clientId: 'sharelinks._client'
    , status: ['quicktasks.status', 'quicktasks.responseDate']
    , expireDate: 'sharelinks.expireDate'
    , userId: 'sharelinks._personal'
    , userFirstName: 'forUser.firstname'
    , userLastName: 'forUser.lastname'
    , userName: ['forUser.firstname', 'forUser.lastname']
    , createdById: 'sharelinks._createdBy'
    , createdByFirstName: 'createdByUser.firstname'
    , createdByLastName: 'createdByUser.lastname'
    , createdBy: ['createdByUser.firstname', 'createdByUser.lastname']
    , createdDateTime: 'sharelinks.created_at'
    , updatedDateTime: 'sharelinks.updated_at'
    , title: 'quicktasks.prompt'
    , responseDate: 'quicktasks.responseDate'
};
  
  