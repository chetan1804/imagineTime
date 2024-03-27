const emitter = require('events');
const options = require('./sessionOptions');
const streaming = require('./streaming');
const sessionEmitter = new emitter.EventEmitter();
const activeSessions = {}; // {<uri>: [sessions]}
let sessionCounter = 0;

function onSessionReconnected(id = '', client) {
    sessionEmitter.emit('reconnect', id, client);
}

function removeSession(session) {
    const uri = session.options.uri;
    const list = activeSessions[uri];
    if (list) {
        const index = list.findIndex((element, _i) => session === element);
        if (index >= 0) {
            if (activeSessions[uri].length == 1)
                delete activeSessions[uri];
            else
                activeSessions[uri].splice(index)
        }
    }
}

function addSession(session, finishExisting = false) {
    const uri = session.options.uri;
    if (finishExisting) {
        // if same session id.
        // replace existing session with new session 
        // mark old session as outdated
        if (activeSessions[uri]) {
            const listSessions = activeSessions[uri];
            listSessions.forEach(element => {
                element.onOutdated();
            });
        }
        activeSessions[uri] = [session];
    }
    else {
        if (activeSessions[uri])
            activeSessions[uri].push(session);
        else
            activeSessions[uri] = [session];
    }
    session.onFinished = () => removeSession(session);
}

module.exports = {
    init: (socket, client) => {
        client.on('session-reconnected', (data, callback) => {
            onSessionReconnected(data.sessionId, client);
            callback({ code: 200 });
        });
    },
    /// @unique: true if will stop other streaming with same session
    /// @finishExisting: true if it will stop the existing sessions with same id
    create: (finishExisting = false, option = options) => {
        option.sessionId = 'sess-' + sessionCounter;
        var sess = new streaming(sessionEmitter, option);
        addSession(sess, finishExisting);
        sessionCounter++;
        return sess;
    },
    emitter: sessionEmitter
}