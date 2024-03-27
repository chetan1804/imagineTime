/**
 * All file CRUD actions
 *
 * Actions are payloads of information that send data from the application
 * (i.e. Yote server) to the store. They are the _only_ source of information
 * for the store.
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import api utility
import apiUtils from '../../global/utils/api'
import queryString from 'query-string';

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.file;
  if(!id) {
    // passed in null or undefined for the id parameter.  so we should NOT fetch 
    return false;
  } else if(selected.id != id) {
    // the "selected" id changed, so we _should_ fetch
    // console.log("Y shouldFetch - true: id changed");
    return true;
  } else if(selected.isFetching) {
    // "selected" is already fetching, don't do anything
    // console.log("Y shouldFetch - false: isFetching");
    return false;
  } else if(!byId[id] && !selected.error) {
    // the id is not in the map, fetch from server
    // however, if the api returned an error, then it SHOULDN'T be in the map
    // so re-fetching it will result in an infinite loop
    // console.log("Y shouldFetch - true: not in map");
    return true;
  } else if(new Date().getTime() - selected.lastUpdated > (1000 * 60 * 5)) {
    // it's been longer than 5 minutes since the last fetch, get a new one
    // console.log("Y shouldFetch - true: older than 5 minutes");
    // also, don't automatically invalidate on server error. if server throws an error,
    // that won't change on subsequent requests and we will have an infinite loop
    return true;
  } else {
    // if "selected" is invalidated, fetch a new one, otherwise don't
    // console.log("Y shouldFetch - " + selected.didInvalidate + ": didInvalidate");
    return selected.didInvalidate;
  }
}

export const INVALIDATE_SELECTED_FILE = "INVALIDATE_SELECTED_FILE"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_FILE
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleFileById(id))
  } else {
    return dispatch(returnSingleFilePromise(id)); // return promise that contains file
  }
}


export const returnSingleFilePromise = (id) => (dispatch, getState) => {
  /**
   * This returns the object from the map so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. this is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve) => {
    resolve({
      id: id
      , item: getState().file.byId[id]
      , success: true
      , type: "RETURN_SINGLE_FILE_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_FILE = "REQUEST_SINGLE_FILE";
function requestSingleFile(id) {
  return {
    id
    , type: REQUEST_SINGLE_FILE
  }
}

export const RECEIVE_SINGLE_FILE = "RECEIVE_SINGLE_FILE";
function receiveSingleFile(json) {
  return {
    error: json.message
    , id: json.file ? json.file._id : null
    , item: json.file
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_FILE
  }
}

export function fetchSingleFileById(id, apitoken = '') {
  return dispatch => {
    dispatch(requestSingleFile(id))
    return apiUtils.callAPI(`/api/files/${id}?vendorapitoken=${apitoken}`)
      .then(json => dispatch(receiveSingleFile(json)))
  }
}

export const ADD_SINGLE_FILE_TO_MAP = "ADD_SINGLE_FILE_TO_MAP";
export function addSingleFileToMap(item) {
  return {
    item
    , type: ADD_SINGLE_FILE_TO_MAP
  }
}

export const SET_SELECTED_FILE = "SET_SELECTED_FILE";
export function setSelectedFile(item) {
  return {
    type: SET_SELECTED_FILE
    , item
  }
}

export const REQUEST_DEFAULT_FILE = "REQUEST_DEFAULT_FILE";
function requestDefaultFile(id) {
  return {
    type: REQUEST_DEFAULT_FILE
  }
}

export const RECEIVE_DEFAULT_FILE = "RECEIVE_DEFAULT_FILE";
function receiveDefaultFile(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_FILE
  }
}

export function fetchDefaultFile() {
  return dispatch => {
    dispatch(requestDefaultFile())
    return apiUtils.callAPI(`/api/files/default`)
      .then(json => dispatch(receiveDefaultFile(json)))
  }
}

export const REQUEST_FILE_SCHEMA = "REQUEST_FILE_SCHEMA";
function requestFileSchema(id) {
  return {
    type: REQUEST_FILE_SCHEMA
  }
}
 export const RECEIVE_FILE_SCHEMA = "RECEIVE_FILE_SCHEMA";
function receiveFileSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FILE_SCHEMA
  }
}
 export function fetchFileSchema() {
  return dispatch => {
    dispatch(requestFileSchema())
    return apiUtils.callAPI(`/api/files/schema`)
      .then(json => dispatch(receiveFileSchema(json)))
  }
}

// export const REQUEST_CREATE_FILE = "REQUEST_CREATE_FILE";
// function requestCreateFile(file) {
//   return {
//     file
//     , type: REQUEST_CREATE_FILE
//   }
// }

// export const RECEIVE_CREATE_FILE = "RECEIVE_CREATE_FILE";
// function receiveCreateFile(json) {
//   return {
//     error: json.message
//     , id: json.file ? json.file._id : null
//     , item: json.file
//     , receivedAt: Date.now()
//     , success: json.success
//     , type: RECEIVE_CREATE_FILE
//   }
// }

// export function sendCreateFile(data) {
//   return dispatch => {
//     dispatch(requestCreateFile(data))
//     return apiUtils.callAPI('/api/files', 'POST', data)
//       .then(json => dispatch(receiveCreateFile(json)))
//   }
// }

export const REQUEST_CREATE_FILES = "REQUEST_CREATE_FILES";
function requestCreateFiles(file) {
  return {
    type: REQUEST_CREATE_FILES
    , file
  }
}

export const RECEIVE_CREATE_FILES = "RECEIVE_CREATE_FILES";
function receiveCreateFiles(json) {
  return {
    type: RECEIVE_CREATE_FILES
    , files: json.files
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}


export const fetchNewFileList = (json, ...listArgs) => (dispatch, getState) => {
  const state = getState();
  const listItemIds = findListFromArgs(state, listArgs).items;
  let listItems = listItemIds ? listItemIds.map(id => state.file.byId[id]) : [];
  console.log("fetchNewFileList", json, listArgs)
  console.log("listItemIds", listItemIds)
  console.log("listItems", listItems)
  
  if (listItemIds && listItems && json.files) {
    listItems.push(...json.files);
    const data = {
      files: listItems
      , success: json.success
    }
    dispatch(receiveFileList(data, listArgs));
  } else {
    return {
      listArgs
      , type: INVALIDATE_FILE_LIST
    }
  }
}

export function sendUploadFiles(hex, data) {
  return dispatch => {
    dispatch(requestCreateFiles(data))
    return fetch(`/api/files/request-task/${hex}`, {
      method: 'POST'
      , headers: {}
      , credentials: 'same-origin'
      , body: data // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => {
      // console.log("TESTING", response)
      if(response && response.status == 503) {
        // server timeout or related error, need to catch for it somehow
        return {
          success: false
          , message: "Server connection error. Please try refreshing the page and check your internet connection. If issue persists, please contact an admin."
        }
      } else {
        return response;
      }
    })
    .then(response => typeof(response.json) == 'function' ? response.json() : response)
    .then(json => dispatch(receiveCreateFiles(json)))
  }
}

export function sendCreateFiles(data) {

  const linkPathnames = [
    '/link/request-file',
    '/link/share-file',
    '/link/request-signature'
  ]

  let route = '/api/files';

  const { vendorapitoken } = queryString.parse(decodeURIComponent(window.location.search));
  const pathname = !!window.location.pathname ? window.location.pathname : '';

  if(!!vendorapitoken && !!pathname && linkPathnames.some(i => i == pathname)) {
    route += `?vendorapitoken=${vendorapitoken}`
  }

  return dispatch => {
    dispatch(requestCreateFiles(data))
    return fetch(route, {
      method: 'POST'
      , headers: {}
      , credentials: 'same-origin'
      , body: data // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => {
      // console.log("TESTING", response)
      if(response && response.status == 503) {
        // server timeout or related error, need to catch for it somehow
        return {
          success: false
          , message: "Server connection error. Please try refreshing the page and check your internet connection. If issue persists, please contact an admin."
        }
      } else {
        return response;
      }
    })
    .then(response => typeof(response.json) == 'function' ? response.json() : response)
    .then(json => dispatch(receiveCreateFiles(json)))
  }
}


export const REQUEST_UPDATE_FILE = "REQUEST_UPDATE_FILE";
function requestUpdateFile(file) {
  return {
    id: file ? file._id: null
    , file
    , type: REQUEST_UPDATE_FILE
  }
}

export const RECEIVE_UPDATE_FILE = "RECEIVE_UPDATE_FILE";
function receiveUpdateFile(json) {
  return {
    error: json.message
    , id: json.file ? json.file._id : null
    , item: json.file
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_FILE
  }
}

export const REQUEST_CREATE_FOLDER_PERMISSION = "REQUEST_CREATE_FOLDER_PERMISSION";
function requestCreateFolderPermission(permission) {
  return {
    type: REQUEST_CREATE_FOLDER_PERMISSION
    , permission
  }
} 

export function sendCreateFolderPermission(data) {
  return dispatch => {
    dispatch(requestCreateFolderPermission(data))
    return apiUtils.callAPI('/api/folder-permission/create', 'POST', data)
      .then(json => dispatch(receiveUpdateFile(json)))
  }
}

export function updateFileFromMap(json) {
  return {
    error: json.message
    , id: json.file ? json.file._id : null
    , item: json.file
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_FILE
  }
}

export function sendUpdateFile(data) {
  delete data.olderVersions;
  delete data.totalChildFolder;
  delete data.totalChildFile;
  delete data.fileVersionCount;
  delete data.permission;
  return dispatch => {
    dispatch(requestUpdateFile(data))
    return apiUtils.callAPI(`/api/files/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateFile(json)))
  }
}

export const REQUEST_BULK_UPDATE_FILE = "REQUEST_BULK_UPDATE_FILE";
function requestBulkUpdateFiles(file) {
  return {
    file
    , type: REQUEST_BULK_UPDATE_FILE
  }
}

export const RECEIVE_BULK_UPDATE_FILE = "RECEIVE_BULK_UPDATE_FILE";
function receiveBulkUpdateFiles(json) {
  return {
    error: json.message
    , item: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_UPDATE_FILE
  }
}


export function sendUBulkupdateFiles(data) {
  return dispatch => {
    dispatch(requestBulkUpdateFiles(data))
    return apiUtils.callAPI(`/api/files/bulkUpdate`, 'POST', data)
      .then(json => dispatch(receiveBulkUpdateFiles(json)))
  }
}

export function sendBulkRestoreFiles(data) {
  return dispatch => {
    dispatch(requestBulkUpdateFiles(data))
    return apiUtils.callAPI('/api/files/bulk-restore', 'POST', data)
      .then(json => dispatch(receiveBulkUpdateFiles(json)))
  }
}

// export function sendUpdateStatus(data) {
//   return dispatch => {
//     dispatch(requestBulkUpdateFiles(data))
//     return apiUtils.callAPI(`/api/files/bulk-update-status`, 'POST', data)
//       .then(json => dispatch(receiveBulkUpdateFiles(json)))
//   }
// }

export const RECEIVE_BULK_DELETE_FILE = "RECEIVE_BULK_DELETE_FILE";
function receiveBulkUpdateFiles(json) {
  return {
    error: json.message
    , list: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_DELETE_FILE
  }
}

export const RECEIVE_BULK_UPDATE_FILE_STATUS = "RECEIVE_BULK_UPDATE_FILE_STATUS";
// function receiveBulkUpdateFilesStatus(json) {
//   return {
//     error: json.message
//     , list: json.data
//     , receivedAt: Date.now()
//     , success: json.success
//     , type: RECEIVE_BULK_UPDATE_FILE_STATUS
//   }
// }

// export const REQUEST_BULK_UPDATE_FILE_STATUS = "REQUEST_BULK_UPDATE_FILE_STATUS";
// function requestBulkUpdateFilesStatus(file) {
//   return {
//     file
//     , type: REQUEST_BULK_UPDATE_FILE_STATUS
//   }
// }

export const REQUEST_BULK_DELETE_FILE = "REQUEST_BULK_DELETE_FILE";
function requestBulkDeleteFiles(file) {
  return {
    file
    , type: REQUEST_BULK_DELETE_FILE
  }
}

// export function sendBulkUpdateFilesStatus(data) {
//   return dispatch => {
//     dispatch(requestBulkUpdateFilesStatus(data))
//     return apiUtils.callAPI(`/api/files/bulk-update-status`, 'POST', data)
//       .then(json => dispatch(receiveBulkUpdateFilesStatus(json)))
//   }
// }

export function sendBulkDeleteFiles(data) {
  return dispatch => {
    dispatch(requestBulkDeleteFiles(data))
    return apiUtils.callAPI(`/api/files/bulk-delete`, 'POST', data)
      .then(json => dispatch(receiveBulkUpdateFiles(json)))
  }
}

export const REQUEST_DELETE_FILE = "REQUEST_DELETE_FILE";
function requestDeleteFile(id) {
  return {
    id
    , type: REQUEST_DELETE_FILE
  }
}

export const RECEIVE_DELETE_FILE = "RECEIVE_DELETE_FILE";
function receiveDeleteFile(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_FILE
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteFile(id))
    return apiUtils.callAPI(`/api/files/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteFile(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest fileLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.file.lists, {});
  // console.log(listArgs);
  let list = { ...state.file.lists }
  for(let i = 0; i < listArgs.length; i++) {
    list = list[listArgs[i]];
    if(!list) {
      return false;
    }
  }
  return list;
}

const shouldFetchList = (state, listArgs) => {
  /**
   * Helper method to determine whether to fetch the list or not from arbitrary
   * listArgs
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetchList with these args ", listArgs, "?");
  const list = findListFromArgs(state, listArgs);
  // console.log("LIST in question: ", list);
  if(!list || !list.items) {
    // yes, the list we're looking for wasn't found
    // console.log("X shouldFetch - true: list not found");
    return true;
  } else if(list.isFetching) {
    // no, this list is already fetching
    // console.log("X shouldFetch - false: fetching");
    return false
  } else if(new Date().getTime() - list.lastUpdated > (1000 * 60 * 10)) {
    // yes, it's been longer than 25 minutes since the last fetch
    // console.log("X shouldFetch - true: older than 5 minutes");
    return true;
  } else {
    // maybe, depends on if the list was invalidated
    // console.log("X shouldFetch - " + list.didInvalidate + ": didInvalidate");
    return list.didInvalidate;
  }
}

export const fetchListIfNeeded = (...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchList(...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}

export const returnFileListPromise = (...listArgs) => (dispatch, getState) => {
  /**
   * This returns the list object from the reducer so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. This is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */

  // return the array of objects just like the regular fetch
  const state = getState();
  const listItemIds = findListFromArgs(state, listArgs).items;
  const listItems = listItemIds ? listItemIds.map(id => state.file.byId[id]) : listItemIds;

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_FILE_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_FILE_LIST = "REQUEST_FILE_LIST"
function requestFileList(listArgs) {
  return {
    listArgs
    , type: REQUEST_FILE_LIST
  }
}

