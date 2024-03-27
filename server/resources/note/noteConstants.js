/**
 * Fields, of file notes/comments and parent records, exposed via the API so that the
 * client can specify which field values it needs while making a search API call.
 */
 exports.selectFields = [
    {id:'notes._id'}
    , {createdDateTime: 'notes.created_at'}
    , {updatedDateTime: 'notes.updated_at'}
    , {note: 'notes.content'}
    , {clientId: 'notes._client'}
    , {clientName: 'noteClient.name'}
    , {userId: 'notes._user'}
    , {userFirstName: 'noteUser.firstname'}
    , {userLastName: 'noteUser.lastname'}
    , {fileId: 'notes._file'}
    //, {firmId: 'notes._firm'}
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
 * Fields, of file note and parent records, exposed via the API so that the
 * client can use them to define the criteria to filter desired records while
 * making a search API call.
 */
 exports.criteriaFields = {
    fileName: {name: 'files.filename', dataType: 'String'}
    , clientId: {name: 'notes._client', dataType: 'Integer'}
    , fileStatus: {name: 'files.status', dataType: 'String'}
    , userId: {name: 'notes._user', dataType: 'Integer'}
    , fileUserId: {name: 'files._personal', dataType: 'Integer'}
    , fileCreatedByUserId: {name: 'files._user', dataType: 'Integer'}
};
  
/**
 * Fields, of file note and parent records, exposed via the API so that the
 * client can sort the desired record by them while making a search API call.
 */
 exports.orderByFields = {
    id: 'notes._id'
    , fileName: ['files.filename', 'files.fileExtension']
    , clientName: 'noteClient.name'
    , note: 'notes.content'
    , createdDateTime: 'notes.created_at'
    , updatedDateTime: 'notes.updated_at'
    , userName: ['noteUser.firstname', 'noteUser.lastname']
    , clientId: 'notes._client'
    //, fileStatus: 'files.status'
    //, fileCreatedByName: ['fileCreatedByUser.firstname', 'fileCreatedByUser.lastname']
};
