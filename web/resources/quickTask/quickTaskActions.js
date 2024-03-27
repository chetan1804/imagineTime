/**
 * All quickTask CRUD actions
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
  const { byId, selected } = state.quickTask;
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

export const INVALIDATE_SELECTED_QUICK_TASK = "INVALIDATE_SELECTED_QUICK_TASK"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_QUICK_TASK
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleQuickTaskById(id))
  } else {
    return dispatch(returnSingleQuickTaskPromise(id)); // return promise that contains quickTask
  }
}


export const returnSingleQuickTaskPromise = (id) => (dispatch, getState) => {
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
      , item: getState().quickTask.byId[id]
      , success: true
      , type: "RETURN_SINGLE_QUICK_TASK_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SINGLE_QUICK_TASK = "REQUEST_SINGLE_QUICK_TASK";
function requestSingleQuickTask(id) {
  return {
    id
    , type: REQUEST_SINGLE_QUICK_TASK
  }
}

export const RECEIVE_SINGLE_QUICK_TASK = "RECEIVE_SINGLE_QUICK_TASK";
function receiveSingleQuickTask(json) {
  return {
    error: json.message
    , id: json.quickTask ? json.quickTask._id : null
    , item: json.quickTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SINGLE_QUICK_TASK
  }
}

export function fetchSingleQuickTaskById(id) {
  return dispatch => {
    dispatch(requestSingleQuickTask(id))
    return apiUtils.callAPI(`/api/quick-tasks/${id}`)
      .then(json => dispatch(receiveSingleQuickTask(json)))
  }
}

export const ADD_SINGLE_QUICK_TASK_TO_MAP = "ADD_SINGLE_QUICK_TASK_TO_MAP";
export function addSingleQuickTaskToMap(item) {
  return {
    item
    , type: ADD_SINGLE_QUICK_TASK_TO_MAP
  }
}

export const SET_SELECTED_QUICK_TASK = "SET_SELECTED_QUICK_TASK";
export function setSelectedQuickTask(item) {
  return {
    type: SET_SELECTED_QUICK_TASK
    , item
  }
}

export const REQUEST_DEFAULT_QUICK_TASK = "REQUEST_DEFAULT_QUICK_TASK";
function requestDefaultQuickTask(id) {
  return {
    type: REQUEST_DEFAULT_QUICK_TASK
  }
}

export const RECEIVE_DEFAULT_QUICK_TASK = "RECEIVE_DEFAULT_QUICK_TASK";
function receiveDefaultQuickTask(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_QUICK_TASK
  }
}

export function fetchDefaultQuickTask() {
  return dispatch => {
    dispatch(requestDefaultQuickTask())
    return apiUtils.callAPI(`/api/quick-tasks/default`)
      .then(json => dispatch(receiveDefaultQuickTask(json)))
  }
}

export const REQUEST_QUICK_TASK_SCHEMA = "REQUEST_QUICK_TASK_SCHEMA";
function requestQuickTaskSchema(id) {
  return {
    type: REQUEST_QUICK_TASK_SCHEMA
  }
}
 export const RECEIVE_QUICK_TASK_SCHEMA = "RECEIVE_QUICK_TASK_SCHEMA";
function receiveQuickTaskSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_QUICK_TASK_SCHEMA
  }
}
 export function fetchQuickTaskSchema() {
  return dispatch => {
    dispatch(requestQuickTaskSchema())
    return apiUtils.callAPI(`/api/quick-tasks/schema`)
      .then(json => dispatch(receiveQuickTaskSchema(json)))
  }
}

export const REQUEST_CREATE_QUICK_TASK = "REQUEST_CREATE_QUICK_TASK";
function requestCreateQuickTask(quickTask) {
  return {
    quickTask
    , type: REQUEST_CREATE_QUICK_TASK
  }
}

export const RECEIVE_CREATE_QUICK_TASK = "RECEIVE_CREATE_QUICK_TASK";
function receiveCreateQuickTask(json) {
  return {
    error: json.message
    , id: json.quickTask ? json.quickTask._id : null
    , item: json.quickTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_CREATE_QUICK_TASK
  }
}

export function sendCreateQuickTask(data) {
  return dispatch => {
    dispatch(requestCreateQuickTask(data))
    return apiUtils.callAPI('/api/quick-tasks', 'POST', data)
      .then(json => dispatch(receiveCreateQuickTask(json)))
  }
}

export const REQUEST_UPDATE_QUICK_TASK = "REQUEST_UPDATE_QUICK_TASK";
function requestUpdateQuickTask(quickTask) {
  return {
    id: quickTask ? quickTask._id: null
    , quickTask
    , type: REQUEST_UPDATE_QUICK_TASK
  }
}

export const RECEIVE_UPDATE_QUICK_TASK = "RECEIVE_UPDATE_QUICK_TASK";
function receiveUpdateQuickTask(json) {
  return {
    error: json.message
    , id: json.quickTask ? json.quickTask._id : null
    , item: json.quickTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_UPDATE_QUICK_TASK
  }
}

export function sendUpdateQuickTask(data) {
  return dispatch => {
    dispatch(requestUpdateQuickTask(data))
    return apiUtils.callAPI(`/api/quick-tasks/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateQuickTask(json)))
  }
}

export function sendUpdateQuickTaskWithPermission(data) {
  return dispatch => {
    dispatch(requestUpdateQuickTask(data))
    return apiUtils.callAPI(`/api/quick-tasks/with-permission/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateQuickTask(json)))
  }
}

export const REQUEST_DELETE_QUICK_TASK = "REQUEST_DELETE_QUICK_TASK";
function requestDeleteQuickTask(id) {
  return {
    id
    , type: REQUEST_DELETE_QUICK_TASK
  }
}

export const RECEIVE_DELETE_QUICK_TASK = "RECEIVE_DELETE_QUICK_TASK";
function receiveDeleteQuickTask(id, json) {
  return {
    error: json.message
    , id
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_QUICK_TASK
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteQuickTask(id))
    return apiUtils.callAPI(`/api/quick-tasks/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteQuickTask(id, json)))
  }
}


/**
 * LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest quickTaskLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.quickTask.lists, {});
  let list = { ...state.quickTask.lists }
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
    return dispatch(returnQuickTaskListPromise(...listArgs));
  }
}

export const returnQuickTaskListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.quickTask.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_QUICK_TASK_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_QUICK_TASK_LIST = "REQUEST_QUICK_TASK_LIST"
function requestQuickTaskList(listArgs) {
  return {
    listArgs
    , type: REQUEST_QUICK_TASK_LIST
  }
}

export const RECEIVE_QUICK_TASK_LIST = "RECEIVE_QUICK_TASK_LIST"
function receiveQuickTaskList(json, listArgs) {
  return {
    error: json.message
    , list: json.quickTasks
    , listArgs
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_QUICK_TASK_LIST
  }
}

export const ADD_QUICK_TASK_TO_LIST = "ADD_QUICK_TASK_TO_LIST";
export function addQuickTaskToList(item, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  // allow user to either send the entire object or just the _id
  if(typeof(item) === 'string') {
    return {
      type: ADD_QUICK_TASK_TO_LIST
      , id: item
      , listArgs
    }
  } else {
    return {
      type: ADD_QUICK_TASK_TO_LIST
      , id: item._id
      , listArgs
    }
  }
}

export const REMOVE_QUICK_TASK_FROM_LIST = "REMOVE_QUICK_TASK_FROM_LIST"
export function removeQuickTaskFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_QUICK_TASK_FROM_LIST
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
    dispatch(requestQuickTaskList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/quick-tasks/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/quick-tasks/by-[ARG1]/[ARG2]".
     *    ex: /api/quick-tasks/by-category/:category
     *  if 2nd arg is an array, though, return "/api/quick-tasks/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/quick-tasks";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of quickTasks given an array of quickTask id's, among other things
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
      json => dispatch(receiveQuickTaskList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_QUICK_TASK_FILTER = "SET_QUICK_TASK_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    filter
    , listArgs
    , type: SET_QUICK_TASK_FILTER
  }
}

export const SET_QUICK_TASK_PAGINATION = "SET_QUICK_TASK_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , pagination
    , type: SET_QUICK_TASK_PAGINATION
  }
}

export const INVALIDATE_QUICK_TASK_LIST = "INVALIDATE_QUICK_TASK_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    listArgs
    , type: INVALIDATE_QUICK_TASK_LIST
  }
}

// CUSTOM ACTIONS

export const REQUEST_GET_TEMPLATE_BY_ID = "REQUEST_GET_TEMPLATE_BY_ID";
function requestGetTemplateById(firmId, templateId) {
  return {
    templateId: templateId ? templateId : null
    , type: REQUEST_GET_TEMPLATE_BY_ID
  }
}

export const RECEIVE_GET_TEMPLATE_BY_ID = "RECEIVE_GET_TEMPLATE_BY_ID";
function receiveGetTemplateById(json) {
  return {
    error: json.message
    , item: json.template
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_GET_TEMPLATE_BY_ID
  }
}

export function sendGetTemplateById(firmId, templateId) {
  return dispatch => {
    dispatch(requestGetTemplateById(firmId, templateId))
    return apiUtils.callAPI(`/api/quick-tasks/${firmId}/${templateId}`)
      .then(json => dispatch(receiveGetTemplateById(json)))
  }
}

export const REQUEST_FINALIZE_QUICK_TASK_SIGNATURE = "REQUEST_FINALIZE_QUICK_TASK_SIGNATURE";
function requestFinalizeQuickTaskSignature(quickTaskId) {
  return {
    id: quickTaskId ? quickTaskId: null
    , type: REQUEST_FINALIZE_QUICK_TASK_SIGNATURE
  }
}

export const RECEIVE_FINALIZE_QUICK_TASK_SIGNATURE = "RECEIVE_FINALIZE_QUICK_TASK_SIGNATURE";
function receiveFinalizeQuickTaskSignature(json) {
  return {
    error: json.message
    , id: json.quickTask ? json.quickTask._id : null
    , item: json.quickTask
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_FINALIZE_QUICK_TASK_SIGNATURE
    , signedFile: json.file ? json.file : null
  }
}

export function sendFinalizeSignature(data) {
  return dispatch => {
    dispatch(requestFinalizeQuickTaskSignature(data._id))
    return apiUtils.callAPI(`/api/quick-tasks/${data._id}/finalize-signature`, 'PUT', data)
      .then(json => dispatch(receiveFinalizeQuickTaskSignature(json)))
  }
}

export const RECEIVE_SIGNATURE_REMINDER = "RECEIVE_SIGNATURE_REMINDER";
function receiveSignatureReminder(json) {
  return {
    error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_SIGNATURE_REMINDER
  }
}
export function sendSignatureReminder(quickTaskId) {
  return dispatch => {
    return apiUtils.callAPI(`/api/quick-tasks/signature-reminder/${quickTaskId}`, 'POST', {})
      .then(json => dispatch(receiveSignatureReminder(json)))
  }
}

export function currentSigner(data) {
  const { quickTask } = data
  return dispatch => {
    dispatch(requestUpdateQuickTask(data))
    return apiUtils.callAPI(`/api/quick-tasks/current-signer/${quickTask._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateQuickTask(json)))
  }
}

export const RECEIVE_REQUEST_FILE_REMINDER = "RECEIVE_REQUEST_FILE_REMINDER";
function receiveRequestFileReminder(json) {
  return {
    error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_REQUEST_FILE_REMINDER
  }
}

export function sendRequestFileReminder(quickTaskId) {
  return dispatch => {
    return apiUtils.callAPI(`/api/quick-tasks/request-file-reminder/${quickTaskId}`, 'POST', {})
      .then(json => dispatch(receiveRequestFileReminder(json)))
  }
}