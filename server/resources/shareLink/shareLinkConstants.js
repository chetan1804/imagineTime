/**
 * Fields, of sharelink records, exposed via the API so that the client
 * can specify which field values it needs while making a search API call.
 */
exports.selectFields = [
    {id:'sharelinks._id'}
    , {clientId: 'sharelinks._client'}
    , {userId: 'sharelinks._personal'}
    , {createdById: 'sharelinks._createdBy'}
    , {quickTaskId: 'sharelinks._quickTask'}
    , {files: 'sharelinks._files'}
    , {createdDateTime: 'sharelinks.created_at'}
    , {updatedDateTime: 'sharelinks.updated_at'}
    , {type: 'sharelinks.type'}
    , {clientName: 'clients.name'}
    , {createdByFirstName: 'users.firstname'}
    , {createdByLastName: 'users.lastname'}
    , {status: 'quicktasks.status'}
    , {taskType: 'quicktasks.type'}
    , {prompt: 'sharelinks.prompt'}
    , {expireDate: 'sharelinks.expireDate'}
    , {responseDate: 'quicktasks.responseDate'}
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
    , createdByFirstName: {name: 'users.firstname', dataType: 'String'}
    , createdByLastName: {name: 'users.lastname', dataType: 'String'}
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
    id: 'sharelinks._id'
    , clientName: 'clients.name'
    , clientId: 'sharelinks._client'
    , status: ['quicktasks.status', 'quicktasks.responseDate']
    , expireDate: 'sharelinks.expireDate'
    , userId: 'sharelinks._personal'
    , createdById: 'sharelinks._createdBy'
    , createdByFirstName: 'users.firstname'
    , createdByLastName: 'users.lastname'
    , createdByName: ['users.firstname', 'users.lastname']
    , createdDateTime: 'sharelinks.created_at'
    , updatedDateTime: 'sharelinks.updated_at'
    , prompt: 'sharelinks.prompt'
    , responseDate: 'quicktasks.responseDate'
    , type: 'sharelinks.type'
};
  
  