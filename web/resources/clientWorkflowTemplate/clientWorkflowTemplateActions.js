/**
 * All ClientWorkflowTemplate CRUD actions
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
  const { byId, selected } = state.clientWorkflowTemplate;
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

export const INVALIDATE_SELECTED_CLIENT_WORKFLOW_TEMPLATE = "INVALIDATE_SELECTED_CLIENT_WORKFLOW_TEMPLATE"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_CLIENT_WORKFLOW_TEMPLATE
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleClientWorkflowTemplateById(id))
  } else {
    return dispatch(returnSingleClientWorkflowTemplatePromise(id)); // return promise that contains clientWorkflowTemplate
  }
}

export const returnSingleClientWorkflowTemplatePromise = (id) => (dispatch, getState) => {
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
      type: "RETURN_SINGLE_CLIENT_WORKFLOW_TEMPLATE_WITHOUT_FETCHING"
      , id: id
      , item: getState().clientWorkflowTemplate.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE_CLIENT_WORKFLOW_TEMPLATE = "REQUEST_SINGLE_CLIENT_WORKFLOW_TEMPLATE";
function requestSingleClientWorkflowTemplate(id) {
  return {
    type: REQUEST_SINGLE_CLIENT_WORKFLOW_TEMPLATE
    , id
  }
}

export const RECEIVE_SINGLE_CLIENT_WORKFLOW_TEMPLATE = "RECEIVE_SINGLE_CLIENT_WORKFLOW_TEMPLATE";
function receiveSingleClientWorkflowTemplate(json) {
  return {
    type: RECEIVE_SINGLE_CLIENT_WORKFLOW_TEMPLATE
    , id: json.clientWorkflowTemplate ? json.clientWorkflowTemplate._id : null
    , item: json.clientWorkflowTemplate
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSingleClientWorkflowTemplateById(clientWorkflowTemplateId) {
  return dispatch => {
    dispatch(requestSingleClientWorkflowTemplate(clientWorkflowTemplateId))
    return apiUtils.callAPI(`/api/client-workflow-templates/${clientWorkflowTemplateId}`)
      .then(json => dispatch(receiveSingleClientWorkflowTemplate(json)))
  }
}

export const ADD_SINGLE_CLIENT_WORKFLOW_TEMPLATE_TO_MAP = "ADD_SINGLE_CLIENT_WORKFLOW_TEMPLATE_TO_MAP";
export function addSingleClientWorkflowTemplateToMap(item) {
  return {
    type: ADD_SINGLE_CLIENT_WORKFLOW_TEMPLATE_TO_MAP
    , item
  }
}

export const SET_SELECTED_CLIENT_WORKFLOW_TEMPLATE = "SET_SELECTED_CLIENT_WORKFLOW_TEMPLATE";
export function setSelectedClientWorkflowTemplate(item) {
  return {
    type: SET_SELECTED_CLIENT_WORKFLOW_TEMPLATE
    , item
  }
}


export const REQUEST_DEFAULT_CLIENT_WORKFLOW_TEMPLATE = "REQUEST_DEFAULT_CLIENT_WORKFLOW_TEMPLATE";
function requestDefaultClientWorkflowTemplate(id) {
  return {
    type: REQUEST_DEFAULT_CLIENT_WORKFLOW_TEMPLATE
  }
}

export const RECEIVE_DEFAULT_CLIENT_WORKFLOW_TEMPLATE = "RECEIVE_DEFAULT_CLIENT_WORKFLOW_TEMPLATE";
function receiveDefaultClientWorkflowTemplate(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_CLIENT_WORKFLOW_TEMPLATE
  }
}

export function fetchDefaultClientWorkflowTemplate() {
  return dispatch => {
    dispatch(requestDefaultClientWorkflowTemplate())
    return apiUtils.callAPI(`/api/client-workflow-templates/default`)
      .then(json => dispatch(receiveDefaultClientWorkflowTemplate(json)))
  }
}


export const REQUESTCLIENT_WORKFLOW_TEMPLATE_SCHEMA = "REQUESTCLIENT_WORKFLOW_TEMPLATE_SCHEMA";
function requestClientWorkflowTemplateSchema(id) {
  return {
    type: REQUESTCLIENT_WORKFLOW_TEMPLATE_SCHEMA
  }
}

export const RECEIVECLIENT_WORKFLOW_TEMPLATE_SCHEMA = "RECEIVECLIENT_WORKFLOW_TEMPLATE_SCHEMA";
function receiveClientWorkflowTemplateSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVECLIENT_WORKFLOW_TEMPLATE_SCHEMA
  }
}

export function fetchClientWorkflowTemplateSchema() {
  return dispatch => {
    dispatch(requestClientWorkflowTemplateSchema())
    return apiUtils.callAPI(`/api/client-workflow-templates/schema`)
      .then(json => dispatch(receiveClientWorkflowTemplateSchema(json)))
  }
}


export const REQUEST_CREATE_CLIENT_WORKFLOW_TEMPLATE = "REQUEST_CREATE_CLIENT_WORKFLOW_TEMPLATE";
function requestCreateClientWorkflowTemplate(clientWorkflowTemplate) {
  return {
    type: REQUEST_CREATE_CLIENT_WORKFLOW_TEMPLATE
    , clientWorkflowTemplate
  }
}

export const RECEIVE_CREATE_CLIENT_WORKFLOW_TEMPLATE = "RECEIVE_CREATE_CLIENT_WORKFLOW_TEMPLATE";
function receiveCreateClientWorkflowTemplate(json) {
  return {
    type: RECEIVE_CREATE_CLIENT_WORKFLOW_TEMPLATE
    , id: json.clientWorkflowTemplate ? json.clientWorkflowTemplate._id : null
    , item: json.clientWorkflowTemplate
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreateClientWorkflowTemplate(data) {
  return dispatch => {
    dispatch(requestCreateClientWorkflowTemplate(data))
    return apiUtils.callAPI('/api/client-workflow-templates', 'POST', data)
      .then(json => dispatch(receiveCreateClientWorkflowTemplate(json)))
  }
}

export const REQUEST_UPDATE_CLIENT_WORKFLOW_TEMPLATE = "REQUEST_UPDATE_CLIENT_WORKFLOW_TEMPLATE";
function requestUpdateClientWorkflowTemplate(clientWorkflowTemplate) {
  return {
    id: clientWorkflowTemplate ? clientWorkflowTemplate._id : null
    , clientWorkflowTemplate
    , type: REQUEST_UPDATE_CLIENT_WORKFLOW_TEMPLATE
  }
}

export const RECEIVE_UPDATE_CLIENT_WORKFLOW_TEMPLATE = "RECEIVE_UPDATE_CLIENT_WORKFLOW_TEMPLATE";
function receiveUpdateClientWorkflowTemplate(json) {
  return {
    type: RECEIVE_UPDATE_CLIENT_WORKFLOW_TEMPLATE
    , id: json.clientWorkflowTemplate ? json.clientWorkflowTemplate._id : null
    , item: json.clientWorkflowTemplate
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdateClientWorkflowTemplate(data) {
  return dispatch => {
    dispatch(requestUpdateClientWorkflowTemplate(data))
    return apiUtils.callAPI(`/api/client-workflow-templates/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateClientWorkflowTemplate(json)))
  }
}

export const REQUEST_DELETE_CLIENT_WORKFLOW_TEMPLATE = "REQUEST_DELETE_CLIENT_WORKFLOW_TEMPLATE";
function requestDeleteClientWorkflowTemplate(id) {
  return {
    type: REQUEST_DELETE_CLIENT_WORKFLOW_TEMPLATE
    , id
  }
}

export const RECEIVE_DELETE_CLIENT_WORKFLOW_TEMPLATE = "RECEIVE_DELETE_CLIENT_WORKFLOW_TEMPLATE";
function receiveDeleteClientWorkflowTemplate(id, json) {
  return {
    id
    , error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_CLIENT_WORKFLOW_TEMPLATE
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteClientWorkflowTemplate(id))
    return apiUtils.callAPI(`/api/client-workflow-templates/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteClientWorkflowTemplate(id, json)))
  }
}


/**
 * CLIENT_WORKFLOW_TEMPLATE LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest clientWorkflowTemplateLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.clientWorkflowTemplate.lists, {});
  let list = { ...state.clientWorkflowTemplate.lists }
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
    return dispatch(returnClientWorkflowTemplateListPromise(...listArgs));
  }
}

export const returnClientWorkflowTemplateListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.clientWorkflowTemplate.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_CLIENT_WORKFLOW_TEMPLATE_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_CLIENT_WORKFLOW_TEMPLATE_LIST = "REQUEST_CLIENT_WORKFLOW_TEMPLATE_LIST"
function requestClientWorkflowTemplateList(listArgs) {
  return {
    type: REQUEST_CLIENT_WORKFLOW_TEMPLATE_LIST
    , listArgs
  }
}

export const RECEIVE_CLIENT_WORKFLOW_TEMPLATE_LIST = "RECEIVE_CLIENT_WORKFLOW_TEMPLATE_LIST"
function receiveClientWorkflowTemplateList(json, listArgs) {
  return {
    type: RECEIVE_CLIENT_WORKFLOW_TEMPLATE_LIST
    , listArgs
    , list: json.clientWorkflowTemplates
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const ADD_CLIENT_WORKFLOW_TEMPLATE_TO_LIST = "ADD_CLIENT_WORKFLOW_TEMPLATE_TO_LIST";
export function addClientWorkflowTemplateToList(id, ...listArgs) {
  // console.log("Add clientWorkflowTemplate to list", id);
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: ADD_CLIENT_WORKFLOW_TEMPLATE_TO_LIST
    , id
    , listArgs
  }
}

export const REMOVE_CLIENT_WORKFLOW_TEMPLATE_FROM_LIST = "REMOVE_CLIENT_WORKFLOW_TEMPLATE_FROM_LIST"
export function removeClientWorkflowTemplateFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_CLIENT_WORKFLOW_TEMPLATE_FROM_LIST
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
    dispatch(requestClientWorkflowTemplateList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/client-workflow-templates/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/client-workflow-templates/by-[ARG1]/[ARG2]".
     *    ex: /api/client-workflow-templates/by-category/:category
     *  if 2nd arg is an array, though, return "/api/client-workflow-templates/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/client-workflow-templates";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of clientWorkflowTemplates given an array of clientWorkflowTemplate id's, among other things
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
      json => dispatch(receiveClientWorkflowTemplateList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_CLIENT_WORKFLOW_TEMPLATE_FILTER = "SET_CLIENT_WORKFLOW_TEMPLATE_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_CLIENT_WORKFLOW_TEMPLATE_FILTER
    , filter
    , listArgs
  }
}

export const SET_CLIENT_WORKFLOW_TEMPLATE_PAGINATION = "SET_CLIENT_WORKFLOW_TEMPLATE_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_CLIENT_WORKFLOW_TEMPLATE_PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE_CLIENT_WORKFLOW_TEMPLATE_LIST = "INVALIDATE_CLIENT_WORKFLOW_TEMPLATE_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE_CLIENT_WORKFLOW_TEMPLATE_LIST
    , listArgs
  }
}
