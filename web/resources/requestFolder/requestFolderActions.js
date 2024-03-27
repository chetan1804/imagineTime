/**
 * All request CRUD actions
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

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.requestFolder;
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

export const INVALIDATE_SELECTED_REQUEST_FOLDER = "INVALIDATE_SELECTED_REQUEST_FOLDER"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_REQUEST_FOLDER
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleRequestById(id))
  } else {
    return dispatch(returnSingleRequestPromise(id)); // return promise that contains request
  }
}


export const returnSingleRequestPromise = (id) => (dispatch, getState) => {
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
      , item: getState().requestFolder.byId[id]
      , success: true
      , type: "RETURN_SINGLE_REQUEST_FOLDER_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_REQUEST_FOLDER = "REQUEST_SINGLE_REQUEST_FOLDER";
function requestSingleRequestFolder(id) {
  return {
    id
    , type: REQUEST_SINGLE_REQUEST_FOLDER
  }
}

export const RECEIVE_SINGLE_REQUEST_FOLDER = "RECEIVE_SINGLE_REQUEST_FOLDER";
function receiveSingleRequestFolder(json) {
  return {
    error: json.message
    , id: json.requestFolder ? json.requestFolder._id : null
    , item: json.requestFolder
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_REQUEST_FOLDER
  }
}

export function fetchSingleRequestById(id) {
  return dispatch => {
    dispatch(requestSingleRequestFolder(id))
    return apiUtils.callAPI(`/api/request-folder/${id}`)
      .then(json => dispatch(receiveSingleRequestFolder(json)))
  }
}

export const ADD_SINGLE_REQUEST_FOLDER_TO_MAP = "ADD_SINGLE_REQUEST_FOLDER_TO_MAP";
export function addSingleRequestFolderToMap(item) {
  return {
    item
    , type: ADD_SINGLE_REQUEST_FOLDER_TO_MAP
  }
}

export const SET_SELECTED_REQUEST_FOLDER = "SET_SELECTED_REQUEST_FOLDER";
export function setSelectedRequest(item) {
  return {
    type: SET_SELECTED_REQUEST_FOLDER
    , item
  }
}

export const REQUEST_DEFAULT_REQUEST_FOLDER = "REQUEST_DEFAULT_REQUEST_FOLDER";
function requestDefaultRequest(id) {
  return {
    type: REQUEST_DEFAULT_REQUEST_FOLDER
  }
}

export const RECEIVE_DEFAULT_REQUEST_FOLDER = "RECEIVE_DEFAULT_REQUEST_FOLDER";
function receiveDefaultRequest(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_REQUEST_FOLDER
  }
}

export function fetchDefaultRequest() {
  return dispatch => {
    dispatch(requestFolderDefaultRequest())
    return apiUtils.callAPI(`/api/request-folder/default`)
      .then(json => dispatch(receiveDefaultRequest(json)))
  }
}

export const REQUEST_REQUEST_FOLDER_SCHEMA = "REQUEST_REQUEST_FOLDER_SCHEMA";
function requestRequestSchema(id) {
  return {
    type: REQUEST_REQUEST_FOLDER_SCHEMA
  }
}
 export const RECEIVE_REQUEST_FOLDER_SCHEMA = "RECEIVE_REQUEST_FOLDER_SCHEMA";
function receiveRequestSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_FOLDER_SCHEMA
  }
}
 export function fetchRequestSchema() {
  return dispatch => {
    dispatch(requestFolderRequestSchema())
    return apiUtils.callAPI(`/api/request-folder/schema`)
      .then(json => dispatch(receiveRequestSchema(json)))
  }
}

export const REQUEST_CREATE_REQUEST_FOLDER = "REQUEST_CREATE_REQUEST_FOLDER";
function requestCreateRequestFolder(requestFolder) {
  return {
    requestFolder
    , type: REQUEST_CREATE_REQUEST_FOLDER
  }
}

export const RECEIVE_CREATE_REQUEST_FOLDER = "RECEIVE_CREATE_REQUEST_FOLDER";
function receiveCreateRequestFolder(json) {
  console.log("RECEIVE_CREATE_REQUEST_FOLDER", json)
  return {
    error: json.message
    , id: json.requestFolder ? json.requestFolder._id : null
    , item: json.requestFolder
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_REQUEST_FOLDER
    , activity: json.activity
  }
}

export function sendCreateRequestFolder(data) {
  return dispatch => {
    dispatch(requestCreateRequestFolder(data))
    return apiUtils.callAPI('/api/request-folder', 'POST', data)
      .then(json => dispatch(receiveCreateRequestFolder(json)))
  }
}

export const REQUEST_UPDATE_REQUEST_FOLDER = "REQUEST_UPDATE_REQUEST_FOLDER";
function requestUpdateRequestFolder(requestFolder) {
  return {
    id: requestFolder ? requestFolder._id: null
    , requestFolder
    , type: REQUEST_UPDATE_REQUEST_FOLDER
  }
}

export const RECEIVE_UPDATE_REQUEST_FOLDER = "RECEIVE_UPDATE_REQUEST_FOLDER";
function receiveUpdateRequestFolder(json) {
  return {
    error: json.message
    , id: json.requestFolder ? json.requestFolder._id : null
    , item: json.requestFolder
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_REQUEST_FOLDER
  }
}

export function sendUpdateRequestFolder(data) {
  return dispatch => {
    dispatch(requestUpdateRequestFolder(data))
    return apiUtils.callAPI(`/api/request-folder/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateRequestFolder(json)))
  }
}

export function singleUpdateToMap(data) {
  return dispatch => {
    return dispatch(receiveUpdateRequestFolder({ requestFolder: data, success: true }))
  }
}

export const REQUEST_DELETE_REQUEST_FOLDER = "REQUEST_DELETE_REQUEST_FOLDER";
function requestDeleteRequest(id) {
  return {
    id
    , type: REQUEST_DELETE_REQUEST_FOLDER
  }
}

export const RECEIVE_DELETE_REQUEST_FOLDER = "RECEIVE_DELETE_REQUEST_FOLDER";
function receiveDeleteRequest(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_REQUEST_FOLDER
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestFolderDeleteRequest(id))
    return apiUtils.callAPI(`/api/request-folder/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteRequest(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest requestLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.requestFolder.lists, {});
  console.log("state", state)
  let list = { ...state.requestFolder.lists }
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
  console.log("shouldFetchList with these args ", state, "?");
  console.log("shouldFetchList with these args ", listArgs, "?");
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
    return dispatch(returnRequestListPromise(...listArgs));
  }
}

export const returnRequestListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.requestFolder.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_REQUEST_FOLDER_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_REQUEST_FOLDER_LIST = "REQUEST_REQUEST_FOLDER_LIST"
function requestFolderRequestList(listArgs) {
  return {
    listArgs
    , type: REQUEST_REQUEST_FOLDER_LIST
  }
}

export const RECEIVE_REQUEST_FOLDER_LIST = "RECEIVE_REQUEST_FOLDER_LIST"
function receiveRequestList(json, listArgs) {
  return {
    error: json.message
    , list: json.data
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_FOLDER_LIST
  }
}

export const ADD_REQUEST_FOLDER_TO_LIST = "ADD_REQUEST_FOLDER_TO_LIST";
export function addRequestFolderToList(item, ...listArgs) {
  console.log("addRequestToList item", item, listArgs)
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_REQUEST_FOLDER_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_REQUEST_FOLDER_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_REQUEST_FOLDER_FROM_LIST = "REMOVE_REQUEST_FOLDER_FROM_LIST"
export function removeRequestFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_REQUEST_FOLDER_FROM_LIST
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
    dispatch(requestFolderRequestList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/request-folder/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/request-folder/by-[ARG1]/[ARG2]".
     *    ex: /api/request-folder/by-category/:category
     *  if 2nd arg is an array, though, return "/api/request-folder/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/request-folder";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of requests given an array of request id's, among other things
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
      json => dispatch(receiveRequestList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_REQUEST_FOLDER_FILTER = "SET_REQUEST_FOLDER_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_REQUEST_FOLDER_FILTER
  }
}

export const SET_REQUEST_FOLDER_PAGINATION = "SET_REQUEST_FOLDER_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  console.log("...setPagination", pagination, ...listArgs)
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_REQUEST_FOLDER_PAGINATION
  }
}

export const INVALIDATE_REQUEST_FOLDER_LIST = "INVALIDATE_REQUEST_FOLDER_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_REQUEST_FOLDER_LIST
  }
}

export const fetchListPortal = (clientId, ...listArgs) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestFolderRequestList(listArgs))
    return apiUtils.callAPI(`/api/request-folder/portal-request/${clientId}`)
      .then(json => dispatch(receiveRequestList(json, listArgs)));
  } else {
    return dispatch(returnRequestListPromise(...listArgs));
  }
}