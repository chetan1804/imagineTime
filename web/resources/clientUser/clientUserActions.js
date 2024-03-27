/**
 * All clientUser CRUD actions
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


/**
 * NOTE: this is for associating 'logged in' clientUser objects by firm id and 
 * exposing them to the reducer 
 * @param {*} state 
 * @param {*} id 
 */

const shouldFetchLoggedInByClient = (state, clientId) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { loggedInByClient } = state.clientUser;
  if(!clientId) {
    // passed in null or undefined for the id parameter.  so we should NOT fetch 
    return false;
  } else if(!loggedInByClient[clientId]) {
    // the clientId is not in the map.  fetch from server
    return true; 
  } else if(loggedInByClient[clientId].isFetching) {
    // it is already fetching, don't do anything
    return false;
  } else if(!loggedInByClient[clientId].error && !loggedInByClient[clientId].clientUser) {
    // the clientId is in the map, but the clientUser object doesn't exist 
    // however, if the api returned an error, then the clientUser ojbect SHOULDN'T be in there
    // so re-fetching it will result in an infinite loop
    // console.log("Y shouldFetch - true: not in map");
    return true;
  } else if(new Date().getTime() - loggedInByClient[clientId].lastUpdated > (1000 * 60 * 5)) {
    // it's been longer than 5 minutes since the last fetch, get a new one
    // console.log("Y shouldFetch - true: older than 5 minutes");
    // also, don't automatically invalidate on server error. if server throws an error,
    // that won't change on subsequent requests and we will have an infinite loop
    return true;
  } else {
    // if "selected" is invalidated, fetch a new one, otherwise don't
    // console.log("Y shouldFetch - " + selected.didInvalidate + ": didInvalidate");
    return loggedInByClient[clientId].didInvalidate;
  }
}

export const INVALIDATE_CLIENT_USER_LOGGED_IN_BY_CLIENT = "INVALIDATE_CLIENT_USER_LOGGED_IN_BY_CLIENT"
export function invalidateLoggedInByClient(clientId) {
  return {
    clientId
    , type: INVALIDATE_CLIENT_USER_LOGGED_IN_BY_CLIENT
  }
}

export const fetchClientUserLoggedInByClientIfNeeded = (clientId) => (dispatch, getState) => {
  if (shouldFetchLoggedInByClient(getState(), clientId)) {
    return dispatch(fetchClientUserLoggedInByClientId(clientId))
  } else {
    return dispatch(returnClientUserLoggedInByClientPromise(clientId)); // return promise that contains clientUser
  }
}


export const returnClientUserLoggedInByClientPromise = (clientId) => (dispatch, getState) => {
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
      clientId: clientId
      , item: getState().clientUser.loggedInByClient[clientId].clientUser
      , success: true
      , type: "RETURN_CLIENT_USER_LOGGED_IN_BY_CLIENT_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_CLIENT_USER_LOGGED_IN_BY_CLIENT = "REQUEST_CLIENT_USER_LOGGED_IN_BY_CLIENT";
function requestClientUserLoggedInByClientId(clientId) {
  return {
    clientId
    , type: REQUEST_CLIENT_USER_LOGGED_IN_BY_CLIENT
  }
}

export const RECEIVE_CLIENT_USER_LOGGED_IN_BY_CLIENT = "RECEIVE_CLIENT_USER_LOGGED_IN_BY_CLIENT";
function receiveClientUserLoggedInByClientId(json, clientId) {
  return {
    error: json.message
    , clientId: clientId // When no clientUser is found this was creating a new list called null and leaving the original list fetching forever.
    , item: json.clientUser
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_USER_LOGGED_IN_BY_CLIENT
  }
}

export function fetchClientUserLoggedInByClientId(clientId) {
  return dispatch => {
    dispatch(requestClientUserLoggedInByClientId(clientId))
    return apiUtils.callAPI(`/api/client-users/logged-in-by-client/${clientId}`)
      .then(json => dispatch(receiveClientUserLoggedInByClientId(json, clientId)))
  }
}

const shouldFetchSingle = (state, id) => {
  /**
   * This is helper method to determine whether we should fetch a new single
   * user object from the server, or if a valid one already exists in the store
   *
   * NOTE: Uncomment console logs to help debugging
   */
  // console.log("shouldFetch single");
  const { byId, selected } = state.clientUser;
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

export const INVALIDATE_SELECTED_CLIENT_USER = "INVALIDATE_SELECTED_CLIENT_USER"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_CLIENT_USER
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleClientUserById(id))
  } else {
    return dispatch(returnSingleClientUserPromise(id)); // return promise that contains clientUser
  }
}


