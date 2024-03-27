module.exports = {
    uri: '',
    sessionId: '',
    client: null,
    definition: { totalSize: 0, lastModified: 0 },
    onStarted: (_) => { },
    // client request to finish this
    onFinished: (_) => { },
    // a data was uploaded by client
    onUploaded: (_) => { },
    // the data was changed. this streaming was marked as outdated by client
    onOutdated: (_) => { },
    // called when the client connected 
    onReady: (_) => { },
    // called when this session was left by client without finishing
    onTimeout: (_) => { },
    // called when theres a session was created same id. use for checking the conflicts
    onCheckConflict: (_) => { },
    updateAt: 0,
    tag: ''
};
