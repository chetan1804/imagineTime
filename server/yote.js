/**
 * ••••••••••••••••••••••••••••••••••••••••••••••••••
 *
 * Welcome to Yote!
 *
 * For documentation visit fugitivelabs.github.io/yote/
 *
 * We hope you like it!
 *   - Fugitive Labs
 *
 * ••••••••••••••••••••••••••••••••••••••••••••••••••
 *
 * Copyright (c) 2015-present, Fugitive Labs, LLC.
 * All rights reserved.
 *
 */

// require libraries
let bodyParser      = require('body-parser');
let cookieParser    = require('cookie-parser');
let compress        = require('compression');
// let errorHandler    = require('errorhandler');
let express         = require('express');
let favicon         = require('serve-favicon');
let fs              = require('fs');
let LocalStrategy   = require('passport-local').Strategy;
let mongoose        = require('mongoose');
let passport        = require('passport');
let path            = require('path');
let serveStatic     = require('serve-static');
let session         = require('express-session');
let cluster         = require('cluster');
// future: should possible to configure the cookies to work across different sub domains.
// https://www.npmjs.com/package/express-session
// https://stackoverflow.com/questions/18492576/share-cookie-between-subdomain-and-domain

let timeout         = require('connect-timeout');
let knex            = require('knex');

let cors            = require('cors');

// init express
let app = express();

//demo
// app.use(cors({
//   credentials: true
//   , origin: 'http://localhost:3000'
//   , optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }));

//prod
app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}));

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// configure the envirment
let env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
let config = require('./config')[env];

// initialize logger
let logger = require('./logger');
// NOTE: generally 'global' is not considered "best practices", but this will allow access to the logger object in the entire app
global.logger = logger;


// logger examples:
logger.debug("DEBUG LOG");
logger.info("INFO LOG");
logger.warn("WARN LOG");
logger.error("ERROR LOG");

// initialize database
global.db = knex(config);

// init User model
let User = require('./resources/user/UserModel');

// cron 
const cron = require('./cron-process');
cron.allCronJobs();

// use express compression plugin
app.use(compress());

// configure express
app.set('views', __dirname);
app.set('view engine', 'pug');
// app.set('view engine', 'html');
// app.use(timeout(960000)); //upper bound on server connections, in ms.
// // up to 16! minutes now, per chad's instructions

app.use(timeout(2400000)); //upper bound on server connections, in ms.
// up to 40! minutes now, per chad's instructions

// ^ longer than usual for big file uploads. 
app.use(cookieParser());

app.use((req, res, next) => {
  if(req.url.includes('send-reminders-cron')) {
    // catch for specific CRON routes coming from Google, and send as raw
    // NOTE: google sends these as octet streams :/
    bodyParser.raw()(req, res, next);
  } else {
    bodyParser.json({limit: '50mb'})(req, res, next);
    // bodyParser.json()(req, res, next);
  }
})

app.use(bodyParser.urlencoded({limit: '50mb',extended: true }));
// app.use(bodyParser.urlencoded({ extended: true }));

// configure cookie options for new chrome stuff
let cookieOpts = {
  //maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  maxAge: 1800000000 // 30minutes
}

if(app.get('env') == 'development' && !config.useHttps) {
  // don't set additional cookies for regular development
  // they won't work without using https
} else {
  // set sameSite cookies for any deployment scenario, so we can use the outlook plugin
  cookieOpts.sameSite = 'none';
  cookieOpts.secure = true;
}

const KnexSessionStore = require('connect-session-knex')(session);
app.use(session({
  store: new KnexSessionStore({
    knex: db
    , createtable: true
  })
  , secret: config.sessionSecret
  , resave: false
  , cookie: cookieOpts
  , proxy: true
}));

app.use(favicon(path.join(__dirname, 'static','favicon.ico')));
app.use(passport.initialize());
app.use(passport.session());

// // Uncomment below to allow file uploads
// app.use(multipart({}));


// serve static assets, incl. react bundle.js
app.use(serveStatic(__dirname + '/static'));

const firmCtrl = require('./resources/firm/firmsController')

// request checks
// app.use((req, res, next) => {
  
//   // Allow CORS & mobile access to the node APIs -- ref https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");

//   // supposed to help allow cross domain cookies
//   // res.header("Access-Control-Allow-Credentials", true);

//   // test user:
//   logger.info("YOTE USER: " + (req.user ? req.user.username : "none"));

