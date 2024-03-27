/**
 * Fields, of client request tasks and parent records, exposed via the API so
 * that the client can specify which field values it needs while making a search
 * API call.
 */
 exports.selectFields = [
    {id:'requesttask._id'}
    //, {firmId: 'requesttask._firm'}
    , {createdDateTime: 'requesttask.created_at'}
    , {updatedDateTime: 'requesttask.updated_at'}
    , {createdById: 'requesttask._createdBy'}
    //, {createdByName: 'createdByUser.firstname'}
    , {createdByFirstName: 'createdByUser.firstname'}
    , {createdByLastName: 'createdByUser.lastname'}
    , {clientId: 'requestList._client'}
    , {clientName: 'requestClient.name'}
    //, {userId: 'requestList._personal'}
    //, {userName: 'forUser.firstname'}
    //, {userFirstName: 'forUser.firstname'}
    //, {userLastName: 'forUser.lastname'}
    , {status: 'requesttask.status'}
    , {category: 'requesttask.category'}
    , {dueDate: 'requesttask.dueDate'}
    , {responseDate: 'requesttask.responseDate'}
    , {description: 'requesttask.description'}
    , {requestListId: 'requesttask._request'}
    , {requestListName: 'requestList.name'}
    , {tasksCount: 'requestList.tasks'}
    , {uploadedFilesCount: 'requestList.uploadedFiles'}
    , {assignees: 'requesttask.assignee'}
    , {_returnedFiles: 'requesttask._returnedFiles'}
    , {_folder: 'requesttask._folder'}
];

/**
 * Fields, of client request tasks and parent records, exposed via the API so
 * that the client can use them to define the criteria to filter desired records
 * while making a search API call.
 */
 exports.criteriaFields = {
    clientId: {name: 'requestList._client', dataType: 'Integer'}
    , status: {name: 'requesttask.status', dataType: 'String'}
    , requestListId: {name: 'requesttask._request', dataType: 'Integer'}
    //, userId: {name: 'requestList._personal', dataType: 'Integer'}
};
  
/**
 * Fields, of client request tasks and parent records, exposed via the API so
 * that the client can sort the desired record by them while making a search API
 * call.
 */
 exports.orderByFields = {
    id: 'requesttask._id'
    , status: 'requesttask.status'
    , clientName: 'requestClient.name'
    , category: 'requesttask.category'
    , createdDateTime: 'requesttask.created_at'
    , updatedDateTime: 'requesttask.updated_at'
    //, userName: ['forUser.firstname', 'forUser.lastname']
    , clientId: 'requestList._client'
    , dueDate: 'requesttask.dueDate'
    , responseDate: 'requesttask.responseDate'
    , description: 'requesttask.description'
    , tasksCount: 'requestList.tasks'
    , uploadedFilesCount: 'requestList.uploadedFiles'
    , requestListId: 'requesttask._request'
    , requestListName: 'requestList.name'
    , createdByName: ['createdByUser.firstname', 'createdByUser.lastname']
};
