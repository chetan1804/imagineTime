/**
 * Fields, of client post and parent records, exposed via the API so that the
 * API client can specify which field values it needs while making a search API
 * call.
 */
 exports.selectFields = [
    {id:'clientposts._id'}
    //, {firmId: 'clientposts._firm'}
    , {createdDateTime: 'clientposts.created_at'}
    , {updatedDateTime: 'clientposts.updated_at'}
    , {clientId: 'clientposts._client'}
    , {clientName: 'client.name'}
    , {createdById: 'clientposts._createdBy'}
    , {createdByName: 'createdBy.firstname'} // to be replaced by full name before sending back to the client
    , {createdByFirstName: 'createdBy.firstname'}
    , {createdByLastName: 'createdBy.lastname'}
    , {subject: 'clientposts.subject'}
    , {message: 'clientposts.content'}
];

/**
 * Fields, of client post and parent records, exposed via the API so that the
 * API client can use them to define the criteria to filter desired records
 * while making a search API call.
 */
 exports.criteriaFields = {
    clientId: {name: 'clientposts._client', dataType: 'Integer'}
    , clientStatus: {name: 'client.status', dataType: 'String'}
    , createdById: {name: 'clientposts._user', dataType: 'Integer'}
};
  
/**
 * Fields, of client post and parent records, exposed via the API so that the
 * API client can sort the desired record by them while making a search API
 * call.
 */
 exports.orderByFields = {
    id: 'clientposts._id'
    , clientName: 'client.name'
    , subject: 'clientposts.subject'
    , message: 'clientposts.content'
    , createdDateTime: 'clientposts.created_at'
    , updatedDateTime: 'clientposts.updated_at'
    , createdByName: ['createdBy.firstname', 'createdBy.lastname']
    , clientId: 'clientposts._client'
    , replyCount: 'replyCount'
};
