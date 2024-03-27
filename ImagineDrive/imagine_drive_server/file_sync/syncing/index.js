

module.exports = {
    init: function(socket, client) {
        require('./fileDirectory').init(socket, client);
        require('./fileAccountProfile').initialize(socket, client);
        require('./sessionManager').init(socket, client);
    }
}