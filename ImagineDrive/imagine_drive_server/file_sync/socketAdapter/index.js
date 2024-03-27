let socketIO;               // handles socket api
let socket = {};            // this instance 

// initialize this handler
socket = function(server) {
    console.log('connecting socket');
    socketIO = require('socket.io')(server, {allowEIO3: true});
    return socketIO;
}

module.exports = socket;