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
   * user object from the server, or if a valid one already exists in the sstore
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.request;
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

export const INVALIDATE_SELECTED_REQUEST = "INVALIDATE_SELECTED_REQUEST"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_REQUEST
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
      , item: getState().request.byId[id]
      , success: true
      , type: "RETURN_SINGLE_REQUEST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_REQUEST = "REQUEST_SINGLE_REQUEST";
function requestSingleRequest(id) {
  return {
    id
    , type: REQUEST_SINGLE_REQUEST
  }
}

export const RECEIVE_SINGLE_REQUEST = "RECEIVE_SINGLE_REQUEST";
function receiveSingleRequest(json) {
  return {
    error: json.message
    , id: json.request ? json.request._id : null
    , item: json.request
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_REQUEST
  }
}

export function fetchSingleRequestById(id) {
  return dispatch => {
    dispatch(requestSingleRequest(id))
    return apiUtils.callAPI(`/api/request/${id}`)
      .then(json => dispatch(receiveSingleRequest(json)))
  }
}

export const ADD_SINGLE_REQUEST_TO_MAP = "ADD_SINGLE_REQUEST_TO_MAP";
export function addSingleRequestToMap(item) {
  return {
    item
    , type: ADD_SINGLE_REQUEST_TO_MAP
  }
}

export const SET_SELECTED_REQUEST = "SET_SELECTED_REQUEST";
export function setSelectedRequest(item) {
  return {
    type: SET_SELECTED_REQUEST
    , item
  }
}

export const REQUEST_DEFAULT_REQUEST = "REQUEST_DEFAULT_REQUEST";
function requestDefaultRequest(id) {
  return {
    type: REQUEST_DEFAULT_REQUEST
  }
}

export const RECEIVE_DEFAULT_REQUEST = "RECEIVE_DEFAULT_REQUEST";
function receiveDefaultRequest(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_REQUEST
  }
}

export function fetchDefaultRequest() {
  return dispatch => {
    dispatch(requestDefaultRequest())
    return apiUtils.callAPI(`/api/request/default`)
      .then(json => dispatch(receiveDefaultRequest(json)))
  }
}

export const REQUEST_REQUEST_SCHEMA = "REQUEST_REQUEST_SCHEMA";
function requestRequestSchema(id) {
  return {
    type: REQUEST_REQUEST_SCHEMA
  }
}
 export const RECEIVE_REQUEST_SCHEMA = "RECEIVE_REQUEST_SCHEMA";
function receiveRequestSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_SCHEMA
  }
}
 export function fetchRequestSchema() {
  return dispatch => {
    dispatch(requestRequestSchema())
    return apiUtils.callAPI(`/api/request/schema`)
      .then(json => dispatch(receiveRequestSchema(json)))
  }
}

export const REQUEST_CREATE_REQUEST = "REQUEST_CREATE_REQUEST";
function requestCreateRequest(request) {
  return {
    request
    , type: REQUEST_CREATE_REQUEST
  }
}

export const RECEIVE_CREATE_REQUEST = "RECEIVE_CREATE_REQUEST";
function receiveCreateRequest(json) {
  return {
    error: json.message
    , id: json.request ? json.request._id : null
    , item: json.request
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_REQUEST
    , activity: json.activity
  }
}

export function sendCreateRequest(data) {
  return dispatch => {
    dispatch(requestCreateRequest(data))
    return apiUtils.callAPI('/api/request', 'POST', data)
      .then(json => dispatch(receiveCreateRequest(json)))
  }
}

export const REQUEST_BULK_CREATE_REQUEST = "REQUEST_BULK_CREATE_REQUEST";
function requestBulkCreateRequest(data) {
  return {
    data
    , type: REQUEST_BULK_CREATE_REQUEST
  }
}

export const RECEIVE_BULK_CREATE_REQUEST = "RECEIVE_BULK_CREATE_REQUEST";
function receiveBulkCreateRequest(json) {
  return {
    error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_CREATE_REQUEST
  }
}

