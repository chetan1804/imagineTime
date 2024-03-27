
let async = require('async');
let knex = require('knex');
let utilWrapper = require('../utilWrapper');
const env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// import models
const User = require('../../resources/user/UserModel');
const Tag = require('../../resources/tag/TagModel');
const Firm = require('../../resources/firm/FirmModel');
const Client = require('../../resources/client/ClientModel');
const Staff = require('../../resources/staff/StaffModel');
const StaffClient = require('../../resources/staffClient/StaffClientModel');
const ClientUser = require('../../resources/clientUser/ClientUserModel');

// load the actual data to import (to make it easier in the future)
// NOTE: depends on the env that we are using
const users = require(`./${env}/users.js`)
const tags = require(`./${env}/tags.js`)
const firms = require(`./${env}/firms.js`)
const clients = require(`./${env}/clients.js`)
const staff = require(`./${env}/staff.js`)
const staffClients = require(`./${env}/staffClients.js`)
const clientUsers = require(`./${env}/clientUsers.js`)


utilWrapper.run(() => {
  console.log("RUNNING SEED DATABASE FOR " + env)
  // console.log(users)

  // this logic will be fairly rigid and hard coded, but we don't
  // care if this runs particularly fast or efficiently

  async.waterfall([
    // 1. load users
    cb => {
      async.each(users, (user, cb2) => {
        User.query().insert(user)
        .then(user => {
          if(!user) {
            cb2("Error saving user")
          } else {
            cb2();
          }
        });
      }, err2 => {
        // after successful creation, we have to update the index for the table
        // the index is arbirary, just needs to be higher than the number of things we're adding
        db.schema.withSchema('public').raw('ALTER SEQUENCE users__id_seq RESTART WITH 100')
        .then(result => {}) // it literally doesn't work without the then
        cb(err2)
      })
     }
     // 2. tags
    , 
    cb => {
      async.each(tags, (tag, cb2) => {
        Tag.query().insert(tag)
        .then(tag => {
          if(!tag) {
            cb2("Error saving tag")
          } else {
            cb2();
          }
        });
      }, err2 => {
        db.schema.withSchema('public').raw('ALTER SEQUENCE tags__id_seq RESTART WITH 100')
        .then(result => {})
        cb(err2)
     })
    }
    // 3. firms
    , cb => {
      async.each(firms, (firm, cb2) => {
        Firm.query().insert(firm)
        .then(firm => {
          if(!firm) {
            cb2("Error saving firm")
          } else {
            cb2();
          }
        });
      }, err2 => {
        db.schema.withSchema('public').raw('ALTER SEQUENCE firms__id_seq RESTART WITH 100')
        .then(result => {})
        cb(err2)
      })
     }
     // 4. clients
     , cb => {
      async.each(clients, (client, cb2) => {
        Client.query().insert(client)
        .then(client => {
          if(!client) {
            cb2("Error saving client")
          } else {
            cb2();
          }
        });
      }, err2 => {
        db.schema.withSchema('public').raw('ALTER SEQUENCE clients__id_seq RESTART WITH 100')
        .then(result => {})
        cb(err2)
      })
     }
     // 5. staff
     , cb => {
      async.each(staff, (staff, cb2) => {
        Staff.query().insert(staff)
        .then(staff => {
          if(!staff) {
            cb2("Error saving staff")
          } else {
            cb2();
          }
        });
      }, err2 => {
        db.schema.withSchema('public').raw('ALTER SEQUENCE staff__id_seq RESTART WITH 100')
        .then(result => {})
        cb(err2)
      })
     }
     // 6. staffClients
     , cb => {
      async.each(staffClients, (staffClient, cb2) => {
        StaffClient.query().insert(staffClient)
        .then(staffClient => {
          if(!staffClient) {
            cb2("Error saving staffClient")
          } else {
            cb2();
          }
        });
      }, err2 => {
        db.schema.withSchema('public').raw('ALTER SEQUENCE staffclients__id_seq RESTART WITH 100')
       cb(err2)
      })
     }
     // 7. clientUsers
     , cb => {
      async.each(clientUsers, (clientUser, cb2) => {
        ClientUser.query().insert(clientUser)
        .then(clientUser => {
          if(!clientUser) {
            cb2("Error saving clientUser")
          } else {
            cb2();
          }
        });
      }, err2 => {
        // NOTE: the last time this was run on staging it did not work; not sure why.
        // if thats true you need to run 'ALTER SEQUENCE clientusers__id_seq RESTART WITH 100;' raw from the psql command line
        db.schema.withSchema('public').raw('ALTER SEQUENCE clientusers__id_seq RESTART WITH 100')
        cb(err2)
      })
     }
  ], err => {
    if(err) {
      console.log("ERR running database seed")
      console.log(err);
      process.exit(1);
    } else {
      console.log("FINISHED runnign database seed");
      process.exit()
    }
  })
})