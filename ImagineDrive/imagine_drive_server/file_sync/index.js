const socketLib = require('./socketAdapter');
const syncHandler = require('./syncing');
const account = require('./account');
const cstorage = require('./cloudStorage');
const db = require('./db');
const log = require('./log');
const constants = require('./constants');

module.exports = {
    init: async function (server) {
        log.writet('filesync', 'isDebug=' + constants.DEBUG + ', isStaging=' + constants.STAGING);
        await db.init();
        socketHandler = socketLib(server);
        socketHandler.on('connection', (client) => {
            syncHandler.init(socketHandler, client);
        });
        account(socketHandler);
        await cstorage.init();
    }
};