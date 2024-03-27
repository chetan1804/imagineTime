const option = require('./sessionOptions');
const { notifyWithFiles } = require('./fileAccountProfile');
const log = require('../log');
const TIMEOUT_SEC = 20;
const CODE_OUTDATED = 500;
const CODE_TIMEOUT = 501;
const CODE_FAILED = 502;

class streaming {
    sessionId = '';

    constructor(emitter, options = option, onFinished = null) {
        this.onFinished = onFinished;
        this.finished = false;
        this.sessionId = options.sessionId;
        this.tag = options.tag;
        this.options = options;
        this._onRecievedEvent = this._onRecievedEvent.bind(this);
        this._checkTimeout = this._checkTimeout.bind(this);
        this._onConnected = this._onConnected.bind(this);
        this.onOutdated = this.onOutdated.bind(this);
        this._onConnected(options.sessionId, options.client);
        this.emitter = emitter;
        this.emitter.on('reconnect', this._onConnected);
        this._checkTimeout();
    }

    onFailure() {
        log.writet(this.tag, 'Failure');
        this.finish({ code: CODE_FAILED, message: 'Session failed' });
    }

    onOutdated() {
        log.writet(this.tag, 'Outdated');
        this.finish({ code: CODE_OUTDATED, message: 'this was marked as outdated' });
    }

    // use to check if this session was timeout
    _checkTimeout() {
        if (!this.isConnected()) {
            log.writet(this.tag, this.sessionId + ' TIMEOUT');
            if (this.options.onTimeout)
                this.options.onTimeout(null);
        }
        else {
            this.timeout = setTimeout(this._checkTimeout, TIMEOUT_SEC * 1000);
        }
    }

    // callback when client was reconnected
    _onConnected(id, newClient) {
        if (this.sessionId == id) {
            this.sessionId = id;
            this.client = newClient;
            this.client.on(id, this._onRecievedEvent);
        }
    }

    isConnected() {
        return this.client.connected;
    }

    error(err) {
        log.writet(this.tag, "Error " + err.message, err.stack)
        this.transmit('error', { message: err.message, code: err.code });
    }

    // finish this with timeout message
    finishWithTimeout() {
        this.finish({ code: CODE_TIMEOUT, message: 'this streaming was timeout' });
    }

    finish(data = null) {
        if (this.finished)
            return;
        if (this.onFinished)
            this.onFinished();
        this.finished = true;
        log.writet(this.tag, this.sessionId + ' finished streaming');
        if (this.isConnected())
            this.client.emit(this.sessionId, { 'action': 'finish' });
        this.options.onFinished(data);
        this.client.off(this.sessionId, this._onRecievedEvent);
        this.emitter.off('reconnect', this._onConnected);
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.transmit('finished', data);
    }

    _onRecievedEvent(data, callback) {
        if (this.tag && data.action !== 'upload')
            log.writet(this.sessionId, this.tag, ' recieved event ', data.action);
        switch (data.action) {
            case 'upload':
                if (this.options.onUploaded)
                    this.options.onUploaded(data);
                break;
            case 'ready':
                if (this.options.onReady)
                    this.options.onReady(data);
                break;
            case 'start':
                if (this.options.onStarted)
                    this.options.onStarted(data);
                break;
            case 'finish':
                this.finish(data);
                break;
            /*case 'outdated':
                if (this.options.onOutdated)
                    this.options.onOutdated(data);*/
        }
        callback({ code: 200 });
    }

    // transmit only to client who started this streaming
    transmit(action = '', data, callback = null) {
        data = { ...data, action: action };
        if (!callback)
            return this.client.emit(this.sessionId, data);
        else
            return this.client.emit(this.sessionId, data, callback);
    }

    // transmit to sockets connected to client dir. client might be a client folder
    // @action: what type of action for streaming
    // @data: data to transfer
    // @client: room who will recieved
    transmitToSharedStream(action = '', data, clientId, staffId, firmId) {
        data = { ...data, action: action };
        notifyWithFiles(clientId, staffId, firmId, this.options.uri, data, this.client);
    }
}

module.exports = streaming;