/**
 * Reads and exports the routes as defined by each resource module.
 *
 * NOTE: this facilitates adding routes via the CLI. The CLI will automatically
 * build these exports with the camelCase version of the resource name so as to
 * add a consistent top-level path to the resource. A resource named UserWorkout
 * will show below as follows:
 *
 * export { default as userWorkout } from './userWorkout/UserWorkoutRouter.js.jsx'
 *
 * This will give it a top-level route path called 'user-workouts'
 */

// export { default as admin } from  './AdminRouter.js.jsx';
export { default as users } from '../resources/user/admin/UserAdminRouter.js.jsx';

export { default as activities } from '../resources/activity/admin/ActivityAdminRouter.js.jsx';
export { default as clients } from '../resources/client/admin/ClientAdminRouter.js.jsx';

export { default as clientUsers } from '../resources/clientUser/admin/ClientUserAdminRouter.js.jsx';
export { default as files } from '../resources/file/admin/FileAdminRouter.js.jsx';
export { default as firms } from '../resources/firm/admin/FirmAdminRouter.js.jsx';
export { default as notes } from '../resources/note/admin/NoteAdminRouter.js.jsx';
export { default as notifications } from '../resources/notification/admin/NotificationAdminRouter.js.jsx';
export { default as staff } from '../resources/staff/admin/StaffAdminRouter.js.jsx';
export { default as staffClients } from '../resources/staffClient/admin/StaffClientAdminRouter.js.jsx';
export { default as clientTasks } from '../resources/clientTask/admin/ClientTaskAdminRouter.js.jsx';

export { default as clientTaskResponses } from '../resources/clientTaskResponse/admin/ClientTaskResponseAdminRouter.js.jsx';
export { default as clientWorkflows } from '../resources/clientWorkflow/admin/ClientWorkflowAdminRouter.js.jsx';
export { default as clientWorkflowTemplates } from '../resources/clientWorkflowTemplate/admin/ClientWorkflowTemplateAdminRouter.js.jsx';
export { default as addresses } from '../resources/address/admin/AddressAdminRouter.js.jsx';
export { default as phoneNumbers } from '../resources/phoneNumber/admin/PhoneNumberAdminRouter.js.jsx';
export { default as tags } from '../resources/tag/admin/TagAdminRouter.js.jsx';
export { default as subscriptions } from '../resources/subscription/admin/SubscriptionAdminRouter.js.jsx';
export { default as shareLinks} from '../resources/shareLink/admin/ShareLinkAdminRouter.js.jsx';
export { default as quickTasks } from '../resources/quickTask/admin/QuickTaskAdminRouter.js.jsx'; 