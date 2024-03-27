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


export { default as user } from '../resources/user/UserRouter.js.jsx';

export { default as share } from '../resources/shareLink/ShareLinkRouter.js.jsx';
export { default as request } from '../resources/shareLink/RequestLinkRouter.js.jsx';
export { default as preview } from '../resources/shareLink/PreviewLinkRouter.js.jsx';
export { default as requestTask } from '../resources/requestTask/RequestTaskRouter.js.jsx';
export { default as link } from '../resources/shareLink/LinkConfigRouter.js.jsx';

// export { default as quickTasks } from '../resources/quickTask/QuickTaskRouter.js.jsx';

export { default as payments } from '../resources/payments/PaymentRouter.js.jsx';