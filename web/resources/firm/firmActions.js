/**
 * All firm CRUD actions
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
  const { byId, selected } = state.firm;
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

export const INVALIDATE_SELECTED_FIRM = "INVALIDATE_SELECTED_FIRM"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_FIRM
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleFirmById(id))
  } else {
    return dispatch(returnSingleFirmPromise(id))
  }
}

export const fetchSingleIfNeededByKey  = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleFirmById(id))
  } else {
    return dispatch(returnSingleFirmPromise(id))
  }
}


export const returnSingleFirmPromise = (id) => (dispatch, getState) => {
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
      , item: getState().firm.byId[id]
      , success: true
      , type: "RETURN_SINGLE_FIRM_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_FIRM = "REQUEST_SINGLE_FIRM";
function requestSingleFirm(id) {
  return {
    id
    , type: REQUEST_SINGLE_FIRM
  }
}

export const RECEIVE_SINGLE_FIRM = "RECEIVE_SINGLE_FIRM";
function receiveSingleFirm(json) {
  let response = {
    error: json.message
    , id: json.firm ? json.firm._id : null
    , item: json.firm
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_FIRM
  }

  console.log('this is the response', response);
  if (json && json.firm && json.firm.subscription) {
    response.subscription = json.firm.subscription
  }
  return response;
}

export function fetchSingleFirmById(id) {
  return dispatch => {
    dispatch(requestSingleFirm(id))
    return apiUtils.callAPI(`/api/firms/${id}`)
      .then(json => dispatch(receiveSingleFirm(json)))
  }
}

export function fetchSingleFirmByDomain() {
  return dispatch => {
    dispatch(requestSingleFirm(null))
    return apiUtils.callAPI(`/api/firms/domain`)
      .then(json => dispatch(receiveSingleFirm(json)))
  }
}

export const ADD_SINGLE_FIRM_TO_MAP = "ADD_SINGLE_FIRM_TO_MAP";
export function addSingleFirmToMap(item) {
  return {
    item
    , type: ADD_SINGLE_FIRM_TO_MAP
  }
}

export const SET_SELECTED_FIRM = "SET_SELECTED_FIRM";
export function setSelectedFirm(item) {
  return {
    type: SET_SELECTED_FIRM
    , item
  }
}

export const REQUEST_DEFAULT_FIRM = "REQUEST_DEFAULT_FIRM";
function requestDefaultFirm(id) {
  return {
    type: REQUEST_DEFAULT_FIRM
  }
}

export const RECEIVE_DEFAULT_FIRM = "RECEIVE_DEFAULT_FIRM";
function receiveDefaultFirm(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_FIRM
  }
}

export function fetchDefaultFirm() {
  return dispatch => {
    dispatch(requestDefaultFirm())
    return apiUtils.callAPI(`/api/firms/default`)
      .then(json => dispatch(receiveDefaultFirm(json)))
  }
}

export const REQUEST_FIRM_SCHEMA = "REQUEST_FIRM_SCHEMA";
function requestFirmSchema(id) {
  return {
    type: REQUEST_FIRM_SCHEMA
  }
}
 export const RECEIVE_FIRM_SCHEMA = "RECEIVE_FIRM_SCHEMA";
function receiveFirmSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FIRM_SCHEMA
  }
}
 export function fetchFirmSchema() {
  return dispatch => {
    dispatch(requestFirmSchema())
    return apiUtils.callAPI(`/api/firms/schema`)
      .then(json => dispatch(receiveFirmSchema(json)))
  }
}

export const REQUEST_CREATE_FIRM = "REQUEST_CREATE_FIRM";
function requestCreateFirm(firm) {
  return {
    firm
    , type: REQUEST_CREATE_FIRM
  }
}

export const RECEIVE_CREATE_FIRM = "RECEIVE_CREATE_FIRM";
function receiveCreateFirm(json) {
  return {
    error: json.message
    , id: json.firm ? json.firm._id : null
    , item: json.firm
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_FIRM
  }
}

export function sendCreateFirm(data) {
  return dispatch => {
    dispatch(requestCreateFirm(data))
    return apiUtils.callAPI('/api/firms', 'POST', data)
      .then(json => dispatch(receiveCreateFirm(json)))
  }
}

export const REQUEST_UPDATE_FIRM = "REQUEST_UPDATE_FIRM";
function requestUpdateFirm(firm) {
  return {
    id: firm ? firm._id: null
    , firm
    , type: REQUEST_UPDATE_FIRM
  }
}

export const RECEIVE_UPDATE_FIRM = "RECEIVE_UPDATE_FIRM";
function receiveUpdateFirm(json) {
  return {
    error: json.message
    , id: json.firm ? json.firm._id : null
    , item: json.firm
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_FIRM
  }
}

export function sendUpdateFirm(data) {
  delete data.subscription;
  return dispatch => {
    dispatch(requestUpdateFirm(data))
    return apiUtils.callAPI(`/api/firms/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateFirm(json)))
  }
}

export const REQUEST_UPDATE_GROUP_PERMISSION = "REQUEST_UPDATE_GROUP_PERMISSION";
function requestCreateGroupPermission(permission) {
  return {
    type: REQUEST_UPDATE_GROUP_PERMISSION
    , permission
  }
} 

export function sendUpdateGroupPermission(data) {
  return dispatch => {
    dispatch(requestCreateGroupPermission(data))
    return apiUtils.callAPI('/api/folder-permission/createByGroup', 'POST', data)
      .then(json => dispatch(receiveUpdateFirm(json)))
  }
}

export const REQUEST_DELETE_FIRM = "REQUEST_DELETE_FIRM";
function requestDeleteFirm(id) {
  return {
    id
    , type: REQUEST_DELETE_FIRM
  }
}

export const RECEIVE_DELETE_FIRM = "RECEIVE_DELETE_FIRM";
function receiveDeleteFirm(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_FIRM
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteFirm(id))
    return apiUtils.callAPI(`/api/firms/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteFirm(id, json)))
  }
}

/**
 * ASSURESIGN ACTIONS
 */
