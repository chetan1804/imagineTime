/**
 * All client CRUD actions
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
  const { byId, selected } = state.client;
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
  } else if(new Date().getTime() - selected.lastUpdated > (1000 * 60 * 10)) {
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

export const INVALIDATE_SELECTED_CLIENT = "INVALIDATE_SELECTED_CLIENT"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_CLIENT
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleClientById(id))
  } else {
    return dispatch(returnSingleClientPromise(id)); // return promise that contains client
  }
}


export const returnSingleClientPromise = (id) => (dispatch, getState) => {
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
      , item: getState().client.byId[id]
      , success: true
      , type: "RETURN_SINGLE_CLIENT_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_CLIENT = "REQUEST_SINGLE_CLIENT";
function requestSingleClient(id) {
  return {
    id
    , type: REQUEST_SINGLE_CLIENT
  }
}

export const RECEIVE_SINGLE_CLIENT = "RECEIVE_SINGLE_CLIENT";
function receiveSingleClient(json) {
  return {
    error: json.message
    , id: json.client ? json.client._id : null
    , item: json.client
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_CLIENT
  }
}

export function fetchSingleClientById(id) {
  return dispatch => {
    dispatch(requestSingleClient(id))
    return apiUtils.callAPI(`/api/clients/${id}`)
      .then(json => dispatch(receiveSingleClient(json)))
  }
}

export const ADD_SINGLE_CLIENT_TO_MAP = "ADD_SINGLE_CLIENT_TO_MAP";
export function addSingleClientToMap(item) {
  return {
    item
    , type: ADD_SINGLE_CLIENT_TO_MAP
  }
}

export const SET_SELECTED_CLIENT = "SET_SELECTED_CLIENT";
export function setSelectedClient(item) {
  return {
    type: SET_SELECTED_CLIENT
    , item
  }
}

export const REQUEST_DEFAULT_CLIENT = "REQUEST_DEFAULT_CLIENT";
function requestDefaultClient(id) {
  return {
    type: REQUEST_DEFAULT_CLIENT
  }
}

export const RECEIVE_DEFAULT_CLIENT = "RECEIVE_DEFAULT_CLIENT";
function receiveDefaultClient(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_CLIENT
  }
}

export function fetchDefaultClient() {
  return dispatch => {
    dispatch(requestDefaultClient())
    return apiUtils.callAPI(`/api/clients/default`)
      .then(json => dispatch(receiveDefaultClient(json)))
  }
}

export const REQUEST_CLIENT_SCHEMA = "REQUEST_CLIENT_SCHEMA";
function requestClientSchema(id) {
  return {
    type: REQUEST_CLIENT_SCHEMA
  }
}
 export const RECEIVE_CLIENT_SCHEMA = "RECEIVE_CLIENT_SCHEMA";
function receiveClientSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_SCHEMA
  }
}
 export function fetchClientSchema() {
  return dispatch => {
    dispatch(requestClientSchema())
    return apiUtils.callAPI(`/api/clients/schema`)
      .then(json => dispatch(receiveClientSchema(json)))
  }
}

export const REQUEST_CREATE_CLIENT = "REQUEST_CREATE_CLIENT";
function requestCreateClient(client) {
  return {
    client
    , type: REQUEST_CREATE_CLIENT
  }
}

export const RECEIVE_CREATE_CLIENT = "RECEIVE_CREATE_CLIENT";
function receiveCreateClient(json) {
  return {
    error: json.message
    , id: json.client ? json.client._id : null
    , item: json.client
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_CLIENT
    , staffClient: json.staffClient
  }
}

export function sendCreateClient(data) {
  return dispatch => {
    dispatch(requestCreateClient(data))
    return apiUtils.callAPI('/api/clients', 'POST', data)
      .then(json => dispatch(receiveCreateClient(json)))
  }
}

export const REQUEST_BULK_INVITE_CLIENTS = "REQUEST_BULK_INVITE_CLIENTS";
function requestBulkInviteClients(clients) {
  return {
    type: REQUEST_BULK_INVITE_CLIENTS
    , clients
  }
}

export const RECEIVE_BULK_INVITE_CLIENTS = "RECEIVE_BULK_INVITE_CLIENTS";
function receiveBulkInviteClients(json) {
  return {
    error: json.message
    , data: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_INVITE_CLIENTS
  }
}

export function sendBulkInviteClients(data) {
  return dispatch => {
    dispatch(requestBulkInviteClients(data))
    return apiUtils.callAPI('/api/clients/bulk-invite', 'POST', data)
      .then(json => dispatch(receiveBulkInviteClients(json)))
  }
}

export const REQUEST_UPDATE_CLIENT = "REQUEST_UPDATE_CLIENT";
function requestUpdateClient(client) {
  return {
    id: client ? client._id: null
    , client
    , type: REQUEST_UPDATE_CLIENT
  }
}

export const RECEIVE_UPDATE_CLIENT = "RECEIVE_UPDATE_CLIENT";
function receiveUpdateClient(json) {
  return {
    error: json.message
    , id: json.client ? json.client._id : null
    , item: json.client
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_CLIENT
  }
}

export function sendUpdateClient(data) {
  const newData = _.cloneDeep(data);
  delete newData.staffclients;
  delete newData.phonenumbers;
  delete newData.phonenumber;
  delete newData.objaddress;
  delete newData.address;
  return dispatch => {
    dispatch(requestUpdateClient(newData))
    return apiUtils.callAPI(`/api/clients/${data._id}`, 'PUT', newData)
      .then(json => dispatch(receiveUpdateClient(json)))
  }
}

export function sendUpdateClientStatus(data) {
  const newData = _.cloneDeep(data);
  delete newData.staffclients;
  delete newData.phonenumbers;
  delete newData.phonenumber;
  delete newData.objaddress;
  delete newData.address;
  return dispatch => {
    dispatch(requestUpdateClient(newData))
    return apiUtils.callAPI(`/api/clients/status/${data._id}`, 'PUT', newData)
      .then(json => dispatch(receiveUpdateClient(json)))
  }
}

export const REQUEST_DELETE_CLIENT = "REQUEST_DELETE_CLIENT";
function requestDeleteClient(id) {
  return {
    id
    , type: REQUEST_DELETE_CLIENT
  }
}

export const RECEIVE_DELETE_CLIENT = "RECEIVE_DELETE_CLIENT";
function receiveDeleteClient(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_CLIENT
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteClient(id))
    return apiUtils.callAPI(`/api/clients/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteClient(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest clientLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.client.lists, {});
  let list = { ...state.client.lists }
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
    return dispatch(returnClientListPromise(...listArgs));
  }
}

export const returnClientListPromise = (...listArgs) => (dispatch, getState) => {
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
  const clientStore = state.client;
  const listItemIds = findListFromArgs(state, listArgs).items
  const listItems = listItemIds ? listItemIds.map(id => state.client.byId[id]) : listItemIds;

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_CLIENT_LIST_WITHOUT_FETCHING"
      , engagementTypes: clientStore.formHelpers.engagementTypes
    })
  });
}

export const REQUEST_CLIENT_LIST = "REQUEST_CLIENT_LIST"
function requestClientList(listArgs) {
  return {
    listArgs
    , type: REQUEST_CLIENT_LIST
  }
}

export const RECEIVE_CLIENT_LIST = "RECEIVE_CLIENT_LIST"
function receiveClientList(json, listArgs) {
  return {
    error: json.message
    , list: json.clients
    , files: json.files
    , clientWorkflows: json.clientWorkflows
    , clientTasks: json.clientTasks
    , engagementTypes: json.engagementTypes
    , tags: json.tags
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_LIST
  }
}

export const ADD_CLIENT_TO_LIST = "ADD_CLIENT_TO_LIST";
export function addClientToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_CLIENT_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_CLIENT_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_CLIENT_FROM_LIST = "REMOVE_CLIENT_FROM_LIST"
export function removeClientFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_CLIENT_FROM_LIST
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
    dispatch(requestClientList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/clients/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/clients/by-[ARG1]/[ARG2]".
     *    ex: /api/clients/by-category/:category
     *  if 2nd arg is an array, though, return "/api/clients/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/clients";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of clients given an array of client id's, among other things
      apiTarget += `/by-${listArgs[0]}-list?`;
      // build query string
      for(let i = 0; i < listArgs[1].length; i++) {
        apiTarget += `${listArgs[0]}=${listArgs[1][i]}&`
      }
    } else if(listArgs.length == 2) {
      // ex: ("author","12345")
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
    } else if(listArgs.length == 4 && listArgs[0] == "search") {
      apiTarget += `/search/${listArgs[1]}/${listArgs[2]}${listArgs[3]}`;
    } else if(listArgs.length > 2) {
      apiTarget += `/by-${listArgs[0]}/${listArgs[1]}`;
      for(let i = 2; i < listArgs.length; i++) {
        apiTarget += `/${listArgs[i]}`;
      }
    }
    return apiUtils.callAPI(apiTarget).then(
      json => dispatch(receiveClientList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_CLIENT_QUERY = "SET_CLIENT_QUERY"
export function setQuery(query, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_CLIENT_QUERY
    , query
    , listArgs
  }
}

export const SET_CLIENT_FILTER = "SET_CLIENT_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_CLIENT_FILTER
  }
}

export const SET_CLIENT_PAGINATION = "SET_CLIENT_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_CLIENT_PAGINATION
  }
}

export const INVALIDATE_CLIENT_LIST = "INVALIDATE_CLIENT_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_CLIENT_LIST
  }
}

/**
 * CUSTOM ACTIONS
 */