export const returnSingleClientUserPromise = (id) => (dispatch, getState) => {
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
      , item: getState().clientUser.byId[id]
      , success: true
      , type: "RETURN_SINGLE_CLIENT_USER_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_CLIENT_USER = "REQUEST_SINGLE_CLIENT_USER";
function requestSingleClientUser(id) {
  return {
    id
    , type: REQUEST_SINGLE_CLIENT_USER
  }
}

export const RECEIVE_SINGLE_CLIENT_USER = "RECEIVE_SINGLE_CLIENT_USER";
function receiveSingleClientUser(json) {
  return {
    error: json.message
    , id: json.clientUser ? json.clientUser._id : null
    , item: json.clientUser
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_CLIENT_USER
  }
}

export function fetchSingleClientUserById(id) {
  return dispatch => {
    dispatch(requestSingleClientUser(id))
    return apiUtils.callAPI(`/api/client-users/${id}`)
      .then(json => dispatch(receiveSingleClientUser(json)))
  }
}

export const ADD_SINGLE_CLIENT_USER_TO_MAP = "ADD_SINGLE_CLIENT_USER_TO_MAP";
export function addSingleClientUserToMap(item) {
  return {
    item
    , type: ADD_SINGLE_CLIENT_USER_TO_MAP
  }
}

export const SET_SELECTED_CLIENT_USER = "SET_SELECTED_CLIENT_USER";
export function setSelectedClientUser(item) {
  return {
    type: SET_SELECTED_CLIENT_USER
    , item
  }
}

export const REQUEST_DEFAULT_CLIENT_USER = "REQUEST_DEFAULT_CLIENT_USER";
function requestDefaultClientUser(id) {
  return {
    type: REQUEST_DEFAULT_CLIENT_USER
  }
}

export const RECEIVE_DEFAULT_CLIENT_USER = "RECEIVE_DEFAULT_CLIENT_USER";
function receiveDefaultClientUser(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_CLIENT_USER
  }
}

export function fetchDefaultClientUser() {
  return dispatch => {
    dispatch(requestDefaultClientUser())
    return apiUtils.callAPI(`/api/client-users/default`)
      .then(json => dispatch(receiveDefaultClientUser(json)))
  }
}

export const REQUEST_CLIENT_USER_SCHEMA = "REQUEST_CLIENT_USER_SCHEMA";
function requestClientUserSchema(id) {
  return {
    type: REQUEST_CLIENT_USER_SCHEMA
  }
}
 export const RECEIVE_CLIENT_USER_SCHEMA = "RECEIVE_CLIENT_USER_SCHEMA";
function receiveClientUserSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_USER_SCHEMA
  }
}
 export function fetchClientUserSchema() {
  return dispatch => {
    dispatch(requestClientUserSchema())
    return apiUtils.callAPI(`/api/client-users/schema`)
      .then(json => dispatch(receiveClientUserSchema(json)))
  }
}

export const REQUEST_CREATE_CLIENT_USER = "REQUEST_CREATE_CLIENT_USER";
function requestCreateClientUser(clientUser) {
  return {
    clientUser
    , type: REQUEST_CREATE_CLIENT_USER
  }
}

export const RECEIVE_CREATE_CLIENT_USER = "RECEIVE_CREATE_CLIENT_USER";
function receiveCreateClientUser(json) {
  return {
    error: json.message
    , id: json.clientUser ? json.clientUser._id : null
    , item: json.clientUser
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_CLIENT_USER
  }
}

export function sendCreateClientUser(data) {
  return dispatch => {
    dispatch(requestCreateClientUser(data))
    return apiUtils.callAPI('/api/client-users', 'POST', data)
      .then(json => dispatch(receiveCreateClientUser(json)))
  }
}

export const REQUEST_INVITE_CLIENT_USERS = "REQUEST_INVITE_CLIENT_USERS";
function requestInviteClientUsers(clientUser) {
  return {
    type: REQUEST_INVITE_CLIENT_USERS
    , clientUser
  }
}

export const RECEIVE_INVITE_CLIENT_USERS = "RECEIVE_INVITE_CLIENT_USERS";
function receiveInviteClientUsers(json) {
  return {
    error: json.message
    , data: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_INVITE_CLIENT_USERS
  }
}

export function sendInviteClientUsers(clientId, data) {
  return dispatch => {
    dispatch(requestInviteClientUsers(data))
    return apiUtils.callAPI(`/api/client-users/invite/${clientId}`, 'POST', data)
      .then(json => dispatch(receiveInviteClientUsers(json)))
  }
}

export function sendResendInviteClientUsers(data) {
  return dispatch => {
    dispatch(requestInviteClientUsers(data))
    return apiUtils.callAPI(`/api/client-users/resend-invite`, 'POST', data)
      .then(json => dispatch(receiveInviteClientUsers(json)))
  }
}

export const REQUEST_UPDATE_CLIENT_USER = "REQUEST_UPDATE_CLIENT_USER";
function requestUpdateClientUser(clientUser) {
  return {
    id: clientUser ? clientUser._id: null
    , clientUser
    , type: REQUEST_UPDATE_CLIENT_USER
  }
}

export const RECEIVE_UPDATE_CLIENT_USER = "RECEIVE_UPDATE_CLIENT_USER";
function receiveUpdateClientUser(json) {
  return {
    error: json.message
    , id: json.clientUser ? json.clientUser._id : null
    , item: json.clientUser
    , client: json.client
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_CLIENT_USER
  }
}

