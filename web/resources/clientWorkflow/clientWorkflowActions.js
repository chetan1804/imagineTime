/**
 * All ClientWorkflow CRUD actions
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
  const { byId, selected } = state.clientWorkflow;
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

export const INVALIDATE_SELECTED_CLIENT_WORKFLOW = "INVALIDATE_SELECTED_CLIENT_WORKFLOW"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_CLIENT_WORKFLOW
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleClientWorkflowById(id))
  } else {
    return dispatch(returnSingleClientWorkflowPromise(id)); // return promise that contains clientWorkflow
  }
}

export const returnSingleClientWorkflowPromise = (id) => (dispatch, getState) => {
  /**
   * This returns the object from the map so that we can do things with it in
   * the component.
   *
   * For the "fetchIfNeeded()" functionality, we need to return a promised object
   * EVEN IF we don't need to fetch it. this is because if we have any .then()'s
   * in the components, they will fail when we don't need to fetch.
   */
  return new Promise((resolve, reject) => {
    resolve({
      type: "RETURN_SINGLE_CLIENT_WORKFLOW_WITHOUT_FETCHING"
      , id: id
      , item: getState().clientWorkflow.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE_CLIENT_WORKFLOW = "REQUEST_SINGLE_CLIENT_WORKFLOW";
function requestSingleClientWorkflow(id) {
  return {
    type: REQUEST_SINGLE_CLIENT_WORKFLOW
    , id
  }
}

export const RECEIVE_SINGLE_CLIENT_WORKFLOW = "RECEIVE_SINGLE_CLIENT_WORKFLOW";
function receiveSingleClientWorkflow(json) {
  return {
    type: RECEIVE_SINGLE_CLIENT_WORKFLOW
    , id: json.clientWorkflow ? json.clientWorkflow._id : null
    , item: json.clientWorkflow
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSingleClientWorkflowById(clientWorkflowId) {
  return dispatch => {
    dispatch(requestSingleClientWorkflow(clientWorkflowId))
    return apiUtils.callAPI(`/api/client-workflows/${clientWorkflowId}`)
      .then(json => dispatch(receiveSingleClientWorkflow(json)))
  }
}

export const ADD_SINGLE_CLIENT_WORKFLOW_TO_MAP = "ADD_SINGLE_CLIENT_WORKFLOW_TO_MAP";
export function addSingleClientWorkflowToMap(item) {
  return {
    type: ADD_SINGLE_CLIENT_WORKFLOW_TO_MAP
    , item
  }
}

export const SET_SELECTED_CLIENT_WORKFLOW = "SET_SELECTED_CLIENT_WORKFLOW";
export function setSelectedClientWorkflow(item) {
  return {
    type: SET_SELECTED_CLIENT_WORKFLOW
    , item
  }
}


export const REQUEST_DEFAULT_CLIENT_WORKFLOW = "REQUEST_DEFAULT_CLIENT_WORKFLOW";
function requestDefaultClientWorkflow(id) {
  return {
    type: REQUEST_DEFAULT_CLIENT_WORKFLOW
  }
}

export const RECEIVE_DEFAULT_CLIENT_WORKFLOW = "RECEIVE_DEFAULT_CLIENT_WORKFLOW";
function receiveDefaultClientWorkflow(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_CLIENT_WORKFLOW
  }
}

export function fetchDefaultClientWorkflow() {
  return dispatch => {
    dispatch(requestDefaultClientWorkflow())
    return apiUtils.callAPI(`/api/client-workflows/default`)
      .then(json => dispatch(receiveDefaultClientWorkflow(json)))
  }
}


export const REQUEST_CLIENT_WORKFLOW_SCHEMA = "REQUEST_CLIENT_WORKFLOW_SCHEMA";
function requestClientWorkflowSchema(id) {
  return {
    type: REQUEST_CLIENT_WORKFLOW_SCHEMA
  }
}

export const RECEIVE_CLIENT_WORKFLOW_SCHEMA = "RECEIVE_CLIENT_WORKFLOW_SCHEMA";
function receiveClientWorkflowSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CLIENT_WORKFLOW_SCHEMA
  }
}

export function fetchClientWorkflowSchema() {
  return dispatch => {
    dispatch(requestClientWorkflowSchema())
    return apiUtils.callAPI(`/api/client-workflows/schema`)
      .then(json => dispatch(receiveClientWorkflowSchema(json)))
  }
}


export const REQUEST_CREATE_CLIENT_WORKFLOW = "REQUEST_CREATE_CLIENT_WORKFLOW";
function requestCreateClientWorkflow(clientWorkflow) {
  return {
    type: REQUEST_CREATE_CLIENT_WORKFLOW
    , clientWorkflow
  }
}

export const RECEIVE_CREATE_CLIENT_WORKFLOW = "RECEIVE_CREATE_CLIENT_WORKFLOW";
function receiveCreateClientWorkflow(json) {
  return {
    type: RECEIVE_CREATE_CLIENT_WORKFLOW
    , id: json.clientWorkflow ? json.clientWorkflow._id : null
    , item: json.clientWorkflow
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreateClientWorkflow(data) {
  return dispatch => {
    dispatch(requestCreateClientWorkflow(data))
    return apiUtils.callAPI('/api/client-workflows', 'POST', data)
      .then(json => dispatch(receiveCreateClientWorkflow(json)))
  }
}

export const REQUEST_CREATE_CLIENT_WORKFLOW_FROM_TEMPLATE = "REQUEST_CREATE_CLIENT_WORKFLOW_FROM_TEMPLATE";
function requestCreateClientWorkflowFromTemplate(clientWorkflow) {
  return {
    type: REQUEST_CREATE_CLIENT_WORKFLOW_FROM_TEMPLATE
    , clientWorkflow
  }
}

export const RECEIVE_CREATE_CLIENT_WORKFLOW_FROM_TEMPLATE = "RECEIVE_CREATE_CLIENT_WORKFLOW_FROM_TEMPLATE";
function receiveCreateClientWorkflowFromTemplate(json) {
  return {
    type: RECEIVE_CREATE_CLIENT_WORKFLOW_FROM_TEMPLATE
    , id: json.clientWorkflow ? json.clientWorkflow._id : null
    , item: json.clientWorkflow
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreateFromTemplate(data) {
  return dispatch => {
    dispatch(requestCreateClientWorkflowFromTemplate(data))
    return apiUtils.callAPI('/api/client-workflows/from-template', 'POST', data)
      .then(json => dispatch(receiveCreateClientWorkflowFromTemplate(json)))
  }
}

export const REQUEST_UPDATE_CLIENT_WORKFLOW = "REQUEST_UPDATE_CLIENT_WORKFLOW";
function requestUpdateClientWorkflow(clientWorkflow) {
  return {
    id: clientWorkflow ? clientWorkflow._id : null
    , clientWorkflow
    , type: REQUEST_UPDATE_CLIENT_WORKFLOW
  }
}

export const RECEIVE_UPDATE_CLIENT_WORKFLOW = "RECEIVE_UPDATE_CLIENT_WORKFLOW";
function receiveUpdateClientWorkflow(json) {
  return {
    type: RECEIVE_UPDATE_CLIENT_WORKFLOW
    , id: json.clientWorkflow ? json.clientWorkflow._id : null
    , item: json.clientWorkflow
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdateClientWorkflow(data) {
  return dispatch => {
    dispatch(requestUpdateClientWorkflow(data))
    return apiUtils.callAPI(`/api/client-workflows/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateClientWorkflow(json)))
  }
}

export const REQUEST_DELETE_CLIENT_WORKFLOW = "REQUEST_DELETE_CLIENT_WORKFLOW";
function requestDeleteClientWorkflow(id) {
  return {
    type: REQUEST_DELETE_CLIENT_WORKFLOW
    , id
  }
}

export const RECEIVE_DELETE_CLIENT_WORKFLOW = "RECEIVE_DELETE_CLIENT_WORKFLOW";
function receiveDeleteClientWorkflow(id, json) {
  return {
    id
    , error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_CLIENT_WORKFLOW
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteClientWorkflow(id))
    return apiUtils.callAPI(`/api/client-workflows/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteClientWorkflow(id, json)))
  }
}


/**
 * CLIENT_WORKFLOW LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest clientWorkflowLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.clientWorkflow.lists, {});
  let list = { ...state.clientWorkflow.lists }
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
    return dispatch(returnClientWorkflowListPromise(...listArgs));
  }
}

export const returnClientWorkflowListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.clientWorkflow.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_CLIENT_WORKFLOW_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_CLIENT_WORKFLOW_LIST = "REQUEST_CLIENT_WORKFLOW_LIST"
function requestClientWorkflowList(listArgs) {
  return {
    type: REQUEST_CLIENT_WORKFLOW_LIST
    , listArgs
  }
}

export const RECEIVE_CLIENT_WORKFLOW_LIST = "RECEIVE_CLIENT_WORKFLOW_LIST"
function receiveClientWorkflowList(json, listArgs) {
  return {
    type: RECEIVE_CLIENT_WORKFLOW_LIST
    , listArgs
    , list: json.clientWorkflows
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const ADD_CLIENT_WORKFLOW_TO_LIST = "ADD_CLIENT_WORKFLOW_TO_LIST";
export function addClientWorkflowToList(id, ...listArgs) {
  // console.log("Add clientWorkflow to list", id);
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: ADD_CLIENT_WORKFLOW_TO_LIST
    , id
    , listArgs
  }
}

export const REMOVE_CLIENT_WORKFLOW_FROM_LIST = "REMOVE_CLIENT_WORKFLOW_FROM_LIST"
export function removeClientWorkflowFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_CLIENT_WORKFLOW_FROM_LIST
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
    dispatch(requestClientWorkflowList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/client-workflows/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/client-workflows/by-[ARG1]/[ARG2]".
     *    ex: /api/client-workflows/by-category/:category
     *  if 2nd arg is an array, though, return "/api/client-workflows/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/client-workflows";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of clientWorkflows given an array of clientWorkflow id's, among other things
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
      json => dispatch(receiveClientWorkflowList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_CLIENT_WORKFLOW_FILTER = "SET_CLIENT_WORKFLOW_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_CLIENT_WORKFLOW_FILTER
    , filter
    , listArgs
  }
}

export const SET_CLIENT_WORKFLOW_PAGINATION = "SET_CLIENT_WORKFLOW_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_CLIENT_WORKFLOW_PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE_CLIENT_WORKFLOW_LIST = "INVALIDATE_CLIENT_WORKFLOW_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE_CLIENT_WORKFLOW_LIST
    , listArgs
  }
}