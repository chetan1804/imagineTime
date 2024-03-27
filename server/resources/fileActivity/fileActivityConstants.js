/**
 * Fields, of file activity and parent records, exposed via the API so that the
 * client can specify which field values it needs while making a search API call.
 */
exports.selectFields = [
    {id:'file_activities._id'}
    , {createdDateTime: 'file_activities.created_at'}
    , {updatedDateTime: 'file_activities.updated_at'}
    , {activityText: 'file_activities.text'}
    , {activityStatus: 'file_activities.status'}
    , {clientId: 'file_activities._client'}
    , {clientName: 'activityClient.name'}
    , {userId: 'file_activities._user'}
    , {userFirstName: 'activityUser.firstname'}
    , {userLastName: 'activityUser.lastname'}
    , {fileId: 'file_activities._file'}
    //, {firmId: 'file_activities._firm'}
    , {fileName: 'files.filename'}
    , {fileExtension: 'files.fileExtension'}
    , {fileCategory: 'files.category'}
    , {fileContentType: 'files.contentType'}
    , {fileStatus: 'files.status'}
    //, {fileClientId: 'files._client'}
    //, {fileClientName: 'fileClient.name'}
    //, {fileCreatedByUserId: 'files._user'}
    //, {fileCreatedByUserFirstName: 'fileCreatedByUser.firstname'}
    //, {fileCreatedByUserLastName: 'fileCreatedByUser.lastname'}
    //, {fileFirmId: 'files._firm'}
    //, {fileUserId: 'files._personal'}
    //, {fileUserFirstName: 'fileUser.firstname'}
    //, {fileUserLastName: 'fileUser.lastname'}
];

/**
 * Fields, of file activity and parent records, exposed via the API so that the
 * client can use them to define the criteria to filter desired records while
 * making a search API call.
 */
 exports.criteriaFields = {
    fileName: {name: 'files.filename', dataType: 'String'}
    , clientId: {name: 'file_activities._client', dataType: 'Integer'}
    , activityStatus: {name: 'file_activities.status', dataType: 'String'}
    , fileStatus: {name: 'files.status', dataType: 'String'}
    , fileExtension: {name: 'files.fileExtension', dataType: 'String'}
    , userId: {name: 'file_activities._user', dataType: 'Integer'}
    , createdDateTime: {name: 'file_activities.created_at', dataType: 'DateTime'}
};
  
/**
 * Fields, of file activity and parent records, exposed via the API so that the
 * client can sort the desired record by them while making a search API call.
 */
 exports.orderByFields = {
    id: 'file_activities._id'
    , fileName: ['files.filename', 'files.fileExtension']
    , clientName: 'activityClient.name'
    , activityText: 'file_activities.text'
    , createdDateTime: 'file_activities.created_at'
    , updatedDateTime: 'file_activities.updated_at'
    , userName: ['activityUser.firstname', 'activityUser.lastname']
    , activityStatus: 'file_activities.status'
    , clientId: 'file_activities._client'
    //, fileStatus: 'files.status'
    //, fileCreatedByName: ['fileCreatedByUser.firstname', 'fileCreatedByUser.lastname']
};
  
  