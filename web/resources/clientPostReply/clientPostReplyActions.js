/**
 * All clientPostReply CRUD actions
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
  const { byId, selected } = state.clientPostReply;
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

export const INVALIDATE_SELECTED_CLIENT_POST_REPLY = "INVALIDATE_SELECTED_CLIENT_POST_REPLY"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_CLIENT_POST_REPLY
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleClientPostReplyById(id))
  } else {
    return dispatch(returnSingleClientPostReplyPromise(id)); // return promise that contains clientPostReply
  }
}


export const returnSingleClientPostReplyPromise = (id) => (dispatch, getState) => {
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
      , item: getState().clientPostReply.byId[id]
      , success: true
      , type: "RETURN_SINGLE_CLIENT_POST_REPLY_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_CLIENT_POST_REPLY = "REQUEST_SINGLE_CLIENT_POST_REPLY";
function requestSingleClientPostReply(id) {
  return {
    id
    , type: REQUEST_SINGLE_CLIENT_POST_REPLY
  }
}

export const RECEIVE_SINGLE_CLIENT_POST_REPLY = "RECEIVE_SINGLE_CLIENT_POST_REPLY";
function receiveSingleClientPostReply(json) {
  return {
    error: json.message
    , id: json.clientPostReply ? json.clientPostReply._id : null
    , item: json.clientPostReply
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_CLIENT_POST_REPLY
  }
}

export function fetchSingleClientPostReplyById(id) {
  return dispatch => {
    dispatch(requestSingleClientPostReply(id))
    return apiUtils.callAPI(`/api/client-post-replies/${id}`)
      .then(json => dispatch(receiveSingleClientPostReply(json)))
  }
}

export const ADD_SINGLE_CLIENT_POST_REPLY_TO_MAP = "ADD_SINGLE_CLIENT_POST_REPLY_TO_MAP";
export function addSingleClientPostReplyToMap(item) {
  return {
    item
    , type: ADD_SINGLE_CLIENT_POST_REPLY_TO_MAP
  }
}

export const SET_SELECTED_CLIENT_POST_REPLY = "SET_SELECTED_CLIENT_POST_REPLY";
export function setSelectedClientPostReply(item) {
  return {
    type: SET_SELECTED_CLIENT_POST_REPLY
    , item
  }
}

export const REQUEST_DEFAULT_CLIENT_POST_REPLY = "REQUEST_DEFAULT_CLIENT_POST_REPLY";
function requestDefaultClientPostReply(id) {
  return {
    type: REQUEST_DEFAULT_CLIENT_POST_REPLY
  }
}

export const RECEIVE_DEFAULT_CLIENT_POST_REPLY = "RECEIVE_DEFAULT_CLIENT_POST_REPLY";
function receiveDefaultClientPostReply(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_CLIENT_POST_REPLY
  }
}

export function fetchDefaultClientPostReply() {
  return dispatch => {
    dispatch(requestDefaultClientPostReply())
    return apiUtils.callAPI(`/api/client-post-replies/default`)
      .then(json => dispatch(receiveDefaultClientPostReply(json)))
  }
}

export const REQUEST_CLIENT_POST_REPLY_SCHEMA = "REQUEST_CLIENT_POST_REPLY_SCHEMA";
function requestClientPostReplySchema(id) {
  return {
    type: REQUEST_CLIENT_POST_REPLY_SCHEMA
  }
}
 export const RECEIVE_CLIENT_POST_REPLY_SCHEMA = "RECEIVE_CLIENT_POST_REPLY_SCHEMA";
function receiveClientPostReplySchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_POST_REPLY_SCHEMA
  }
}
 export function fetchClientPostReplySchema() {
  return dispatch => {
    dispatch(requestClientPostReplySchema())
    return apiUtils.callAPI(`/api/client-post-replies/schema`)
      .then(json => dispatch(receiveClientPostReplySchema(json)))
  }
}

export const REQUEST_CREATE_CLIENT_POST_REPLY = "REQUEST_CREATE_CLIENT_POST_REPLY";
function requestCreateClientPostReply(clientPostReply) {
  return {
    clientPostReply
    , type: REQUEST_CREATE_CLIENT_POST_REPLY
  }
}

export const RECEIVE_CREATE_CLIENT_POST_REPLY = "RECEIVE_CREATE_CLIENT_POST_REPLY";
function receiveCreateClientPostReply(json) {
  return {
    error: json.message
    , id: json.clientPostReply ? json.clientPostReply._id : null
    , item: json.clientPostReply
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_CLIENT_POST_REPLY
  }
}

export function sendCreateClientPostReply(data) {
  return dispatch => {
    dispatch(requestCreateClientPostReply(data))
    return apiUtils.callAPI('/api/client-post-replies', 'POST', data)
      .then(json => dispatch(receiveCreateClientPostReply(json)))
  }
}

export const REQUEST_UPDATE_CLIENT_POST_REPLY = "REQUEST_UPDATE_CLIENT_POST_REPLY";
function requestUpdateClientPostReply(clientPostReply) {
  return {
    id: clientPostReply ? clientPostReply._id: null
    , clientPostReply
    , type: REQUEST_UPDATE_CLIENT_POST_REPLY
  }
}

export const RECEIVE_UPDATE_CLIENT_POST_REPLY = "RECEIVE_UPDATE_CLIENT_POST_REPLY";
function receiveUpdateClientPostReply(json) {
  return {
    error: json.message
    , id: json.clientPostReply ? json.clientPostReply._id : null
    , item: json.clientPostReply
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_CLIENT_POST_REPLY
  }
}

export function sendUpdateClientPostReply(data) {
  return dispatch => {
    dispatch(requestUpdateClientPostReply(data))
    return apiUtils.callAPI(`/api/client-post-replies/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateClientPostReply(json)))
  }
}

export const REQUEST_DELETE_CLIENT_POST_REPLY = "REQUEST_DELETE_CLIENT_POST_REPLY";
function requestDeleteClientPostReply(id) {
  return {
    id
    , type: REQUEST_DELETE_CLIENT_POST_REPLY
  }
}

export const RECEIVE_DELETE_CLIENT_POST_REPLY = "RECEIVE_DELETE_CLIENT_POST_REPLY";
function receiveDeleteClientPostReply(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_CLIENT_POST_REPLY
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteClientPostReply(id))
    return apiUtils.callAPI(`/api/client-post-replies/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteClientPostReply(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest clientPostReplyLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.clientPostReply.lists, {});
  let list = { ...state.clientPostReply.lists }
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
    return dispatch(returnClientPostReplyListPromise(...listArgs));
  }
}

export const returnClientPostReplyListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.clientPostReply.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_CLIENT_POST_REPLY_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_CLIENT_POST_REPLY_LIST = "REQUEST_CLIENT_POST_REPLY_LIST"
function requestClientPostReplyList(listArgs) {
  return {
    listArgs
    , type: REQUEST_CLIENT_POST_REPLY_LIST
  }
}

export const RECEIVE_CLIENT_POST_REPLY_LIST = "RECEIVE_CLIENT_POST_REPLY_LIST"
function receiveClientPostReplyList(json, listArgs) {
  return {
    error: json.message
    , list: json.clientPostReplies
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_POST_REPLY_LIST
  }
}

export const ADD_CLIENT_POST_REPLY_TO_LIST = "ADD_CLIENT_POST_REPLY_TO_LIST";
export function addClientPostReplyToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string') {
    return {
      type: ADD_CLIENT_POST_REPLY_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_CLIENT_POST_REPLY_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_CLIENT_POST_REPLY_FROM_LIST = "REMOVE_CLIENT_POST_REPLY_FROM_LIST"
export function removeClientPostReplyFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_CLIENT_POST_REPLY_FROM_LIST
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
    dispatch(requestClientPostReplyList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/client-post-replies/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/client-post-replies/by-[ARG1]/[ARG2]".
     *    ex: /api/client-post-replies/by-category/:category
     *  if 2nd arg is an array, though, return "/api/client-post-replies/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/client-post-replies";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of clientPostReplies given an array of clientPostReply id's, among other things
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
      json => dispatch(receiveClientPostReplyList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_CLIENT_POST_REPLY_FILTER = "SET_CLIENT_POST_REPLY_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_CLIENT_POST_REPLY_FILTER
  }
}

export const SET_CLIENT_POST_REPLY_PAGINATION = "SET_CLIENT_POST_REPLY_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_CLIENT_POST_REPLY_PAGINATION
  }
}

export const INVALIDATE_CLIENT_POST_REPLY_LIST = "INVALIDATE_CLIENT_POST_REPLY_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_CLIENT_POST_REPLY_LIST
  }
}