export const REQUEST_GET_TEMPLATES = "REQUEST_GET_TEMPLATES";
function requestGetTemplates(id) {
  return {
    id
    , type: REQUEST_GET_TEMPLATES
  }
}

export const RECEIVE_GET_TEMPLATES = "RECEIVE_GET_TEMPLATES";
function receiveGetTemplates(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_GET_TEMPLATES
    , templates: json.templates
  }
}

export function sendGetTemplates(id) {
  return dispatch => {
    dispatch(requestGetTemplates(id))
    return apiUtils.callAPI(`/api/firms/${id}/signature-templates`)
      .then(json => dispatch(receiveGetTemplates(id, json)))
  }
}

/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest firmLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.firm.lists, {});
  let list = { ...state.firm.lists }
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
    return dispatch(returnFirmListPromise(...listArgs));
  }
}

export const returnFirmListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.firm.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_FIRM_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_FIRM_LIST = "REQUEST_FIRM_LIST"
function requestFirmList(listArgs) {
  return {
    listArgs
    , type: REQUEST_FIRM_LIST
  }
}

export const RECEIVE_FIRM_LIST = "RECEIVE_FIRM_LIST"
function receiveFirmList(json, listArgs) {
  return {
    error: json.message
    , list: json.firms
    , files: json.files
    , clients: json.clients
    , clientWorkflows: json.clientWorkflows
    , clientTasks: json.clientTasks
    , tags: json.tags
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FIRM_LIST
  }
}

export const ADD_FIRM_TO_LIST = "ADD_FIRM_TO_LIST";
export function addFirmToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_FIRM_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_FIRM_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_FIRM_FROM_LIST = "REMOVE_FIRM_FROM_LIST"
export function removeFirmFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_FIRM_FROM_LIST
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
    dispatch(requestFirmList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/firms/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/firms/by-[ARG1]/[ARG2]".
     *    ex: /api/firms/by-category/:category
     *  if 2nd arg is an array, though, return "/api/firms/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/firms";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of firms given an array of firm id's, among other things
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
      json => dispatch(receiveFirmList(json, listArgs))
    )
  }
}

export function fetchFileListFromSearch(data, listArgs) {
  return dispatch => {
    return apiUtils.callAPI(`/api/firms/file-search/${data._firm}${data.query}`, 'POST', data).then(
      json => dispatch(receiveFileListFromSearch(json, listArgs))
    )
  }
}

function receiveFileListFromSearch(json, listArgs) {
  return {
    error: json.message
    , files: json.files
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FIRM_LIST
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_FIRM_FILTER = "SET_FIRM_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_FIRM_FILTER
  }
}

export const SET_FIRM_PAGINATION = "SET_FIRM_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_FIRM_PAGINATION
  }
}

export const INVALIDATE_FIRM_LIST = "INVALIDATE_FIRM_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_FIRM_LIST
  }
}
