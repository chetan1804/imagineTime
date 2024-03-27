Socket requests

Updating client list of files need to be synchronize.
Type: server request
Event: FILE_DIR
Input: {'action':'update', 'initDate':<ms since epoch>}
Int Desc: action property should always be 'update' value. 'initDate' property epoch ms, this is the start range of use to query the values.
Response Success: {'files': [{'uri': <path>, lastModified: <ms epoch>, available: 0, totalSize: 0}], 'clients':['client 1', 'client 2'], 'code': 200}  
Response Desc: 'files' property will be the list of files that are available to cloud. 'clients' property are list of client names use for segragating files

Notify that a new file was added.
Type: server request
Event: FILE_DIR
Input: {'action':'add', 'file':{'uri': <path>, lastModified: <ms epoch>, available: 0, totalSize: 0, client:<client folder>, device:''}}
Input Desc: 'action' property should always be add. 'file' property is the definition of data to be added. device is what device use to upload this file
Response Success: {'code': 200}

Upload file to server
Type: server request
Event: FILE_UPLOAD
Input: {'uri': <file path>, 'offset': 0, datasize: <bufferlength>, 'data': <hexadecimal>, 'client': <client folder>}
Input Desc: 'path' property will be the address of file. 'offset' property is starting point which the data will be appended to existing file. 'data' property is the array of byte to be appended to existing file
Response Success: {'code': 200}

Recieved file changes from server
Type: server response
Event: FILE_DIR
Format: {'action': <add/remove/moved>, 'file': {'uri': <path>, lastModified: <ms epoch>, available: 0, totalSize: 0, client:<client folder>, device:''}}