//   // check for OPTIONS method
//   if(req.method == 'OPTIONS') {
//     res.send(200);
//   } else {
//     next();
//   }
// });

app.use((req, res, next) => {
  // inject this check into the app loop
  // this checks the requesting url against the list of possible hosts (from the firms)
  // and either forwards the request on if found or returns a 404 if not

  firmCtrl.checkFirmDomain(req, res, next);

});

// initialize passport
passport.use('local', new LocalStrategy(
  function(username, password, done) {
    User.query().where({username: username}).first()
    .then(user => {
      if(user && User.authenticate(user, password)) {
        logger.debug("authenticated!");
        return done(null, user);
      } else {
        logger.debug("NOT authenticated");
        return done(null, false);
      }
    })
  }
));

passport.serializeUser((req, user, done) => {
  logger.warn("SERIALIZE USER", user);
  if(user) {
    process.nextTick(() => {
      done(null, {
        id: user._id,
        tokenLogin: req.user.tokenLogin
      });
    })
    // done(null, user._id);
  }
});

passport.deserializeUser((id, done) => {
  logger.warn("DESERIALIZE USER", id);
  console.log('id', id);
  // NOTE: we want mobile user to have access to their api token, but we don't want it to be select: true
  process.nextTick(() => {
    let tempId;
    if (typeof(id) === "object") {
      tempId = id.id
    } else {
      tempId = id;
    }

    User.query().findById(tempId)
    .then(user => {
      if(user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    })
    .catch(err => {
      return done(null, false);
    })
  })

  // let tempId;
  // if (typeof id === "object" && id !== null) {
  //   tempId = parseInt(id.id);
  // } else {
  //   tempId = id;
  // }

  // User.query().findById(tempId)
  // .then(user => {
  //   if(user) {
  //     return done(null, user);
  //   } else {
  //     return done(null, false);
  //   }
  // })
  // .catch(err => {
  //   return done(null, false);
  // })
})

// development only
if (app.get('env') == 'development') {
  logger.debug("DEVELOPMENT");
  // app.use(errorHandler());
} else {
  console.log(app.get('env').toUpperCase());
}

// configure server routes
let router = express.Router();
require('./global/routing/router')(router, app);
// app.use('/', router);
// some notes on router: http://scotch.io/tutorials/javascript/learn-to-use-the-new-router-in-expressjs-4

// check for the server timeout. NOTE: this must be last in the middleware stack
app.use(haltOnTimedout);
function haltOnTimedout(req, res, next){
  console.log("yote haltOnTimedOut")
  //http://stackoverflow.com/questions/21708208/express-js-response-timeout
  if (!req.timedout) next();
}

/*
 * Using HTTPS
 * Yote comes out of the box with https support! Check the docs for instructions on how to use.
 */

// we need this defined explicitly to pass it into the socket.io handler
let server;

// PRODUCTION SSL CONFIG
if(app.get('env') == 'production' && config.useHttps) {
  logger.info("starting production server WITH ssl");

  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/production/imagineshare/imaginetime.key')
    , cert: fs.readFileSync('../server/ssl/production/imagineshare/d1b039f21b0fa601.crt')
    , ca: [fs.readFileSync('../server/ssl/production/imagineshare/gd_bundle-g2-g1.crt')]
  // }, app).listen(9191); // NOTE: uncomment to test HTTPS locally
  }, app);  

  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      // pass http:80 health check for load balancing
      // NOT an Express response, rather a raw node http.ServerResponse https://nodejs.org/api/http.html#http_class_http_serverresponse
      if(req.url && req.url == '/uptest') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('ok');
      } else {
        logger.info("REDIRECTING TO HTTPS");
        res.writeHead(302, {
          'Location': `https://${req.headers.host}:443` + req.url
          // 'Location': 'https://localhost:9191' + req.url // NOTE: uncomment to test HTTPS locally
        });
        res.end();
      }
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }

  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');

} else if(app.get('env') == 'production2' && config.useHttps) {
  logger.info("starting lexshare production server WITH ssl");

  // server = require('https').createServer({
  //   key: fs.readFileSync('../server/ssl/production/lexshare.key')
  //   , cert: fs.readFileSync('../server/ssl/production/lexshare.crt')
  // // }, app).listen(9191); // NOTE: uncomment to test HTTPS locally
  // }, app);  

  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/production/lexshare/lexshare-privatekey.pem')
    , cert: fs.readFileSync('../server/ssl/production/lexshare/47264d752f7fd6ca.crt')
    , ca: [fs.readFileSync('../server/ssl/production/lexshare/gd_bundle-g2-g1.crt')]
  }, app);

  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      // pass http:80 health check for load balancing
      // NOT an Express response, rather a raw node http.ServerResponse https://nodejs.org/api/http.html#http_class_http_serverresponse
      if(req.url && req.url == '/uptest') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('ok');
      } else {
        logger.info("REDIRECTING TO HTTPS");
        res.writeHead(302, {
          'Location': `https://${req.headers.host}:443` + req.url
          // 'Location': 'https://localhost:9191' + req.url // NOTE: uncomment to test HTTPS locally
        });
        res.end();
      }
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }

  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');

