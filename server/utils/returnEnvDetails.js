const env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const config = require('../config')[env];

console.log("......................")
console.log("RETURNING ENVIRONMENT DETAILS FOR " + env);
console.log("() App URL:")
console.log(config.appUrl)
console.log("() Database CLI Command:")
console.log(`psql -h ${config.connection.host} -p ${config.connection.port} -U ${config.connection.user}`)

console.log("......................")