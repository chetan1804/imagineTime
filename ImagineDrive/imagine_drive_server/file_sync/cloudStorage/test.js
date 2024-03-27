let files = [/*{ 
    uri: 'client 1\\citrix.exe',
    lastModified: 1616089786000,
    available: 36661880,
    totalSize: 36661880,
    client: 'client 1',
    device: 'device1'
}*/];
/*
lastModified:1616089786000
device:null
client:'client 1'
available:12402688
totalSize:12402688
uri:'client 1\\Dokan_x64.msi'
*/

function findFileIndex(path = '') {
    return files.findIndex( (item) => item.uri === path)
}

function updateMetaFile(username = '', data) {
    return new Promise(function(resolve, reject) {
        const fileI = findFileIndex(data.uri);
        if (fileI < 0)
            files.push(data);
        else
            files[fileI] = data;
        resolve();
    });
}

// rejectIFDeleted: true if want to reject if file mark as deleted
function retrieveMetaFile(uri = '', rejectIfDeleted = false) {
    return new Promise(function(resolve, reject) {
        const fileI = findFileIndex(uri);
        let file = null;
        if (fileI >= 0)
            file = files[fileI];
        if (file !== null && rejectIfDeleted && file.deleted) 
            file = null;
        if (file !== null) 
            resolve(file);
        else
            reject({message:'Meta file not found for ' + uri, 'code':'DELETED'});
    }); 
}

function moveFile(username, data) {

}

function deleteFile(username, path) {
    return new Promise(function(resolve, reject) {
        var fileI = findFileIndex(path);
        if (fileI >= 0) {
            files[fileI].deleted = true;
            resolve(files[fileI]);
        }
        else
            reject('file couldnt be found');
    });
}

function reset() {
    return new Promise(function(resolve, reject) {
        files = [];
        resolve();
    });
}

function retrieveFiles(username) {
    return new Promise(function(resolve, reject) {
        resolve(files);
    });
} 

module.exports = {
    updateMetaFile: updateMetaFile,
    moveFile: moveFile, 
    deleteFile: deleteFile,
    retrieveFiles: retrieveFiles,
    retrieveMetaFile: retrieveMetaFile,
    reset: reset,
}