const { EVENT_AUTH, EVENT_REAUTH,
    CODE_RESPONSE_SUC, CODE_RESPONSE_ERR,
    DEBUG, STAGING,
    LATEST_VERSION
 } = require("../constants");
const jwt = require('jsonwebtoken');
const knex = require('../db').instance;
const EventEmitter = require('events');
const log = require("../log");
const { checkPasswordHash } = require("./util");
const authEmitter = new EventEmitter();

// account states
const accountState = {
    SIGNED_IN: 1,
    SIGNED_OUT: 0,
    NOT_EXIST: 2,
    SERVER_ERROR: 7
}

// add data(device and userId) to socket 
function bindUserInfoToSocket(socket, deviceId, userId = null) {
    socket.device = deviceId;
    if (!userId) {
        knex('syncdevice').select('user').where('deviceId', deviceId)
            .then(res => {
                socket.userId = res[0].user;
            });
    } else
        socket.userId = userId;
}

/// retrieve current device/pc/mobile status
function retrieveDeviceStatus(deviceId = '') {
    return accountState.SIGNED_OUT;
}

// login given the password and username
async function login(clientSocket, username, password, deviceId = '', version) {
    try {
        // if not a valid version. then disconnect
        if (!isValidVersion(version)) {
            setTimeout(() => clientSocket.disconnect(true), 1000)
            return {code: accountState.SERVER_ERROR, message: 'Invalid version'}
        }

        // validate username
        const usersResults = await knex('users')
            .where('username', username)
            .select('_id as id', 'username', 'firstname', 'lastname', 'password_salt', 'password_hash');
        if (usersResults.length === 0)
            return { code: accountState.NOT_EXIST };

        let userData = usersResults[0];

        // validate password for production
        if (!(DEBUG || STAGING) && !checkPasswordHash(password, userData.password_salt, userData.password_hash))
            return { code: accountState.NOT_EXIST };

        userData = { id: userData.id, username: userData.username, firstname: userData.firstname, lastname: userData.lastname };
        const userId = userData.id;
        bindUserInfoToSocket(clientSocket, deviceId, userId);

        // update the device login
        await updateDeviceData({
            user: userId,
            deviceId: deviceId,
            accessedAt: knex.raw('now() at time zone \'utc\''),
            status: accountState.SIGNED_IN
        });

        // STEP: create signed token
        const payload = {
            userid: userId,
            username: username,
            firstname: userData.firstname,
            lastname: userData.lastname
        };
        let token = jwt.sign(payload, userId + deviceId);

        // STEP: let others know
        authEmitter.emit('login', { device: deviceId, client: clientSocket });
        return { code: accountState.SIGNED_IN, token: token };
    } catch (err) {
        return {code: accountState.SERVER_ERROR, message: err.message}
    }
}

// use to verify the existing token
async function verify(clientSocket, token, deviceId = '') {
    try {
        // STEP: decode and verify
        var decoded = jwt.decode(token);
        const userId = decoded.userid;
        jwt.verify(token, userId + deviceId);

        // STEP: check if the user is the one previously login in the device
        const syncdeviceResults = await knex('syncdevice')
            .where('user', userId)
            .andWhere('deviceId', deviceId);
        if (syncdeviceResults.length === 0)
            return { code: accountState.SIGNED_OUT };

        // STEP let others know
        bindUserInfoToSocket(clientSocket, deviceId, userId);
        authEmitter.emit('login', { device: deviceId, client: clientSocket });
        return { code: accountState.SIGNED_IN };
    } catch (e) {
        log.writet('Authenticator:verify', 'Error:', e.message);
        return { code: accountState.NOT_EXIST };
    }
}

async function logout(clientSocket, deviceId) {
    try {
        if (!clientSocket.userId) {
            return { code: accountState.SIGNED_OUT };
        }
        await updateDeviceData({
            user: clientSocket.userId,
            deviceId: deviceId,
            accessedAt: knex.raw('now() at time zone \'utc\''),
            status: accountState.SIGNED_OUT
        });
        authEmitter.emit('logout', { device: deviceId, client: clientSocket });
        return { code: accountState.SIGNED_OUT };
    } catch (err) {
        return {code: CODE_RESPONSE_ERR, message: err.message}
    }
}


function retrieveDeviceData(deviceId = '') {

}

// use to update device information
async function updateDeviceData(data = {}) {
    await knex('syncdevice')
        .insert(data)
        .onConflict('deviceId')
        .merge();
}

// use to validate connecting client
function isValidVersion(version) {
    if (version === undefined) return false
    return version >= LATEST_VERSION
}

module.exports = {
    init: (socket) => {
        socket.on('connection', clientSocket => {
            // callback when client do some authorization actions
            clientSocket.on(EVENT_AUTH, (data, callback) => {
                switch (data.action) {
                    case 'verify':
                        verify(clientSocket, data.token, data.device)
                            .then(verifyResult => callback(verifyResult));
                        break;
                    case 'login':
                        login(clientSocket, data.username, data.password, data.device, data.version)
                            .then(loginResponse => callback(loginResponse));
                        break;
                    case 'logout':
                        logout(clientSocket, data.device)
                            .then(logoutResponse => callback(logoutResponse));
                    default:
                        break;
                }

            });
            // callback when client was reconnected/reauthorize
            clientSocket.on(EVENT_REAUTH, (data, callback) => {
                // if not a valid version. then disconnect
                if (!isValidVersion(data.version)) {
                    callback({code: CODE_RESPONSE_ERR, message: 'Invalid version'})
                    setTimeout(() => clientSocket.disconnect(true), 1000)
                    return
                }
                const device = data.device;
                log.writet('Authenticator', 'User reauthorized/reconnected with device ' + device);
                bindUserInfoToSocket(clientSocket, device);
                authEmitter.emit('reauthorize', { device: device, client: clientSocket, firms: data.firms });
                callback({ code: CODE_RESPONSE_SUC });
            });
        });
    },
    retrieveDeviceStatus: retrieveDeviceStatus,
    // events emitted are - login, logout, reauthorize
    on: (eventStr, callback = (data) => { }) => {
        authEmitter.on(eventStr, callback);
    },
    // disable conntection
    off: (eventStr, callback = (data) => { }) => {
        authEmitter.off(eventStr, callback);
    }
}