// STAGING SSL CONFIG
} else if(app.get('env') == 'staging' && config.useHttps) {
  logger.info("starting staging server WITH ssl");

  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/staging/imaginetime.key')
    , cert: fs.readFileSync('../server/ssl/staging/8971ea80f2600696.crt')
    , ca: [fs.readFileSync('../server/ssl/staging/gd_bundle-g2-g1.crt')]
  // }, app).listen(9191); // NOTE: uncomment to test HTTPS locally
  }, app);

  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      logger.info("REDIRECTING TO HTTPS", req.hostname, req.headers.host);
      res.writeHead(302, {
        'Location': `https://${req.headers.host}:443` + req.url
        // 'Location': 'https://localhost:9191' + req.url // NOTE: uncomment to test HTTPS locally
      });
      res.end();
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }

  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');

} else if(app.get('env') == 'stagingdemo' && config.useHttps) {
  logger.info("starting staging demo server WITH ssl");
  
  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/demo/imagineshare/imaginetime.key')
    , cert: fs.readFileSync('../server/ssl/demo/imagineshare/a7d9ed36fba8c1e0.crt')
    , ca: [fs.readFileSync('../server/ssl/demo/imagineshare/gd_bundle-g2-g1.crt')]
  }, app);

  // server.listen(9191); // NOTE: uncomment to test HTTPS locally
  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      logger.info("REDIRECTING TO HTTPS");
      res.writeHead(302, {
        'Location': `https://${req.headers.host}:443` + req.url
        // 'Location': 'https://localhost:9191' + reqs.url // NOTE: uncomment to test HTTPS locally
      });
      res.end();
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }
  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');
} else if(app.get('env') == 'demo2' && config.useHttps) {
  logger.info("starting lexshare demo server WITH ssl");

  // server = require('https').createServer({
  //   key: fs.readFileSync('../server/ssl/demo/lexshare/lexshare.key')
  //   , cert: fs.readFileSync('../server/ssl/demo/lexshare/lexshare.crt')
  // }, app);

  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/demo/lexshare/lexshare-privatekey.pem')
    , cert: fs.readFileSync('../server/ssl/demo/lexshare/f6e7114d947260dd.crt')
    , ca: [fs.readFileSync('../server/ssl/demo/lexshare/gd_bundle-g2-g1.crt')]
  }, app);

  // server.listen(9191); // NOTE: uncomment to test HTTPS locally
  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      logger.info("REDIRECTING TO HTTPS");
      res.writeHead(302, {
        'Location': `https://${req.headers.host}:443` + req.url
        // 'Location': 'https://localhost:9191' + reqs.url // NOTE: uncomment to test HTTPS locally
      });
      res.end();
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }

  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');
} else if(app.get('env') == 'demo' && config.useHttps) {
  logger.info("starting demo server WITH ssl");

  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/demo/imagineshare/imaginetime.key')
    , cert: fs.readFileSync('../server/ssl/demo/imagineshare/a7d9ed36fba8c1e0.crt')
    , ca: [fs.readFileSync('../server/ssl/demo/imagineshare/gd_bundle-g2-g1.crt')]
  }, app);

  // server.listen(9191); // NOTE: uncomment to test HTTPS locally
  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      logger.info("REDIRECTING TO HTTPS");
      res.writeHead(302, {
        'Location': `https://${req.headers.host}:443` + req.url
        // 'Location': 'https://localhost:9191' + reqs.url // NOTE: uncomment to test HTTPS locally
      });
      res.end();
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }
  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');
} else if(app.get('env') == 'testproduction' && config.useHttps) {
  logger.info("starting production server WITH ssl");

  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/production/imagineshare/imaginetime.key')
    , cert: fs.readFileSync('../server/ssl/production/imagineshare/d1b039f21b0fa601.crt')
    , ca: [fs.readFileSync('../server/ssl/production/imagineshare/gd_bundle-g2-g1.crt')]
  // }, app).listen(9191); // NOTE: uncomment to test HTTPS locally
  }, app);  

  server.listen(443)

  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      // pass http:80 health check for load balancing
      // NOT an Express response, rather a raw node http.ServerResponse https://nodejs.org/api/http.html#http_class_http_serverresponse
      if(req.url && req.url == '/uptest') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('ok');
      } else {
        logger.info("REDIRECTING TO HTTPS");
        res.writeHead(302, {
          'Location': `https://${req.headers.host}:443` + req.url
          // 'Location': 'https://localhost:9191' + req.url // NOTE: uncomment to test HTTPS locally
        });
        res.end();
      }
    // }).listen(3030); // NOTE: uncomment to test HTTPS locally
    }).listen(80);
  }

  logger.info('Yote is listening on port ' + 80 + ' and ' + 443 + '...');

} else if(app.get('env') == 'production') {
  logger.info("starting yote production server WITHOUT ssl");
  server = require('http').createServer(app).listen(config.port);
  logger.info('Yote is listening on port ' + config.port + '...');

} else if(config.useHttps) {
  logger.info("starting dev server WITH ssl");

  // use staging certs, they won't work anyway
  server = require('https').createServer({
    key: fs.readFileSync('../server/ssl/staging/imaginetime.key')
    , cert: fs.readFileSync('../server/ssl/staging/d1b039f21b0fa601.crt')
    , ca: [fs.readFileSync('../server/ssl/staging/gd_bundle-g2-g1.crt')]
    // key: fs.readFileSync('../server/ssl/staging/imaginetime.key')
    // , cert: [fs.readFileSync('../server/ssl/staging/private.pem')]
  }, app);

  server.listen(9191); // NOTE: uncomment to test HTTPS locally
  // server.listen(443)


  // need to catch for all http requests and redirect to httpS
  if(config.httpsOptional) {
    require('http').createServer(app).listen(80);
  } else {
    require('http').createServer((req, res) => {
      logger.info("REDIRECTING TO HTTPS");
      res.writeHead(302, {
        // 'Location': `https://${config.appUrl}:443` + req.url
        'Location': `https://localhost:9191` + req.url // NOTE: uncomment to test HTTPS locally
      });
      res.end();
    }).listen(3030); // NOTE: uncomment to test HTTPS locally
    // }).listen(80);
  }

  logger.info('Yote DEV is listening on port ' + 3030 + ' and ' + 9191 + '...');

} else {
  // demos
  
  logger.info("starting yote dev server");
  server = require('http').createServer(app).listen(config.port);
  logger.info('Yote is listening on port ' + config.port + '...');
}