export const RECEIVE_FILE_LIST = "RECEIVE_FILE_LIST"
function receiveFileList(json, listArgs) {
  return {
    error: json.message
    , list: json.files
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FILE_LIST
    , totalFiles: json.totalFiles
    , objClientNotes: json.objClientNotes
  }
}

export const ADD_FILE_TO_LIST = "ADD_FILE_TO_LIST";
export function addFileToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_FILE_TO_LIST
      , id: item
      , listArgs
    }
  } else { 
    return {
      type: ADD_FILE_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}


export const ADD_FILES_TO_LIST = "ADD_FILES_TO_LIST";
export function addFilesToList(ids, ...listArgs) {
  console.log('addFileToList fired')
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // let ids = ids.map(item => {
  //   if(typeof(item) === 'string' || typeof(item) === 'number') {
  //     return item
  //   } else {
  //     return item._id
  //   }
  // })
  console.log('ids', ids)
  return {
    type: ADD_FILES_TO_LIST
    , ids
    , listArgs
  }
}



export const REMOVE_FILE_FROM_LIST = "REMOVE_FILE_FROM_LIST"
export function removeFileFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_FILE_FROM_LIST
    , id
    , listArgs
  }
}

export function fetchList(...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFileList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/files/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/files/by-[ARG1]/[ARG2]".
     *    ex: /api/files/by-category/:category
     *  if 2nd arg is an array, though, return "/api/files/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/files";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of files given an array of file id's, among other things
      apiTarget += `/by-${listArgs[0]}-list?`;
      // build query string
      for(let i = 0; i < listArgs[1].length; i++) {
        apiTarget += `${listArgs[0]}=${listArgs[1][i]}&`
      }
    } else if(listArgs.length == 2) {
      // ex: ("author","12345")
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
    } else if(listArgs.length > 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
      for(let i = 2; i < listArgs.length; i++) {
        apiTarget += `/${listArgs[i]}`;
      }
    }
    return apiUtils.callAPI(apiTarget).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */

