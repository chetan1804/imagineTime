/**
 * All documentTemplate CRUD actions
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
  const { byId, selected } = state.documentTemplate;
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

export const INVALIDATE_SELECTED_DOCUMENT_TEMPLATE = "INVALIDATE_SELECTED_DOCUMENT_TEMPLATE"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_DOCUMENT_TEMPLATE
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingledocumentTemplateById(id))
  } else {
    return dispatch(returnSingledocumentTemplatePromise(id)); // return promise that contains documentTemplate
  }
}


export const returnSingledocumentTemplatePromise = (id) => (dispatch, getState) => {
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
      , item: getState().documentTemplate.byId[id]
      , success: true
      , type: "RETURN_SINGLE_DOCUMENT_TEMPLATE_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_DOCUMENT_TEMPLATE = "REQUEST_SINGLE_DOCUMENT_TEMPLATE";
function requestSingledocumentTemplate(id) {
  return {
    id
    , type: REQUEST_SINGLE_DOCUMENT_TEMPLATE
  }
}

export const RECEIVE_SINGLE_DOCUMENT_TEMPLATE = "RECEIVE_SINGLE_DOCUMENT_TEMPLATE";
function receiveSingledocumentTemplate(json) {
  return {
    error: json.message
    , id: json.documentTemplate ? json.documentTemplate._id : null
    , item: json.documentTemplate
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_DOCUMENT_TEMPLATE
  }
}

export function fetchSingledocumentTemplateById(id) {
  return dispatch => {
    dispatch(requestSingledocumentTemplate(id))
    return apiUtils.callAPI(`/api/document-templates/${id}`)
      .then(json => dispatch(receiveSingledocumentTemplate(json)))
  }
}

export const ADD_SINGLE_DOCUMENT_TEMPLATE_TO_MAP = "ADD_SINGLE_DOCUMENT_TEMPLATE_TO_MAP";
export function addSingledocumentTemplateToMap(item) {
  return {
    item
    , type: ADD_SINGLE_DOCUMENT_TEMPLATE_TO_MAP
  }
}

export const SET_SELECTED_DOCUMENT_TEMPLATE = "SET_SELECTED_DOCUMENT_TEMPLATE";
export function setSelecteddocumentTemplate(item) {
  return {
    type: SET_SELECTED_DOCUMENT_TEMPLATE
    , item
  }
}

export const REQUEST_DEFAULT_DOCUMENT_TEMPLATE = "REQUEST_DEFAULT_DOCUMENT_TEMPLATE";
function requestDefaultdocumentTemplate(id) {
  return {
    type: REQUEST_DEFAULT_DOCUMENT_TEMPLATE
  }
}

export const RECEIVE_DEFAULT_DOCUMENT_TEMPLATE = "RECEIVE_DEFAULT_DOCUMENT_TEMPLATE";
function receiveDefaultdocumentTemplate(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_DOCUMENT_TEMPLATE
  }
}

export function fetchDefaultdocumentTemplate() {
  return dispatch => {
    dispatch(requestDefaultdocumentTemplate())
    return apiUtils.callAPI(`/api/document-templates/default`)
      .then(json => dispatch(receiveDefaultdocumentTemplate(json)))
  }
}

export const REQUEST_DOCUMENT_TEMPLATE_SCHEMA = "REQUEST_DOCUMENT_TEMPLATE_SCHEMA";
function requestdocumentTemplateSchema(id) {
  return {
    type: REQUEST_DOCUMENT_TEMPLATE_SCHEMA
  }
}
 export const RECEIVE_DOCUMENT_TEMPLATE_SCHEMA = "RECEIVE_DOCUMENT_TEMPLATE_SCHEMA";
function receivedocumentTemplateSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DOCUMENT_TEMPLATE_SCHEMA
  }
}
 export function fetchdocumentTemplateSchema() {
  return dispatch => {
    dispatch(requestdocumentTemplateSchema())
    return apiUtils.callAPI(`/api/document-templates/schema`)
      .then(json => dispatch(receivedocumentTemplateSchema(json)))
  }
}

export const REQUEST_CREATE_DOCUMENT_TEMPLATE = "REQUEST_CREATE_DOCUMENT_TEMPLATE";
function requestCreatedocumentTemplate(documentTemplate) {
  return {
    documentTemplate
    , type: REQUEST_CREATE_DOCUMENT_TEMPLATE
  }
}

export const RECEIVE_CREATE_DOCUMENT_TEMPLATE = "RECEIVE_CREATE_DOCUMENT_TEMPLATE";
function receiveCreatedocumentTemplate(json) {
  return {
    error: json.message
    , id: json.documentTemplate ? json.documentTemplate._id : null
    , item: json.documentTemplate
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_DOCUMENT_TEMPLATE
  }
}

export function sendCreatedocumentTemplate(data) {
  return dispatch => {
    dispatch(requestCreatedocumentTemplate(data))
    return apiUtils.callAPI('/api/document-templates', 'POST', data)
      .then(json => dispatch(receiveCreatedocumentTemplate(json)))
  }
}

export const REQUEST_UPDATE_DOCUMENT_TEMPLATE = "REQUEST_UPDATE_DOCUMENT_TEMPLATE";
function requestUpdatedocumentTemplate(documentTemplate) {
  return {
    id: documentTemplate ? documentTemplate._id: null
    , documentTemplate
    , type: REQUEST_UPDATE_DOCUMENT_TEMPLATE
  }
}

export const RECEIVE_UPDATE_DOCUMENT_TEMPLATE = "RECEIVE_UPDATE_DOCUMENT_TEMPLATE";
function receiveUpdatedocumentTemplate(json) {
  return {
    error: json.message
    , id: json.documentTemplate ? json.documentTemplate._id : null
    , item: json.documentTemplate
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_DOCUMENT_TEMPLATE
  }
}

export function sendUpdatedocumentTemplate(data) {
  return dispatch => {
    dispatch(requestUpdatedocumentTemplate(data))
    return apiUtils.callAPI(`/api/document-templates/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdatedocumentTemplate(json)))
  }
}

export const REQUEST_DELETE_DOCUMENT_TEMPLATE = "REQUEST_DELETE_DOCUMENT_TEMPLATE";
function requestDeletedocumentTemplate(id) {
  return {
    id
    , type: REQUEST_DELETE_DOCUMENT_TEMPLATE
  }
}

export const RECEIVE_DELETE_DOCUMENT_TEMPLATE = "RECEIVE_DELETE_DOCUMENT_TEMPLATE";
function receiveDeletedocumentTemplate(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_DOCUMENT_TEMPLATE
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeletedocumentTemplate(id))
    return apiUtils.callAPI(`/api/document-templates/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeletedocumentTemplate(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest documentTemplateLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.documentTemplate.lists, {});
  let list = { ...state.documentTemplate.lists }
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
    return dispatch(returndocumentTemplateListPromise(...listArgs));
  }
}

export const returndocumentTemplateListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.documentTemplate.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_DOCUMENT_TEMPLATE_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_DOCUMENT_TEMPLATE_LIST = "REQUEST_DOCUMENT_TEMPLATE_LIST"
function requestdocumentTemplateList(listArgs) {
  return {
    listArgs
    , type: REQUEST_DOCUMENT_TEMPLATE_LIST
  }
}

export const RECEIVE_DOCUMENT_TEMPLATE_LIST = "RECEIVE_DOCUMENT_TEMPLATE_LIST"
function receivedocumentTemplateList(json, listArgs) {
  return {
    error: json.message
    , list: json.documentTemplates
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DOCUMENT_TEMPLATE_LIST
  }
}

export const ADD_DOCUMENT_TEMPLATE_TO_LIST = "ADD_DOCUMENT_TEMPLATE_TO_LIST";
export function addDocumentTemplateToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string' || typeof(item) === 'number') {
    return {
      type: ADD_DOCUMENT_TEMPLATE_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_DOCUMENT_TEMPLATE_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_DOCUMENT_TEMPLATE_FROM_LIST = "REMOVE_DOCUMENT_TEMPLATE_FROM_LIST"
export function removedocumentTemplateFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_DOCUMENT_TEMPLATE_FROM_LIST
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
    dispatch(requestdocumentTemplateList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/document-templates/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/document-templates/by-[ARG1]/[ARG2]".
     *    ex: /api/document-templates/by-category/:category
     *  if 2nd arg is an array, though, return "/api/document-templates/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/document-templates";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of documentTemplates given an array of documentTemplate id's, among other things
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
      json => dispatch(receivedocumentTemplateList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_DOCUMENT_TEMPLATE_FILTER = "SET_DOCUMENT_TEMPLATE_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_DOCUMENT_TEMPLATE_FILTER
  }
}

export const SET_DOCUMENT_TEMPLATE_PAGINATION = "SET_DOCUMENT_TEMPLATE_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_DOCUMENT_TEMPLATE_PAGINATION
  }
}

export const INVALIDATE_DOCUMENT_TEMPLATE_LIST = "INVALIDATE_DOCUMENT_TEMPLATE_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_DOCUMENT_TEMPLATE_LIST
  }
}

export const SET_DOCUMENT_TEMPLATE_QUERY = "SET_DOCUMENT_TEMPLATE_QUERY"
export function setQuery(query, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_DOCUMENT_TEMPLATE_QUERY
    , query
    , listArgs
  }
}

export function sendPDFUploadTemplates(data) {
  return dispatch => {
    dispatch(requestCreatedocumentTemplate(data))
    return fetch('/api/document-templates/pdf-upload', {
      method: 'POST'
      , headers: {}
      , credentials: 'same-origin'
      , body: data // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => {
      // console.log("TESTING", response)
      if(response && response.status == 503) {
        // server timeout or related error, need to catch for it somehow
        return {
          success: false
          , message: "Server connection error. Please try refreshing the page and check your internet connection. If issue persists, please contact an admin."
        }
      } else {
        return response;
      }
    })
    .then(response => typeof(response.json) == 'function' ? response.json() : response)
    .then(json => dispatch(receiveCreatedocumentTemplate(json)))
  }
}

export function sendUploadTemplates(data) {
  return dispatch => {
    dispatch(requestCreatedocumentTemplate(data))
    return fetch('/api/document-templates/upload', {
      method: 'POST'
      , headers: {}
      , credentials: 'same-origin'
      , body: data // using raw fetch because body is NOT json.stringified! only for file upload
    })
    .then(response => {
      // console.log("TESTING", response)
      if(response && response.status == 503) {
        // server timeout or related error, need to catch for it somehow
        return {
          success: false
          , message: "Server connection error. Please try refreshing the page and check your internet connection. If issue persists, please contact an admin."
        }
      } else {
        return response;
      }
    })
    .then(response => typeof(response.json) == 'function' ? response.json() : response)
    .then(json => dispatch(receiveCreatedocumentTemplate(json)))
  }
}

export const REQUEST_APPLY_FOLDER_TEMPLATE = "REQUEST_APPLY_FOLDER_TEMPLATE";
function requestApplyDocumentTemplate(folderTemplate) {
  return {
    type: REQUEST_APPLY_FOLDER_TEMPLATE
  }
}

export const RECEIVE_APPLY_FOLDER_TEMPLATE = "RECEIVE_APPLY_FOLDER_TEMPLATE";
function receiveApplyDocumentTemplate(json) {
  return {
    error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_APPLY_FOLDER_TEMPLATE
    , objFiles: json.objFiles
  }
}

export function sendApplyDocumentTemplate(data) {
  return dispatch => {
    dispatch(requestApplyDocumentTemplate(data))
    return apiUtils.callAPI("/api/document-templates/apply", 'POST', data)
      .then(json => dispatch(receiveApplyDocumentTemplate(json)))
  }
}