// init socketio
let io = require('socket.io')(server);
io.on('connection', (socket) => {
  // NOTE: socketList and the related stuff is here for debugging socket issues.
  // let socketList = []

  // console.log('a web client connected', socket.id);
  // if(socketList.indexOf("" + socket.id) === -1) {
  //   socketList.push(socket.id)
  //   console.log('# of open connections: ', socketList.length)
  //   console.log('List: ', socketList)
  // }

  // socket.on('disconnect', () => {
  //   console.log('user disconected', socket.id)
  //   socketList.splice(socketList.indexOf("" + socket.id), 1)
  //   console.log('# of open connections: ', socketList.length)
  //   console.log('List: ', socketList)
  // })
  socket.on('subscribe', (userId) => {
    // First check if the user already has a subscription.
    if(!Object.keys(socket.rooms).includes(userId + '')) {
      console.log('joining private room', userId)
      // Create a private room with the userId so we can send events directly to each user by id.
      socket.join(userId)
    }
  })

  // front end dynamic progress 
  socket.on('start_progress', (userId, actionText) => {
    console.log('start_progress', userId, actionText)
    io.to(userId).emit('start_progress', actionText);
  });
 
  socket.on('progress_status', (userId, progressPercent) => {
    console.log('start_progress', userId, progressPercent)
    io.to(userId).emit('progress_status', progressPercent);
  });

  socket.on('finish_progress', (userId, actionText) => {
    console.log('finish_progress', userId, actionText)
    io.to(userId).emit('finish_progress', actionText);
  });
});

// inject the socketio handler into the request object so we can use it throughout the rest of the app
app.use((req, res, next) => {
  req.io = io;
  next();
});
// routes have to come last, but it appears that you can call this after initing the server with the app object
app.use('/', router);