export const SET_FILE_QUERY = "SET_FILE_QUERY"
export function setQuery(query, ...listArgs) {
  console.log(SET_FILE_QUERY, query)
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_FILE_QUERY
    , query
    , listArgs
  }
}

export const SET_FILE_FILTER = "SET_FILE_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_FILE_FILTER
  }
}

export const SET_FILE_PAGINATION = "SET_FILE_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_FILE_PAGINATION
  }
}

export const INVALIDATE_FILE_LIST = "INVALIDATE_FILE_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_FILE_LIST
  }
}


export const RECEIVE_SCAN_FILE = "RECEIVE_SCAN_FILE";
function receiveScanFile(json) {
  return {
    type: RECEIVE_SCAN_FILE
    , result: json.CleanResult
  }
}

export function sendScanFile(file) {
  return dispatch => {
    return fetch('https://api.cloudmersive.com/virus/scan/file', {
      method: 'POST'
      , headers: {
        'ApiKey': '7457ccf3-e7e0-404e-81de-e19788500a0e'
      }
      , credentials: 'same-origin'
      , body: file // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => typeof(response.json) == 'function' ? response.json() : response)
    .then(json => dispatch(receiveScanFile(json)))
    .catch(e => {
      console.log(e);
      return 'failed';
    })
  }
}

export function sendCreateFolder(data) {
  return dispatch => {
    dispatch(requestCreateFiles(data))
    return apiUtils.callAPI('/api/files/folder', 'POST', data)
      .then(json => dispatch(receiveCreateFiles(json)))
  }
}

export function sendCreateBulkFolders(filePointers, folders) {
  return dispatch => {
    return apiUtils.callAPI('/api/files/bulkFolder', 'POST', { filePointers, folders })
  }
}

export function fetchSingleWithoutPermission(quickTask) {
  return dispatch => {
    dispatch(requestSingleFile(quickTask._unsignedFiles[0]))
    return apiUtils.callAPI(`/api/files/quickTaskId/${quickTask._id}`)
      .then(json => dispatch(receiveSingleFile(json)))
  }
}

export function fetchListByRequestTask(id) {
  return dispatch => {
    return apiUtils.callAPI(`/api/files/request-task/${id}`)
      .then(json => json)
  }
}


export const REQUEST_TOTAL_BY_CLIENTIDS = "REQUEST_TOTAL_BY_CLIENTIDS"
function requestTotalByClientIds(listArgs) {
  return {
    listArgs
    // , type: REQUEST_FILE_LIST
    , type: REQUEST_TOTAL_BY_CLIENTIDS
  }
}

export const RECEIVE_TOTAL_BY_CLIENTIDS = "RECEIVE_TOTAL_BY_CLIENTIDS"
function receiveTotalByClientIds(json, listArgs) {
  return {
    error: json.message
    , items: json.data
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_TOTAL_BY_CLIENTIDS
  }
}

export const fetchTotalByClientIdsIfNeeded = (listArgs, clientIds, firmId, totalPublicAndPersonal) => (dispatch, getState) => {
  // get total folder and files of clients
  if(shouldFetchList(getState(), listArgs)) {
    // dispatch(requestPhoneNumberList(listArgs))
    dispatch(requestTotalByClientIds(listArgs))
    return apiUtils.callAPI('/api/files/list-by-client-ids', 'POST', { clientIds, firmId, totalPublicAndPersonal })
        .then(json => {
          if (json && json.data && !json.data.public && !json.data.personal && totalPublicAndPersonal.public && totalPublicAndPersonal.personal) {
            json.data = { ...json.data, ...totalPublicAndPersonal}
          }
          return dispatch(receiveTotalByClientIds(json, listArgs))
        });
  } else {
    return dispatch(returnFileListPromise(listArgs));
  }
}

export const fetchListIfNeededV2 = (data, ...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchListV2(data, ...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}

export const fetchTotalChildFileIfNeeded = (data, ...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchTotalChildFile(data, ...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}

export const fetchTotalChildFolderIfNeeded = (data, ...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchTotalChildFolder(data, ...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}

export const fetchFilePermissionIfNeeded = (data, ...listArgs) => (dispatch, getState) => {
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchFilePermission(data, ...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}

export const fetchParentFoldersIfNeeded = (id, ...listArgs) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchParentFolders(id, ...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}

export function fetchParentFolders(id, ...listArgs) {
  return dispatch => {
    dispatch(requestFileList(listArgs));
    return apiUtils.callAPI(`/api/files/get-parent-folder/${id}`).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

export function fetchListV2(data, ...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFileList(listArgs));

    return apiUtils.callAPI('/api/files/v2/search', 'POST', data).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

export function fetchTotalChildFile(data, ...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFileList(listArgs));

    return apiUtils.callAPI('/api/files/total-child-file', 'POST', data).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

export function fetchTotalChildFolder(data, ...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFileList(listArgs));

    return apiUtils.callAPI('/api/files/total-child-folder', 'POST', data).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

export function fetchFilePermission(data, ...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFileList(listArgs));

    return apiUtils.callAPI('/api/files/file-permission', 'POST', data).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

export function fetchVersionList(id, ...listArgs) {
  return dispatch => {
    if(listArgs.length === 0) {
      // default to "all" list if we don't pass any listArgs
      listArgs = ["all"];
    }
    dispatch(requestFileList(listArgs));
    return apiUtils.callAPI(`/api/files/file-version/${id}`).then(
      json => dispatch(receiveFileList(json, listArgs))
    )
  }
}

export const fetchVersionListIfNeeded = (id) => (dispatch, getState) => {
  let listArgs = ["file-version", id]; 
  if(listArgs.length === 0) {
    // If no arguments passed, make the list we want "all"
    listArgs = ["all"];
  }
  if(shouldFetchList(getState(), listArgs)) {
    return dispatch(fetchVersionList(id, ...listArgs));
  } else {
    return dispatch(returnFileListPromise(...listArgs));
  }
}