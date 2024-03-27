/**
 * Reads and exports the reducers as defined by each resource module
 *
 * NOTE: this facilitates adding reducers via the CLI
 */

export { default as user } from '../resources/user/userReducers.js';
export { default as firm } from '../resources/firm/firmReducers.js';
export { default as staff } from '../resources/staff/staffReducers.js';
export { default as staffClient } from '../resources/staffClient/staffClientReducers.js';
export { default as notification } from '../resources/notification/notificationReducers.js';
export { default as activity } from '../resources/activity/activityReducers.js';
export { default as clientTask } from '../resources/clientTask/clientTaskReducers.js';
export { default as clientTaskResponse } from '../resources/clientTaskResponse/clientTaskResponseReducers.js';
export { default as file } from '../resources/file/fileReducers.js';
export { default as client } from '../resources/client/clientReducers.js';
export { default as clientUser } from '../resources/clientUser/clientUserReducers.js';
export { default as note } from '../resources/note/noteReducers.js';
export { default as clientWorkflow } from '../resources/clientWorkflow/clientWorkflowReducers.js';
export { default as clientWorkflowTemplate } from '../resources/clientWorkflowTemplate/clientWorkflowTemplateReducers.js';
export { default as address } from '../resources/address/addressReducers.js';
export { default as phoneNumber } from '../resources/phoneNumber/phoneNumberReducers.js';
export { default as tag } from '../resources/tag/tagReducers.js';
export { default as subscription } from '../resources/subscription/subscriptionReducers.js';
export { default as clientActivity } from '../resources/clientActivity/clientActivityReducers.js';
export { default as clientNote } from '../resources/clientNote/clientNoteReducers.js';
export { default as clientPost } from '../resources/clientPost/clientPostReducers.js';
export { default as clientPostReply } from '../resources/clientPostReply/clientPostReplyReducers.js';
export { default as shareLink } from '../resources/shareLink/shareLinkReducers.js';
export { default as clientTaskTemplate } from '../resources/clientTaskTemplate/clientTaskTemplateReducers.js';
export { default as quickTask } from '../resources/quickTask/quickTaskReducers.js';
export { default as fileActivity } from '../resources/fileActivity/fileActivityReducers.js';
export { default as folder } from '../resources/folder/folderReducers.js';
export { default as request } from '../resources/request/requestReducers.js';
export { default as requestTask } from '../resources/requestTask/requestTaskReducers.js';
export { default as taskActivity } from '../resources/taskActivity/taskActivityReducers.js';
export { default as folderTemplate } from '../resources/folderTemplate/folderTemplateReducers.js';

export { default as requestFolder } from '../resources/requestFolder/requestFolderReducers.js';
export { default as invoice } from '../resources/clientInvoice/InvoiceReducer.js';
export { default as service } from '../resources/services/ServiceReducer';
export { default as merchant } from '../resources/payments/enrollment/EnrollmentReducer.js';
export { default as staxUtilities } from '../resources/payments/electronicPayments/EpaymentsReducer.js';
export { default as transaction } from '../resources/payments/viewTransactionHistory/TransactionReducer.js';
export { default as payments } from '../resources/payments/PaymentReducers.js';

export { default as signature } from '../resources/signatures/signatureReducers.js';

export { default as mergeField } from '../resources/mergeField/mergeFieldReducers.js';
export { default as documentTemplate } from '../resources/documentTemplate/documentTemplateReducers.js';

export { default as folderPermission } from '../resources/folderPermission/folderPermissionReducers.js';