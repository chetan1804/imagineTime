/**
 * All requestTask CRUD actions
 *
 * Actions are payloads of information that send data from the application
 * (i.e. Yote server) to the store. They are the _only_ source of information
 * for the store.
 *
 * REQUEST_TASK: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import api utility
import { map } from 'lodash';
import apiUtils from '../../global/utils/api'

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * REQUEST_TASK: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.requestTask;
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

export const INVALIDATE_SELECTED_REQUEST_TASK = "INVALIDATE_SELECTED_REQUEST_TASK"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_REQUEST_TASK
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleRequestTaskById(id))
  } else {
    return dispatch(returnSingleRequestTaskPromise(id)); // return promise that contains requestTask
  }
}


export const returnSingleRequestTaskPromise = (id) => (dispatch, getState) => {
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
      , item: getState().requestTask.byId[id]
      , success: true
      , type: "RETURN_SINGLE_REQUEST_TASK_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_REQUEST_TASK = "REQUEST_SINGLE_REQUEST_TASK";
function requestSingleRequestTask(id) {
  return {
    id
    , type: REQUEST_SINGLE_REQUEST_TASK
  }
}

export const RECEIVE_SINGLE_REQUEST_TASK = "RECEIVE_SINGLE_REQUEST_TASK";
function receiveSingleRequestTask(json) {
  return {
    error: json.message
    , id: json.requestTask ? json.requestTask._id : null
    , item: json.requestTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_REQUEST_TASK
  }
}

export function fetchSingleRequestTaskById(id) {
  return dispatch => {
    dispatch(requestSingleRequestTask(id))
    return apiUtils.callAPI(`/api/request-task/${id}`)
      .then(json => dispatch(receiveSingleRequestTask(json)))
  }
}

export const ADD_SINGLE_REQUEST_TASK_TO_MAP = "ADD_SINGLE_REQUEST_TASK_TO_MAP";
export function addSingleRequestTaskToMap(item) {
  return {
    item
    , type: ADD_SINGLE_REQUEST_TASK_TO_MAP
  }
}

export const SET_SELECTED_REQUEST_TASK = "SET_SELECTED_REQUEST_TASK";
export function setSelectedRequestTask(item) {
  return {
    type: SET_SELECTED_REQUEST_TASK
    , item
  }
}

export const REQUEST_DEFAULT_REQUEST_TASK = "REQUEST_DEFAULT_REQUEST_TASK";
function requestDefaultRequestTask(id) {
  return {
    type: REQUEST_DEFAULT_REQUEST_TASK
  }
}

export const RECEIVE_DEFAULT_REQUEST_TASK = "RECEIVE_DEFAULT_REQUEST_TASK";
function receiveDefaultRequestTask(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_REQUEST_TASK
  }
}

export function fetchDefaultRequestTask() {
  return dispatch => {
    dispatch(requestDefaultRequestTask())
    return apiUtils.callAPI(`/api/request-task/default`)
      .then(json => dispatch(receiveDefaultRequestTask(json)))
  }
}

export const REQUEST_REQUEST_TASK_SCHEMA = "REQUEST_REQUEST_TASK_SCHEMA";
function requestRequestTaskSchema(id) {
  return {
    type: REQUEST_REQUEST_TASK_SCHEMA
  }
}
 export const RECEIVE_REQUEST_TASK_SCHEMA = "RECEIVE_REQUEST_TASK_SCHEMA";
function receiveRequestTaskSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_TASK_SCHEMA
  }
}
 export function fetchRequestTaskSchema() {
  return dispatch => {
    dispatch(requestRequestTaskSchema())
    return apiUtils.callAPI(`/api/request-task/schema`)
      .then(json => dispatch(receiveRequestTaskSchema(json)))
  }
}

export const REQUEST_CREATE_REQUEST_TASK = "REQUEST_CREATE_REQUEST_TASK";
function requestCreateRequestTask(requestTask) {
  return {
    requestTask
    , type: REQUEST_CREATE_REQUEST_TASK
  }
}

export const RECEIVE_CREATE_REQUEST_TASK = "RECEIVE_CREATE_REQUEST_TASK";
function receiveCreateRequestTask(json) {
  return {
    error: json.message
    , id: json.requestTask ? json.requestTask._id : null
    , item: json.requestTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_REQUEST_TASK
    , activity: json.activity
    , requestFolder: json.requestFolder
    , request: json.request
  }
}

export function sendCreateRequestTask(data) {
  return dispatch => {
    dispatch(requestCreateRequestTask(data))
    return apiUtils.callAPI('/api/request-task', 'POST', data)
      .then(json => dispatch(receiveCreateRequestTask(json)))
  }
}

export const REQUEST_UPDATE_REQUEST_TASK = "REQUEST_UPDATE_REQUEST_TASK";
function requestUpdateRequestTask(requestTask) {
  return {
    id: requestTask ? requestTask._id: null
    , requestTask
    , type: REQUEST_UPDATE_REQUEST_TASK
  }
}

export const RECEIVE_UPDATE_REQUEST_TASK = "RECEIVE_UPDATE_REQUEST_TASK";
function receiveUpdateRequestTask(json) {
  return {
    error: json.message
    , id: json.requestTask ? json.requestTask._id : null
    , item: json.requestTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_REQUEST_TASK
    , taskActivity: json.taskActivity
  }
}

export function sendUpdateRequestTask(data) {
  return dispatch => {
    dispatch(requestUpdateRequestTask(data))
    return apiUtils.callAPI(`/api/request-task/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateRequestTask(json)))
  }
}

export function sendUpdateRequestTaskbyClientUser(data) {
  return dispatch => {
    dispatch(requestUpdateRequestTask(data))
    return apiUtils.callAPI(`/api/request-task/client-user/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateRequestTask(json)))
  }
}

export function sendBulkUpdateRequestTask(data) {
  return dispatch => {
    // dispatch(requestBulkUpdateRequestTask(data))
    return apiUtils.callAPI(`/api/request-task/bulk-update/${data._client}`, 'PUT', data)
      .then(json => {
        if (json.success) {
          json.requestTasks.map(requestTask => {
            const newJson = { success: true, requestTask };
            dispatch(receiveUpdateRequestTask(newJson));
          });
        } else {
          const newJson = { success: false, message: json.message }
          dispatch(receiveUpdateRequestTask(newJson));
        }
        return json;
      })
  }
}

export const REQUEST_DELETE_REQUEST_TASK = "REQUEST_DELETE_REQUEST_TASK";
function requestDeleteRequestTask(id) {
  return {
    id
    , type: REQUEST_DELETE_REQUEST_TASK
  }
}

export const RECEIVE_DELETE_REQUEST_TASK = "RECEIVE_DELETE_REQUEST_TASK";
function receiveDeleteRequestTask(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_REQUEST_TASK
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteRequestTask(id))
    return apiUtils.callAPI(`/api/request-task/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteRequestTask(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest requestTaskLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.requestTask.lists, {});
  let list = { ...state.requestTask.lists }
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
   * REQUEST_TASK: Uncomment console logs to help debugging
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
  } else if(new Date().getTime() - list.lastUpdated > (1000 * 60 * 5)) {
    // yes, it's been longer than 5 minutes since the last fetch
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
    return dispatch(returnRequestTaskListPromise(...listArgs));
  }
}

export const returnRequestTaskListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItemIds = findListFromArgs(state, listArgs).items
  const listItems = listItemIds.map(id => state.requestTask.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_REQUEST_TASK_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_REQUEST_TASK_LIST = "REQUEST_REQUEST_TASK_LIST"
function requestRequestTaskList(listArgs) {
  return {
    listArgs
    , type: REQUEST_REQUEST_TASK_LIST
  }
}

export const RECEIVE_REQUEST_TASK_LIST = "RECEIVE_REQUEST_TASK_LIST"
function receiveRequestTaskList(json, listArgs) {
  return {
    error: json.message
    , list: json.requestTasks
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_TASK_LIST
  }
}

export const ADD_REQUEST_TASK_TO_LIST = "ADD_REQUEST_TASK_TO_LIST";
export function addRequestTaskToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_REQUEST_TASK_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_REQUEST_TASK_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_REQUEST_TASK_FROM_LIST = "REMOVE_REQUEST_TASK_FROM_LIST"
export function removeRequestTaskFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_REQUEST_TASK_FROM_LIST
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
    dispatch(requestRequestTaskList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * REQUEST_TASK: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/request-task/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/request-task/by-[ARG1]/[ARG2]".
     *    ex: /api/request-task/by-category/:category
     *  if 2nd arg is an array, though, return "/api/request-task/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/request-task";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of requestTasks given an array of requestTask id's, among other things
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
    console.log("apiTarget", apiTarget)
    return apiUtils.callAPI(apiTarget).then(
      json => dispatch(receiveRequestTaskList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_REQUEST_TASK_FILTER = "SET_REQUEST_TASK_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_REQUEST_TASK_FILTER
  }
}

export const SET_REQUEST_TASK_PAGINATION = "SET_REQUEST_TASK_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_REQUEST_TASK_PAGINATION
  }
}

export const INVALIDATE_REQUEST_TASK_LIST = "INVALIDATE_REQUEST_TASK_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_REQUEST_TASK_LIST
  }
}

export const fetchListPortal = (clientId, ...listArgs) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestRequestTaskList(listArgs))
    return apiUtils.callAPI(`/api/portal-request-task/${clientId}`)
      .then(json => dispatch(receiveRequestTaskList(json, listArgs)));
  } else {
    return dispatch(returnRequestTaskListPromise(...listArgs));
  }
}

// export function fetchSingleByHex(hex) {
//   return dispatch => {
//     dispatch(requestSingleShareLinkByHex(hex))
//     return apiUtils.callAPI(`/api/share-links/get-by-hex/${hex}`)
//       .then(json => dispatch(receiveSingleShareLinkByHex(json)))
//   }
// }

export function fetchSingleByHex(hex) {
  return dispatch => {
    dispatch(requestSingleRequestTaskLinkByHex(hex))
    return apiUtils.callAPI(`/api/request-task/get-by-hex/${hex}`)
      .then(json => dispatch(receiveSingleRequestTaskLinkByHex(json)))
  }
}

export const REQUEST_SINGLE_REQUEST_TASK_LINK_BY_HEX = "REQUEST_SINGLE_REQUEST_TASK_LINK_BY_HEX";
function requestSingleRequestTaskLinkByHex(hex) {
  return {
    hex
    , type: REQUEST_SINGLE_REQUEST_TASK_LINK_BY_HEX
  }
}

export const RECEIVE_SINGLE_REQUEST_TASK_LINK_BY_HEX = "RECEIVE_SINGLE_REQUEST_TASK_LINK_BY_HEX";
function receiveSingleRequestTaskLinkByHex(json) {
  return {
    authenticated: json.authenticated ? json.authenticated : false 
    , error: json.message
    , hex: json.requestTask ? json.requestTask.hex : null
    , item: json.requestTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_REQUEST_TASK_LINK_BY_HEX
  }
}

export function sendUploadFiles(hex, data) {
  return dispatch => {
    dispatch(requestUploadFiles(data))
    return fetch('/api/request-task/upload-files/' + hex, {
      method: 'POST'
      , headers: {}
      , credentials: 'same-origin'
      , body: data // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => response.json())
    .then(json => dispatch(receiveUploadFiles(json)))
  }
}

export const REQUEST_CREATE_FILES_FROM_REQUEST_TASK_LINK = "REQUEST_CREATE_FILES_FROM_REQUEST_TASK_LINK";
function requestUploadFiles(files) {
  return {
    type: REQUEST_CREATE_FILES_FROM_REQUEST_TASK_LINK
    , files
  }
}

export const RECEIVE_CREATE_FILES_FROM_REQUEST_TASK_LINK = "RECEIVE_CREATE_FILES_FROM_REQUEST_TASK_LINK";
function receiveUploadFiles(json) {
  return {
    type: RECEIVE_CREATE_FILES_FROM_REQUEST_TASK_LINK
    , files: json.files
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const SET_REQUESTTASK_LIST2_FILTER = "SET_REQUESTTASK_LIST2_FILTER";
export function setRequestTaskList2Filter(filterNames, filter, filterData) {
  return {
    type: SET_REQUESTTASK_LIST2_FILTER
    , filterNames
    , filter
    , filterData
  }
}

export const SET_REQUESTTASK_LIST2_DISPLAY_COLUMNS = "SET_REQUESTTASK_LIST2_DISPLAY_COLUMNS"
export function setRequestTaskList2Displayolumns(displayColumns) {
  return {
    displayColumns
    , type: SET_REQUESTTASK_LIST2_DISPLAY_COLUMNS
  }
}
