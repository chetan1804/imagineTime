const auth = require('./authenticator');

module.exports = (socket) => {
    auth.init(socket);
}