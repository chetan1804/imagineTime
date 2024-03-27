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

export { default as account } from '../resources/client/portal/ClientPortalRouter.js.jsx';
export { default as files } from '../resources/file/portal/FilePortalRouter.js.jsx';
export { default as clientWorkflows } from '../resources/clientWorkflow/portal/ClientWorkflowPortalRouter.js.jsx';
export { default as clientPosts } from '../resources/clientPost/portal/ClientPostPortalRouter.js.jsx';
export { default as quickTasks } from '../resources/quickTask/portal/QuickTaskPortalRouter.js.jsx';
export { default as request } from '../resources/request/portal/RequestPortalRouter.js.jsx';
