const { getFileFromUri } = require('../cloudStorage/gstorage');
const { retrieveMetaFile } = require('../cloudStorage');
const session = require('./sessionManager');
const log = require('../log');
const e = require('express');
const constants = require('../constants');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDownloadStream(socket_client, fileInfo) {
    const uri = fileInfo.uri;
    const offset = fileInfo.offset;
    log.writet('fileDownloadStream', '----------initiating ' + uri);

    let readStream;
    let downloadSession;
    let completeFileMeta;
    downloadSession = session.create(false, {
        uri: uri,
        tag: 'fileDownloadStream',
        client: socket_client,
        // client is ready
        onReady: (data) => {
            // transmit the current state of file
            retrieveMetaFile(uri, true)
                .then((file) => {
                    completeFileMeta = file;
                    if (downloadSession)
                        downloadSession.transmit('ready', file);
                })
                .catch(err => {
                    if (downloadSession)
                        downloadSession.error(err);
                });
        },
        // session was started
        onStarted: async (data) => {
            // STEP: initialize file stream
            try {
                const remoteFile = await getFileFromUri(uri);
                readStream = remoteFile.createReadStream({ start: offset });
            } catch (e) {
                downloadSession.error(e);
                return;
            }

            let error = null;
            let reading = false;
            readStream
                .on('error', (err) => {
                    if (downloadSession)
                        downloadSession.error(err);
                    error = err;
                })
                .on('readable', async () => {
                    if (reading) return;
                    reading = true;
                    let chunk;
                    while (!error && readStream && null !== (chunk = readStream.read())) {
                        // if not connected then try to reconnect
                        let retry = 0;
                        const size = chunk.length;
                        let transmitResult = false;
                        while (downloadSession && !error) {
                            // try to transmit the data
                            downloadSession.transmit('data', {
                                data: chunk.toString('base64'),
                                dataSize: size
                            }, (_) => transmitResult = true);

                            // was the data transmit on the waiting time
                            var elapsed = Date.now();
                            while (!transmitResult && Date.now() - elapsed < 5000)
                                await sleep(25);

                            // did the data was transmitted
                            if (!transmitResult) {
                                console.log('Not connected retrying', retry);
                                retry++;
                                if (retry >= 3) {
                                    error = 'cant transfer';
                                    break;
                                }
                            }
                            else
                                break;
                        }
                    }
                    reading = false;
                })
            
            // FIX: if for fully uploaded file and file with invalid size returned by google file.
            // inform the client if the download was finished.
            // is this file fully uploaded? then inform the client
            //if (completeFileMeta.available === completeFileMeta.totalSize) {
                readStream.on('end', async () =>{
                    if (downloadSession.finished)
                        return
                    await sleep(500);
                    while (reading)
                        await sleep(500);
                    // sends download success signal
                    if (!error && downloadSession)
                        downloadSession.finish({code: constants.CODE_RESPONSE_SUC});
                });
            //}
        },
        onTimeout: (data) => {
            if (downloadSession)
                downloadSession.finishWithTimeout();
        },
        // session was finished
        onFinished: (data) => {
            if (downloadSession !== null) {
                downloadSession = null;
                if (readStream) {
                    readStream.destroy();
                    readStream = null;
                }
                //console.log('Finished download stream ', uri);
            }
        }
    });

    return downloadSession.sessionId;
}

module.exports = {
    createDownloadStream: createDownloadStream
}