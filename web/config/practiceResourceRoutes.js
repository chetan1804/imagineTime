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

export { default as clients } from '../resources/client/practice/ClientSettingsRouter.js.jsx';
export { default as workspaces } from '../resources/client/practice/ClientWorkspaceRouter.js.jsx';
export { default as contacts } from '../resources/user/practice/UserPracticeRouter.js.jsx';
export { default as settings } from '../resources/firm/practice/FirmPracticeRouter.js.jsx';
export { default as files } from '../resources/file/practice/FilePracticeRouter.js.jsx';
export { default as quickTasks } from '../resources/quickTask/practice/QuickTaskPracticeRouter.js.jsx';
// export { default as clientWorkflows } from '../resources/clientWorkflow/practice/ClientWorkflowPracticeRouter.js.jsx'; // TODO: this isn't working.  need to clean it up 
export { default as invoices } from '../resources/clientInvoice/InvoiceRouter.js.jsx';

// export { default as clientWorkflows } from '../resources/clientWorkflow/practice/ClientWorkflowPracticeRouter.js.jsx'; // TODO: this isn't working.  need to clean it up 

// export { default as clientWorkflows } from '../resources/clientWorkflow/practice/ClientWorkflowPracticeRouter.js.jsx'; // TODO: this isn't working.  need to clean it up 
export { default as services } from '../resources/services/ServiceRouter.js.jsx';
export { default as enrollment } from '../resources/payments/enrollment/EnrollmentRouter.js.jsx';
export { default as electronicPayments } from '../resources/payments/electronicPayments/ElectronicPaymentsRouter.js.jsx';
export { default as cardTransactions } from '../resources/payments/viewTransactionHistory/ViewTransactionHistoryRouter.js.jsx';
export { default as signatures } from '../resources/signatures/SignatureRouter.js.jsx';
//export { default as links } from '../resources/shareLink/ShareLinkListRouter.js.jsx';
export { default as lists } from '../resources/ListsRouter.js.jsx';