export function sendUpdateClientUser(data) {
  return dispatch => {
    dispatch(requestUpdateClientUser(data))
    return apiUtils.callAPI(`/api/client-users/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateClientUser(json)))
  }
}

export const REQUEST_DELETE_CLIENT_USER = "REQUEST_DELETE_CLIENT_USER";
function requestDeleteClientUser(id) {
  return {
    id
    , type: REQUEST_DELETE_CLIENT_USER
  }
}

export const RECEIVE_DELETE_CLIENT_USER = "RECEIVE_DELETE_CLIENT_USER";
function receiveDeleteClientUser(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_CLIENT_USER
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteClientUser(id))
    return apiUtils.callAPI(`/api/client-users/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteClientUser(id, json)))
  }
}

export const RECEIVE_BULK_UPDATE_CLIENT_USER = "RECEIVE_BULK_UPDATE_CLIENT_USER";
function receiveBulkUpdateClientUser(json) {
  return {
    error: json.message
    , list: json.data
    , client: json.client
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_UPDATE_CLIENT_USER
  }
}

export const REQUEST_BULK_UPDATE_CLIENT_USER = "REQUEST_BULK_UPDATE_CLIENT_USER";
function requestBulkUpdateClientUser(clientUser) {
  return {
    clientUser
    , type: REQUEST_BULK_UPDATE_CLIENT_USER
  }
}
export function sendBulkUpdateClientUser(data) {
  return dispatch => {
    dispatch(requestBulkUpdateClientUser(data))
    return apiUtils.callAPI(`/api/client-users/bulk-update-status`, 'POST', data)
      .then(json => dispatch(receiveBulkUpdateClientUser(json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest clientUserLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.clientUser.lists, {});
  let list = { ...state.clientUser.lists }
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
    console.log("should fetch listargs", listArgs);
    return dispatch(fetchList(...listArgs));
  } else {
    console.log("else listargs", listArgs);
    return dispatch(returnClientUserListPromise(...listArgs));
  }
}

export const returnClientUserListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.clientUser.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_CLIENT_USER_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_CLIENT_USER_LIST = "REQUEST_CLIENT_USER_LIST"
function requestClientUserList(listArgs) {
  return {
    listArgs
    , type: REQUEST_CLIENT_USER_LIST
  }
}

export const RECEIVE_CLIENT_USER_LIST = "RECEIVE_CLIENT_USER_LIST"
function receiveClientUserList(json, listArgs) {
  return {
    error: json.message
    , list: json.clientUsers
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_USER_LIST
  }
}

export const ADD_CLIENT_USER_TO_LIST = "ADD_CLIENT_USER_TO_LIST";
export function addClientUserToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_CLIENT_USER_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_CLIENT_USER_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_CLIENT_USER_FROM_LIST = "REMOVE_CLIENT_USER_FROM_LIST"
export function removeClientUserFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_CLIENT_USER_FROM_LIST
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
    dispatch(requestClientUserList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/client-users/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/client-users/by-[ARG1]/[ARG2]".
     *    ex: /api/client-users/by-category/:category
     *  if 2nd arg is an array, though, return "/api/client-users/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/client-users";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of clientUsers given an array of clientUser id's, among other things
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
      json => dispatch(receiveClientUserList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_CLIENT_USER_QUERY = "SET_CLIENT_USER_QUERY"
export function setQuery(query, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_CLIENT_USER_QUERY
    , query
    , listArgs
  }
}

export const SET_CLIENT_USER_FILTER = "SET_CLIENT_USER_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_CLIENT_USER_FILTER
  }
}

export const SET_CLIENT_USER_PAGINATION = "SET_CLIENT_USER_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_CLIENT_USER_PAGINATION
  }
}

export const INVALIDATE_CLIENT_USER_LIST = "INVALIDATE_CLIENT_USER_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_CLIENT_USER_LIST
  }
}

export const REQUEST_INVITE_RESET_USER = "REQUEST_INVITE_RESET_USER";
function requestInviteWithResetUser(user) {
  return {
    type: REQUEST_INVITE_RESET_USER
    , user
  }
}

export const RECEIVE_INVITE_RESET_USER = "RECEIVE_INVITE_RESET_USER";
function receiveInviteWithResetUser(json) {
  return {
    error: json.message
    , data: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_INVITE_RESET_USER
  }
}

export function sendInviteWithResetUser(data) {
  return dispatch => {
    dispatch(requestInviteWithResetUser(data))
    return apiUtils.callAPI(`/api/client-users/invite-reset/${data.clientId}`, 'POST', { user: data.user })
      .then(json => dispatch(receiveInviteWithResetUser(json)))
  }
}

export function sendUpdateClientUserStatus(data) {
  return dispatch => {
    dispatch(requestUpdateClientUser(data))
    return apiUtils.callAPI(`/api/client-users/update/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateClientUser(json)))
  }
}

export function updateSingleClientToMap(json) {
  return {
    error: json.message
    , id: json.clientUser ? json.clientUser._id : null
    , item: json.clientUser
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_CLIENT_USER
  }
}