export function sendBulkCreateRequest(data) {
  return dispatch => {
    dispatch(requestBulkCreateRequest(data))
    return apiUtils.callAPI('/api/request/bulk-apply', 'POST', data)
      .then(json => dispatch(receiveBulkCreateRequest(json)))
  }
}

export const REQUEST_UPDATE_REQUEST = "REQUEST_UPDATE_REQUEST";
function requestUpdateRequest(request) {
  return {
    id: request ? request._id: null
    , request
    , type: REQUEST_UPDATE_REQUEST
  }
}

export const RECEIVE_UPDATE_REQUEST = "RECEIVE_UPDATE_REQUEST";
function receiveUpdateRequest(json) {
  return {
    error: json.message
    , id: json.request ? json.request._id : null
    , item: json.request
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_REQUEST
  }
}

export function sendUpdateRequest(data) {
  return dispatch => {
    dispatch(requestUpdateRequest(data))
    return apiUtils.callAPI(`/api/request/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateRequest(json)))
  }
}

export function singleUpdateToMap(data) {
  return dispatch => {
    return dispatch(receiveUpdateRequest({ request: data, success: true }))
  }
}

export const REQUEST_DELETE_REQUEST = "REQUEST_DELETE_REQUEST";
function requestDeleteRequest(id) {
  return {
    id
    , type: REQUEST_DELETE_REQUEST
  }
}

export const RECEIVE_DELETE_REQUEST = "RECEIVE_DELETE_REQUEST";
function receiveDeleteRequest(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_REQUEST
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteRequest(id))
    return apiUtils.callAPI(`/api/request/${id}`, 'DELETE')
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
  // let list = Object.assign({}, state.request.lists, {});
  console.log("state", state)
  let list = { ...state.request.lists }
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
  const listItems = listItemIds.map(id => state.request.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_REQUEST_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_REQUEST_LIST = "REQUEST_REQUEST_LIST"
function requestRequestList(listArgs) {
  return {
    listArgs
    , type: REQUEST_REQUEST_LIST
  }
}

export const RECEIVE_REQUEST_LIST = "RECEIVE_REQUEST_LIST"
function receiveRequestList(json, listArgs) {
  console.log("debug2", json, listArgs)
  return {
    error: json.message
    , list: json.request
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_LIST
  }
}

export const ADD_REQUEST_TO_LIST = "ADD_REQUEST_TO_LIST";
export function addRequestToList(item, ...listArgs) {
  console.log("addRequestToList item", item)
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_REQUEST_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_REQUEST_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_REQUEST_FROM_LIST = "REMOVE_REQUEST_FROM_LIST"
export function removeRequestFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_REQUEST_FROM_LIST
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
    dispatch(requestRequestList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/request/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/request/by-[ARG1]/[ARG2]".
     *    ex: /api/request/by-category/:category
     *  if 2nd arg is an array, though, return "/api/request/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/request";
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
    return apiUtils.callAPI(apiTarget).then(
      json => dispatch(receiveRequestList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_REQUEST_FILTER = "SET_REQUEST_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_REQUEST_FILTER
  }
}

export const SET_REQUEST_PAGINATION = "SET_REQUEST_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  console.log("...setPagination", pagination, ...listArgs)
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_REQUEST_PAGINATION
  }
}

export const INVALIDATE_REQUEST_LIST = "INVALIDATE_REQUEST_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_REQUEST_LIST
  }
}

export const fetchListPortal = (clientId, ...listArgs) => (dispatch, getState) => {
  if(shouldFetchList(getState(), listArgs)) {
    dispatch(requestRequestList(listArgs))
    return apiUtils.callAPI(`/api/portal-request/${clientId}`)
      .then(json => dispatch(receiveRequestList(json, listArgs)));
  } else {
    return dispatch(returnRequestListPromise(...listArgs));
  }
}