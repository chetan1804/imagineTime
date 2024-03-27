/**
 * All shareLink CRUD actions
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
  const { byId, selected } = state.shareLink;
  if(selected.id !== id) {
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

export const INVALIDATE_SELECTED_SHARE_LINK = "INVALIDATE_SELECTED_SHARE_LINK"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_SHARE_LINK
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleShareLinkById(id))
  } else {
    return dispatch(returnSingleShareLinkPromise(id)); // return promise that contains shareLink
  }
}


export const returnSingleShareLinkPromise = (id) => (dispatch, getState) => {
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
      , item: getState().shareLink.byId[id]
      , success: true
      , type: "RETURN_SINGLE_SHARE_LINK_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_SHARE_LINK = "REQUEST_SINGLE_SHARE_LINK";
function requestSingleShareLink(id) {
  return {
    id
    , type: REQUEST_SINGLE_SHARE_LINK
  }
}

export const RECEIVE_SINGLE_SHARE_LINK = "RECEIVE_SINGLE_SHARE_LINK";
function receiveSingleShareLink(json) {
  return {
    error: json.message
    , id: json.shareLink ? json.shareLink._id : null
    , item: json.shareLink
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_SHARE_LINK
  }
}

export function fetchSingleShareLinkById(id) {
  return dispatch => {
    dispatch(requestSingleShareLink(id))
    return apiUtils.callAPI(`/api/share-links/${id}`)
      .then(json => dispatch(receiveSingleShareLink(json)))
  }
}


export const ADD_SINGLE_SHARE_LINK_TO_MAP = "ADD_SINGLE_SHARE_LINK_TO_MAP";
export function addSingleShareLinkToMap(item) {
  return {
    item
    , type: ADD_SINGLE_SHARE_LINK_TO_MAP
  }
}

export const SET_SELECTED_SHARE_LINK = "SET_SELECTED_SHARE_LINK";
export function setSelectedShareLink(item) {
  return {
    type: SET_SELECTED_SHARE_LINK
    , item
  }
}

export const REQUEST_DEFAULT_SHARE_LINK = "REQUEST_DEFAULT_SHARE_LINK";
function requestDefaultShareLink(id) {
  return {
    type: REQUEST_DEFAULT_SHARE_LINK
  }
}

export const RECEIVE_DEFAULT_SHARE_LINK = "RECEIVE_DEFAULT_SHARE_LINK";
function receiveDefaultShareLink(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_SHARE_LINK
  }
}

export function fetchDefaultShareLink() {
  return dispatch => {
    dispatch(requestDefaultShareLink())
    return apiUtils.callAPI(`/api/share-links/default`)
      .then(json => dispatch(receiveDefaultShareLink(json)))
  }
}

export const SET_SHARE_LINK_NULL = "SET_SHARE_LINK_NULL"
function setShareLinkNull() {
  return {
    type: SET_SHARE_LINK_NULL
  }
}

export function resetShareLink() {
  return dispatch => {
    dispatch(setShareLinkNull())
  }
}

export const REQUEST_SHARE_LINK_SCHEMA = "REQUEST_SHARE_LINK_SCHEMA";
function requestShareLinkSchema(id) {
  return {
    type: REQUEST_SHARE_LINK_SCHEMA
  }
}
 export const RECEIVE_SHARE_LINK_SCHEMA = "RECEIVE_SHARE_LINK_SCHEMA";
function receiveShareLinkSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SHARE_LINK_SCHEMA
  }
}
 export function fetchShareLinkSchema() {
  return dispatch => {
    dispatch(requestShareLinkSchema())
    return apiUtils.callAPI(`/api/share-links/schema`)
      .then(json => dispatch(receiveShareLinkSchema(json)))
  }
}

export const REQUEST_CREATE_SHARE_LINK = "REQUEST_CREATE_SHARE_LINK";
function requestCreateShareLink(shareLink) {
  return {
    shareLink
    , type: REQUEST_CREATE_SHARE_LINK
  }
}

export const RECEIVE_CREATE_SHARE_LINK = "RECEIVE_CREATE_SHARE_LINK";
function receiveCreateShareLink(json) {
  return {
    error: json.message
    , id: json.shareLink ? json.shareLink._id : null
    , item: json.shareLink
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_SHARE_LINK
  }
}

export function sendCreateShareLink(data) {
  return dispatch => {
    dispatch(requestCreateShareLink(data))
    return apiUtils.callAPI('/api/share-links', 'POST', data)
      .then(json => dispatch(receiveCreateShareLink(json)))
  }
}

export const REQUEST_UPDATE_SHARE_LINK = "REQUEST_UPDATE_SHARE_LINK";
function requestUpdateShareLink(shareLink) {
  return {
    id: shareLink ? shareLink._id: null
    , shareLink
    , type: REQUEST_UPDATE_SHARE_LINK
  }
}

export const RECEIVE_UPDATE_SHARE_LINK = "RECEIVE_UPDATE_SHARE_LINK";
function receiveUpdateShareLink(json) {
  return {
    error: json.message
    , id: json.shareLink ? json.shareLink._id : null
    , item: json.shareLink
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_SHARE_LINK
  }
}

export function sendUpdateShareLink(data) {
  return dispatch => {
    dispatch(requestUpdateShareLink(data))
    return apiUtils.callAPI(`/api/share-links/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateShareLink(json)))
  }
}

export function sendUpdateShareFilesLink(data) {
  return dispatch => {
    dispatch(requestUpdateShareLink(data))
    return apiUtils.callAPI(`/api/share-links/files/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateShareLink(json)))
  }
}

// allows restricted updates with permissions checks on the server.
export function sendUpdateShareLinkWithPermission(data) {
  return dispatch => {
    dispatch(requestUpdateShareLink(data))
    return apiUtils.callAPI(`/api/share-links/with-permission/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateShareLink(json)))
  }
}

export const REQUEST_DELETE_SHARE_LINK = "REQUEST_DELETE_SHARE_LINK";
function requestDeleteShareLink(id) {
  return {
    id
    , type: REQUEST_DELETE_SHARE_LINK
  }
}

export const RECEIVE_DELETE_SHARE_LINK = "RECEIVE_DELETE_SHARE_LINK";
function receiveDeleteShareLink(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_SHARE_LINK
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteShareLink(id))
    return apiUtils.callAPI(`/api/share-links/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteShareLink(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest shareLinkLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.shareLink.lists, {});
  let list = { ...state.shareLink.lists }
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
    return dispatch(returnShareLinkListPromise(...listArgs));
  }
}

export const returnShareLinkListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.shareLink.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_SHARE_LINK_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SHARE_LINK_LIST = "REQUEST_SHARE_LINK_LIST"
function requestShareLinkList(listArgs) {
  return {
    listArgs
    , type: REQUEST_SHARE_LINK_LIST
  }
}

export const RECEIVE_SHARE_LINK_LIST = "RECEIVE_SHARE_LINK_LIST"
function receiveShareLinkList(json, listArgs) {
  return {
    error: json.message
    , list: json.shareLinks
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SHARE_LINK_LIST
  }
}

export const ADD_SHARE_LINK_TO_LIST = "ADD_SHARE_LINK_TO_LIST";
export function addShareLinkToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string') {
    return {
      type: ADD_SHARE_LINK_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_SHARE_LINK_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_SHARE_LINK_FROM_LIST = "REMOVE_SHARE_LINK_FROM_LIST"
export function removeShareLinkFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_SHARE_LINK_FROM_LIST
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
    dispatch(requestShareLinkList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/share-links/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/share-links/by-[ARG1]/[ARG2]".
     *    ex: /api/share-links/by-category/:category
     *  if 2nd arg is an array, though, return "/api/share-links/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/share-links";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of shareLinks given an array of shareLink id's, among other things
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
      json => dispatch(receiveShareLinkList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_SHARE_LINK_FILTER = "SET_SHARE_LINK_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_SHARE_LINK_FILTER
  }
}

export const SET_SHARE_LINK_PAGINATION = "SET_SHARE_LINK_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_SHARE_LINK_PAGINATION
  }
}

export const INVALIDATE_SHARE_LINK_LIST = "INVALIDATE_SHARE_LINK_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_SHARE_LINK_LIST
  }
}

/**
 * Share link anonymous auth below 
 */

