/**
 * User's API includes login to session, login and retrieve API token, logout,
 * and standard CRUD.
 */
// import model
const Client = require("../client/ClientModel");
const ClientUser = require("../clientUser/ClientUserModel");
const Staff = require("../staff/StaffModel");
// library
const { raw, ref } = require("objection");

let passport = require("passport");
let jwt = require("jsonwebtoken");
let User = require("./UserModel");
let users = require("./usersController");
let logger = global.logger;
let env = (process.env.NODE_ENV = process.env.NODE_ENV || "development");
let config = require("../../config")[env];

let speakeasy = require("speakeasy");
let qrcode = require("qrcode");
const cookieParser = require("cookie-parser");

const Session = require("../session/SessionModel");

module.exports = function (router, requireLogin, requireRole) {
  // user login and use session cookies
  router.post("/api/users/login", (req, res, next) => {
    const viewingAs = !!req.body.viewingAs ? req.body.viewingAs : "opi";

    if (req.body.username == undefined) {
      res.send({ success: false, message: "No username present." });
    } else {
      if (!!req.body.isMSLogin) {
        User.query()
          .where({
            MSUsername: req.body.username,
          })
          .first()
          .then((user) => {
            if (user) {
              User.query()
                .findById(user._id)
                .update({
                  username: user.username,
                  MSUniqueId: req.body.accountIdentifier,
                })
                .returning("*")
                .then((user) => {
                  if (user) {
                    req.logIn(user, (err) => {
                      if (err) {
                        return next(err);
                      }
                      console.log("req user", req.user);
                      logger.warn(req.user);
                      res.send({ success: true, user });
                    });
                  }
                });
            } else {
              res.send({
                success: false,
                message: "Microsoft Account is not connected",
              });
            }
          })
          .catch((err) => {
            res.send({ success: false, message: "Internal server error" });
          });
      } else {
        req.body.username = req.body.username.toLowerCase();
        passport.authenticate("local", { session: true }, (err, user) => {
          if (err) {
            res.send({ success: false, message: "Error authenticating user." });
          } else if (!user) {
            User.query()
              .where({ username: req.body.username })
              .first()
              .then((targetUser) => {
                if (targetUser) {
                  const hash = User.hashPassword(
                    targetUser.password_salt,
                    req.body.password
                  );
                  if (hash === targetUser.password_hash) {
                    res.send({
                      success: false,
                      message: "Matching user not found.",
                    });
                  } else {
                    res.send({
                      success: false,
                      message: "Incorrect Password.",
                    });
                  }
                } else {
                  res.send({
                    success: false,
                    message: "Matching user not found.",
                  });
                }
              })
              .catch((err) => {
                res.send({ success: false, message: "Internal server error" });
              });
          } else if (user.firstLogin) {
            Staff.query()
              .where({ _user: user._id })
              .then((staff) => {
                console.log("staff", staff);
                if (!staff || staff.length <= 0) {
                  user.isStaff = false;
                  res.send({
                    success: false,
                    message: "user-first-login",
                    user,
                  });
                } else {
                  user.isStaff = true;
                  res.send({
                    success: false,
                    message: "user-first-login",
                    user,
                  });
                }
              })
              .catch((err) => {
                res.send({ success: false, message: "Internal server error" });
              });
          } else {
            // User is authenticted. Now get actual user data from the db and log them in
            User.query()
              .findById(user._id)
              .then((user) => {
                if (!user) {
                  res.send({
                    success: false,
                    message: "Error logging user in.",
                  });
                } else {
                  if (!!user.enable_2fa && viewingAs == "main") {
                    qrcode.toDataURL(user.qrcode_2fa, function (err, data) {
                      user.qrcode_data = data;
                      res.send({ success: true, user });
                    });
                  } else {
                    req.logIn(user, (err) => {
                      if (err) {
                        return next(err);
                      }
                      logger.warn(req.user);

                      user.currentDate = Date.now();
                      console.log("user", user);
                      const ssotoken = jwt.sign(
                        { ...user },
                        config.secrets.sessionSecret
                      );

                      res.send({ success: true, user, userapitoken: ssotoken });
                    });
                  }
                }
              })
              .catch((err) => {
                res.send({ success: false, message: "Internal server error" });
              });
          }
        })(req, res, next);
      }
    }
  });
  //user login for token
  router.post("/api/users/token-login", (req, res, next) => {
    if (!!req.body.userapitoken) {
      const token = req.body.userapitoken;
      try {
        const user = jwt.verify(token, config.secrets.sessionSecret);
        user.tokenLogin = true;
        delete user.currentDate;
        delete user.iat;

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          } // logger.warn(req.user)
          req.user.tokenLogin = true
          res.send({ success: true, user });
        });
      } catch (err) {
        res.status(403);
        res.send({ success: false, message: "UNAUTHORIZED - NOT LOGGED IN" });
      }
    } else {
      res.send({ success: false, message: "No userapitoken present." });
    }
  });
  router.post("/api/users/enable-2fatoken", requireLogin(), (req, res) => {
    const verified = speakeasy.totp.verify({
      secret: req.body.secret_2fa,
      token: req.body.token,
    });

    if (verified) {
      User.query()
        .findById(req.body.user._id)
        .update({
          enable_2fa: req.body.enable_2fa,
          verified_2fa: true,
        })
        .returning("*")
        .then((user) => {
          res.send({ success: true, user });
        });
    } else {
      res.send({ success: false, message: "Invalid OTP token" });
    }
  });

  router.post("/api/users/verify-2fatoken", (req, res, next) => {
    const verified = speakeasy.totp.verify({
      secret: req.body.user.secret_2fa,
      token: req.body.token,
      encoding: "base32",
    });

    delete req.body.user.qrcode_data;

    if (verified) {
      req.body.user.verified_2fa = true;
      User.query()
        .findById(req.body.user._id)
        .update(req.body.user)
        .returning("*")
        .then((user) => {
          req.logIn(user, (err) => {
            if (err) {
              console.log(err);
              return next(err);
            }
            logger.warn(req.user);

            user.currentDate = Date.now();
            console.log("user", user);

            const ssotoken = jwt.sign(
              { ...user },
              config.secrets.sessionSecret
            );
            res.send({ success: true, user, userapitoken: ssotoken });
          });
        });
    } else {
      res.send({ success: false, message: "Invalid OTP token" });
    }
  });

  router.post("/api/users/enable-2fatoken", requireLogin(), (req, res) => {
    const verified = speakeasy.totp.verify({
      secret: req.body.secret_2fa,
      token: req.body.token,
    });

    if (verified) {
      User.query()
        .findById(req.body.user._id)
        .update({
          enable_2fa: req.body.enable_2fa,
          verified_2fa: true,
        })
        .returning("*")
        .then((user) => {
          res.send({ success: true, user });
        });
    } else {
      res.send({ success: false, message: "Invalid OTP token" });
    }
  });

  router.post("/api/users/verify-2fatoken", (req, res, next) => {
    const verified = speakeasy.totp.verify({
      secret: req.body.user.secret_2fa,
      token: req.body.token,
      encoding: "base32",
    });

    delete req.body.user.qrcode_data;

    if (verified) {
      req.body.user.verified_2fa = true;
      User.query()
        .findById(req.body.user._id)
        .update(req.body.user)
        .returning("*")
        .then((user) => {
          req.logIn(user, (err) => {
            if (err) {
              console.log(err);
              return next(err);
            }
            logger.warn(req.user);

            user.currentDate = Date.now();
            console.log("user", user);

            const ssotoken = jwt.sign(
              { ...user },
              config.secrets.sessionSecret
            );
            res.send({ success: true, user, userapitoken: ssotoken });
          });
        });
    } else {
      res.send({ success: false, message: "Invalid OTP token" });
    }
  });

  router.post("/api/users/login-uploadbox", (req, res, next) => {
    if (req.body.username == undefined) {
      res.send({ success: false, message: "No username present." });
    } else {
      req.body.username = req.body.username.toLowerCase();
      passport.authenticate("local", { session: true }, (err, user) => {
        if (err) {
          res.send({ success: false, message: "Error authenticating user." });
        } else if (!user) {
          res.send({ success: false, message: "Matching user not found." });
        } else {
          // User is authenticted. Now get actual user data from the db and log them in
          User.query()
            .findById(user._id)
            .then((user) => {
              if (!user) {
                res.send({ success: false, message: "Error logging user in." });
              } else {
                let clientName = req.body.clientName;
                Client.query()
                  .where(raw('lower("name")'), clientName.toLowerCase())
                  .first()
                  .asCallback((err, client) => {
                    if (err || !client) {
                      res.send({
                        success: false,
                        message: clientName + " not found",
                      });
                    } else {
                      ClientUser.query()
                        .where({ _client: client._id, _user: user._id })
                        .first()
                        .asCallback((err, clientUser) => {
                          if (err || !clientUser) {
                            res.send({
                              success: false,
                              message: "Client user not found",
                            });
                          } else {
                            req.logIn(user, (err) => {
                              if (err) {
                                return next(err);
                              }
                              logger.warn(req.user);
                              res.send({ success: true, user, client });
                            });
                          }
                        });
                    }
                  });
              }
            });
        }
      })(req, res, next);
    }
  });

  // user want to login and use an API token instead of session cookies -- i.e. for mobile
  router.post("/api/users/token", (req, res, next) => {
    res.send({
      success: false,
      message: "TOKEN LOGIN NOT IMPLEMENTED IN SQL YET",
    });
    return;
    req.body.username = req.body.username.toLowerCase();
    passport.authenticate("local", { session: false }, function (err, user) {
      if (err) {
        res.send({ success: false, message: "Error authenticating user." });
      }
      if (!user) {
        res.send({ success: false, message: "Matching user not found." });
      }
      logger.debug("TOKEN TIME");
      user.createToken(function (err, token) {
        if (err || !token) {
          res.send({
            success: false,
            message: "Unable to generate user API token",
          });
        } else {
          logger.debug("TOKEN");
          logger.debug(token);
          User.findById(user._id, (err, user) => {
            if (err || !user) {
              res.send({
                success: false,
                message: "Error retrieving matching user",
              });
            } else {
              // pass token explicitly to be stored on the mobile side
              // NOTE: this is the only way that a user token should be returned
              res.send({ success: true, user, token });
            }
          });
        }
      });
    })(req, res, next);
  });

  // user logout
  router.post("/api/users/logout", requireLogin(), async (req, res) => {
    // logout with token will not affect session status, and vice-versa
    logger.debug("logout");
    if (req.headers.token) {
      logger.debug("logout with token");
      // remove token object
      User.findOne({ apiToken: req.headers.token }).exec((err, user) => {
        if (err || !user) {
          logger.error("could not find user object to log out with");
          res.send({
            success: false,
            message: "could not find user object to log out with",
          });
        } else {
          user.removeToken((err) => {
            if (err) {
              logger.error(err);
              res.send({
                success: false,
                message: "could not remove user token",
              });
            } else {
              logger.debug("removed token");
              res.send({ success: true, message: "User logged out via token" });
            }
          });
        }
      });
    } else if (req.headers.userapitoken) {
      try {
        
        const userSession = await Session.query().findOne(
          raw("sess::json -> 'passport' ->'user' ->> 'id' = '100' and (sess::json -> 'passport' -> 'user' ->>'tokenLogin')::boolean = true")
        );

      
        if (userSession) {
          req.sessionStore.destroy(userSession.sid, (err) => {
            req.logout()
            if (err) {
              return res.status(500).json({
                success: false,
                err: err,
                message: "Error logging user out",
              });
            }
          });
        }

        return res.status(200).json({
          success: true,
          message: "User logged out.",
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Interval Server error",
        });
      }
    } else {
      logger.debug("logout with cookie");
      console.log("logout session", req.sessionID);
      /**
       * NOTE: known issues with passport local and logging out.
       * Not sure why this hasnt been a bigger issue for us before.
       * but we'd rather do this with our normal success true/false for consistency
       * https://github.com/jaredhanson/passport/issues/246
       */

      // // NOTE: Uncomment below to do it with status codes:
      // req.logout();
      // res.status(200).end();

      req.session.destroy((err) => {
        req.logout();
        if (err) {
          res.send({
            success: false,
            err: err,
            message: "Error logging user out",
          });
        } else {
          logger.debug("REMOVED SESSION OBJECT");
          res.send({ success: true, message: "User logged out." });
        }
      });
    }
  });

  
  /**
   * User's CRUD API
   */

  // - Create
  router.post("/api/users/register", users.register); // create and login
  router.post("/api/users", requireRole("admin"), users.create); // create without login

  // - Read
  router.get(
    "/api/users/search/global/by-objects",
    requireRole("admin"),
    users.objectSearch
  );
  // router.get('/api/users/search/global/by-tags'    , requireRole('admin'), users.tagSearch);

  router.get("/api/users", requireRole("admin"), users.list); // must be an 'admin' to see the list of users
  router.get("/api/users/page=:page&per=:per", requireRole("admin"), users.paginatedList);
  // - specific user requests for clientUsers, staff, etc.
  /**
   * TODO: Change ALL of these to Tilda Swinton methodology
   */
  
  router.get(
    "/api/users/by-_clientArchivedUser/:clientId",
    requireLogin(),
    users.listByClientArchivedUser
  );
  router.get(
    "/api/users/by-_client/:clientId",
    requireLogin(),
    users.listByClient
  ); // meaning all clientUsers associated with this client
  router.get(
    "/api/users/by-_staff/:staffId",
    requireLogin(),
    users.listByStaff
  ); // meaning all clientUsers associated with this staff member (through assigned staffClients)
  router.get("/api/users/by-_firm/:firmId", requireLogin(), users.listByFirm); // meaning all clientUsers users associated with this firm
  router.get(
    "/api/users/by-_firmStaff/:firmId",
    requireLogin(),
    users.listByFirmStaff
  ); // meaning all staff users associated with this firm
  router.get(
    "/api/users/by-_clientStaff/:clientId",
    requireLogin(),
    users.listByClientStaff
  ); // meaning all active staff users associated with this client
  router.get("/api/users/non-clientusers", users.listByNonClientUser);
  router.get(
    "/api/users/by-:refKey/:refId*",
    requireRole("admin"),
    users.listByRefs
  );
  router.get(
    "/api/users/by-:refKey-list",
    requireRole("admin"),
    users.listByValues
  );
  router.get("/api/users/get-logged-in", requireLogin(), users.getLoggedInUser);
  router.get("/api/users/:id", requireLogin(), users.getById); // must be an 'admin' to see individual user info

  router.get("/api/ms/auth", users.msAuthentication);
  // - Update
  router.put("/api/users/update-profile", requireLogin(), users.updateProfile);
  router.put(
    "/api/users/update-secret/:reqUserId/:firmId",
    requireLogin(),
    users.updateSecretQuestion
  );
  router.put("/api/users/:userId", requireLogin(), users.update); // TODO: make sure we restrict this further somehow
  router.post("/api/users/password", requireLogin(), users.changePassword);
  router.post("/api/users/request-password-reset", users.requestPasswordReset);
  router.get(
    "/api/users/check-reset-request/:resetHex",
    users.checkResetRequest
  );
  router.post("/api/users/reset-password", users.resetPassword);

  router.post('/api/users/v2/search'     , requireLogin(), users.searchV2)

  // - Delete
  // NOTE: Be careful with this...
  router.delete("/api/users/:userId", requireRole("admin"), users.delete);
};
