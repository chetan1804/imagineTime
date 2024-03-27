// console.log("loading util wrapper");
// to run:
//NODE_ENV="production" node server/util/xxx.js

//require libs
let knex = require('knex');

const env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const config = require('../config')[env];

global.db = knex(config);

exports.run = runFn => {

  // this does less than the equivalent mongo one would do, but still good to have for future proofing
  // handles connecting to the correct database

  console.log("RUNNING UTIL WRAPPER")

  runFn();

}