/**
 * Fetch by hex 
 */


export const REQUEST_SINGLE_SHARE_LINK_BY_HEX = "REQUEST_SINGLE_SHARE_LINK_BY_HEX";
function requestSingleShareLinkByHex(hex) {
  return {
    hex
    , type: REQUEST_SINGLE_SHARE_LINK_BY_HEX
  }
}

export const RECEIVE_SINGLE_SHARE_LINK_BY_HEX = "RECEIVE_SINGLE_SHARE_LINK_BY_HEX";
function receiveSingleShareLinkByHex(json) {
  return {
    authenticated: json.authenticated ? json.authenticated : false 
    , error: json.message
    , hex: json.shareLink ? json.shareLink.hex : null
    , item: json.shareLink
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_SHARE_LINK_BY_HEX
  }
}

export function fetchSingleByHex(hex) {
  return dispatch => {
    dispatch(requestSingleShareLinkByHex(hex))
    return apiUtils.callAPI(`/api/share-links/get-by-hex/${hex}`)
      .then(json => dispatch(receiveSingleShareLinkByHex(json)))
  }
}

export function fetchSingleByHexV2(hex) {
  return dispatch => {
    dispatch(requestSingleShareLinkByHex(hex))
    return apiUtils.callAPI(`/api/share-links/get-by-hex-v2/${hex}`)
      .then(json => dispatch(receiveSingleShareLinkByHex(json)))
  }
}