export const REQUEST_CLIENT_REMINDER = "REQUEST_CLIENT_REMINDER";
function requestClientReminder(clientId) {
  return {
    id: clientId
    , type: REQUEST_CLIENT_REMINDER
  }
}

export const RECEIVE_CLIENT_REMINDER = "RECEIVE_CLIENT_REMINDER";
function receiveClientReminder(json) {
  return {
    error: json.message
    , message: json.message
    , success: json.success
    , receivedAt: Date.now()
    , type: RECEIVE_CLIENT_REMINDER
  }
}

export function sendClientReminder(clientId) {
  return dispatch => {
    dispatch(requestClientReminder(clientId))
    return apiUtils.callAPI(`/api/clients/${clientId}/send-reminder`, 'POST')
      .then(json => dispatch(receiveClientReminder(json)))
  }
}

export const REQUEST_BULK_UPDATE_CLIENT = "REQUEST_BULK_UPDATE_CLIENT";
function requestBulkUpdateClient(client) {
  return {
    client
    , type: REQUEST_BULK_UPDATE_CLIENT
  }
}

export const RECEIVE_BULK_UPDATE_CLIENT = "RECEIVE_BULK_UPDATE_CLIENT";
function receiveBulkUpdateClient(json) {
  return {
    error: json.message
    , list: json.data
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_BULK_UPDATE_CLIENT
  }
}

export const SET_CLIENTSETTINGS_FILTER = "SET_CLIENTSETTINGS_FILTER"
export function setSettingsScreenFilter(filterNames) {
  return {
    filterNames
    , type: SET_CLIENTSETTINGS_FILTER
  }
}

export function sendBulkUpdateClient(data) {
  return dispatch => {
    dispatch(requestBulkUpdateClient(data))
    return apiUtils.callAPI(`/api/clients/bulk-update`, 'POST', data)
      .then(json => dispatch(receiveBulkUpdateClient(json)))
  }
}

export function sendBulkNotificationUpdate(data) {
  return dispatch => {
    dispatch(requestBulkUpdateClient(data))
    return apiUtils.callAPI(`/api/clients/bulk-notification-update`, 'POST', data)
      .then(json => dispatch(receiveBulkUpdateClient(json)))
  }
}

export function sendCreateExistingClient(data) {
  return dispatch => {
    dispatch(requestCreateClient(data))
    return apiUtils.callAPI('/api/clients/existingClient', 'POST', data)
      .then(json => dispatch(receiveCreateClient(json)))
  }
}

export function updateSingleClientToMap(json) {
  return {
    error: json.message
    , id: json.client ? json.client._id : null
    , item: json.client
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_CLIENT
  }
}