export const REQUEST_AUTHENTICATE_SHARE_LINK = "REQUEST_AUTHENTICATE_SHARE_LINK";
function requestAuthenticateShareLink(hex, data) {
  return {
    hex 
    , type: REQUEST_AUTHENTICATE_SHARE_LINK
  }
}

export const RECEIVE_AUTHENTICATE_SHARE_LINK = "RECEIVE_AUTHENTICATE_SHARE_LINK";
function receiveAuthenticateShareLink(json) {
  return {
    error: json.message
    , hex: json.shareLink ? json.shareLink.hex : null
    , item: json.shareLink
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_AUTHENTICATE_SHARE_LINK
  }
}

export function sendAuthenticateLink(hex, data) {
  return dispatch => {
    dispatch(requestAuthenticateShareLink(hex))
    return apiUtils.callAPI(`/api/share-links/auth-by-password/${hex}`, 'POST', data)
      .then(json => dispatch(receiveAuthenticateShareLink(json)))
  }
}

export const REQUEST_CREATE_FILES_FROM_SHARE_LINK = "REQUEST_CREATE_FILES_FROM_SHARE_LINK";
function requestUploadFiles(files) {
  return {
    type: REQUEST_CREATE_FILES_FROM_SHARE_LINK
    , files
  }
}

export const RECEIVE_CREATE_FILES_FROM_SHARE_LINK = "RECEIVE_CREATE_FILES_FROM_SHARE_LINK";
function receiveUploadFiles(json) {
  return {
    type: RECEIVE_CREATE_FILES_FROM_SHARE_LINK
    , files: json.files
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUploadFiles(hex, data) {
  return dispatch => {
    dispatch(requestUploadFiles(data))
    return fetch('/api/share-links/upload-files/' + hex, {
      method: 'POST'
      , headers: {}
      , credentials: 'same-origin'
      , body: data // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => response.json())
    .then(json => dispatch(receiveUploadFiles(json)))
  }
}

/**
 * ShareLinkList screen related actions that are dispatched for reducers to store
 * information in application-level (redux) store.
 *
 * For ShareLinkList screen, the only things we want to persist in the application
 * store are last filter and its pagination information i.e. rows per page and
 * current pag number.
 */

export const SET_SHARELINK_FILTER = "SET_SHARELINK_FILTER"
export function setShareLinkFilter(filterNames, filter, filterData) {
  return {
    filterNames
    , filterData
    , filter
    , type: SET_SHARELINK_FILTER
  }
}

export const SET_SHARELINK_DISPLAY_COLUMNS = "SET_SHARELINK_DISPLAY_COLUMNS"
export function setShareLinkDisplayolumns(displayColumns) {
  return {
    displayColumns
    , type: SET_SHARELINK_DISPLAY_COLUMNS
  }
}
