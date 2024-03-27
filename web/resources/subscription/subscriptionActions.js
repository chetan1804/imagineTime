/**
 * All Subscription CRUD actions
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
  const { byId, selected } = state.subscription;
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

export const INVALIDATE_SELECTED_SUBSCRIPTION = "INVALIDATE_SELECTED_SUBSCRIPTION"
export function invalidateSelected() {
  return {
    type: INVALIDATE_SELECTED_SUBSCRIPTION
  }
}

export const fetchSingleIfNeeded = (id) => (dispatch, getState) => {
  if (shouldFetchSingle(getState(), id)) {
    return dispatch(fetchSingleSubscriptionById(id))
  } else {
    return dispatch(returnSingleSubscriptionPromise(id)); // return promise that contains subscription
  }
}

export const returnSingleSubscriptionPromise = (id) => (dispatch, getState) => {
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
      type: "RETURN_SINGLE_SUBSCRIPTION_WITHOUT_FETCHING"
      , id: id
      , item: getState().subscription.byId[id]
      , success: true
    })
  });
}

export const REQUEST_SINGLE_SUBSCRIPTION = "REQUEST_SINGLE_SUBSCRIPTION";
function requestSingleSubscription(id) {
  return {
    type: REQUEST_SINGLE_SUBSCRIPTION
    , id
  }
}

export const RECEIVE_SINGLE_SUBSCRIPTION = "RECEIVE_SINGLE_SUBSCRIPTION";
function receiveSingleSubscription(json) {
  return {
    type: RECEIVE_SINGLE_SUBSCRIPTION
    , id: json.subscription ? json.subscription._id : null
    , item: json.subscription
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function fetchSingleSubscriptionById(subscriptionId) {
  return dispatch => {
    dispatch(requestSingleSubscription(subscriptionId))
    return apiUtils.callAPI(`/api/subscriptions/${subscriptionId}`)
      .then(json => dispatch(receiveSingleSubscription(json)))
  }
}

export const ADD_SINGLE_SUBSCRIPTION_TO_MAP = "ADD_SINGLE_SUBSCRIPTION_TO_MAP";
export function addSingleSubscriptionToMap(item) {
  return {
    type: ADD_SINGLE_SUBSCRIPTION_TO_MAP
    , item
  }
}

export const SET_SELECTED_SUBSCRIPTION = "SET_SELECTED_SUBSCRIPTION";
export function setSelectedSubscription(item) {
  return {
    type: SET_SELECTED_SUBSCRIPTION
    , item
  }
}


export const REQUEST_DEFAULT_SUBSCRIPTION = "REQUEST_DEFAULT_SUBSCRIPTION";
function requestDefaultSubscription(id) {
  return {
    type: REQUEST_DEFAULT_SUBSCRIPTION
  }
}

export const RECEIVE_DEFAULT_SUBSCRIPTION = "RECEIVE_DEFAULT_SUBSCRIPTION";
function receiveDefaultSubscription(json) {
  return {
    error: json.message
    , defaultObj: json.defaultObj
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DEFAULT_SUBSCRIPTION
  }
}

export function fetchDefaultSubscription() {
  return dispatch => {
    dispatch(requestDefaultSubscription())
    return apiUtils.callAPI(`/api/subscriptions/default`)
      .then(json => dispatch(receiveDefaultSubscription(json)))
  }
}


export const REQUESTSUBSCRIPTION_SCHEMA = "REQUESTSUBSCRIPTION_SCHEMA";
function requestSubscriptionSchema(id) {
  return {
    type: REQUESTSUBSCRIPTION_SCHEMA
  }
}

export const RECEIVESUBSCRIPTION_SCHEMA = "RECEIVESUBSCRIPTION_SCHEMA";
function receiveSubscriptionSchema(json) {
  return {
    error: json.message
    , schema: json.schema
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVESUBSCRIPTION_SCHEMA
  }
}

export function fetchSubscriptionSchema() {
  return dispatch => {
    dispatch(requestSubscriptionSchema())
    return apiUtils.callAPI(`/api/subscriptions/schema`)
      .then(json => dispatch(receiveSubscriptionSchema(json)))
  }
}


export const REQUEST_CREATE_SUBSCRIPTION = "REQUEST_CREATE_SUBSCRIPTION";
function requestCreateSubscription(subscription) {
  return {
    type: REQUEST_CREATE_SUBSCRIPTION
    , subscription
  }
}

export const RECEIVE_CREATE_SUBSCRIPTION = "RECEIVE_CREATE_SUBSCRIPTION";
function receiveCreateSubscription(json) {
  return {
    type: RECEIVE_CREATE_SUBSCRIPTION
    , id: json.subscription ? json.subscription._id : null
    , item: json.subscription
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendCreateSubscription(data) {
  return dispatch => {
    dispatch(requestCreateSubscription(data))
    return apiUtils.callAPI('/api/subscriptions', 'POST', data)
      .then(json => dispatch(receiveCreateSubscription(json)))
  }
}

export const REQUEST_UPDATE_SUBSCRIPTION = "REQUEST_UPDATE_SUBSCRIPTION";
function requestUpdateSubscription(subscription) {
  return {
    id: subscription ? subscription._id : null
    , subscription
    , type: REQUEST_UPDATE_SUBSCRIPTION
  }
}

export const RECEIVE_UPDATE_SUBSCRIPTION = "RECEIVE_UPDATE_SUBSCRIPTION";
function receiveUpdateSubscription(json) {
  return {
    type: RECEIVE_UPDATE_SUBSCRIPTION
    , id: json.subscription ? json.subscription._id : null
    , item: json.subscription
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export function sendUpdateSubscription(data) {
  return dispatch => {
    dispatch(requestUpdateSubscription(data))
    return apiUtils.callAPI(`/api/subscriptions/${data._id}`, 'PUT', data)
      .then(json => dispatch(receiveUpdateSubscription(json)))
  }
}

export const REQUEST_DELETE_SUBSCRIPTION = "REQUEST_DELETE_SUBSCRIPTION";
function requestDeleteSubscription(id) {
  return {
    type: REQUEST_DELETE_SUBSCRIPTION
    , id
  }
}

export const RECEIVE_DELETE_SUBSCRIPTION = "RECEIVE_DELETE_SUBSCRIPTION";
function receiveDeleteSubscription(id, json) {
  return {
    id
    , error: json.message
    , receivedAt: Date.now()
    , success: json.success
    , type: RECEIVE_DELETE_SUBSCRIPTION
  }
}

export function sendDelete(id) {
  return dispatch => {
    dispatch(requestDeleteSubscription(id))
    return apiUtils.callAPI(`/api/subscriptions/${id}`, 'DELETE')
      .then(json => dispatch(receiveDeleteSubscription(id, json)))
  }
}


/**
 * SUBSCRIPTION LIST ACTIONS
 */

const findListFromArgs = (state, listArgs) => {
  /**
   * Helper method to find appropriate list from listArgs.
   *
   * Because we nest subscriptionLists to arbitrary locations/depths,
   * finding the correct list becomes a little bit harder
   */
  // let list = Object.assign({}, state.subscription.lists, {});
  let list = { ...state.subscription.lists }
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
    return dispatch(returnSubscriptionListPromise(...listArgs));
  }
}

export const returnSubscriptionListPromise = (...listArgs) => (dispatch, getState) => {
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
  const listItems = listItemIds.map(id => state.subscription.byId[id]);

  return new Promise((resolve) => {
    resolve({
      list: listItems
      , listArgs: listArgs
      , success: true
      , type: "RETURN_SUBSCRIPTION_LIST_WITHOUT_FETCHING"
    })
  });
}

export const REQUEST_SUBSCRIPTION_LIST = "REQUEST_SUBSCRIPTION_LIST"
function requestSubscriptionList(listArgs) {
  return {
    type: REQUEST_SUBSCRIPTION_LIST
    , listArgs
  }
}

export const RECEIVE_SUBSCRIPTION_LIST = "RECEIVE_SUBSCRIPTION_LIST"
function receiveSubscriptionList(json, listArgs) {
  return {
    type: RECEIVE_SUBSCRIPTION_LIST
    , listArgs
    , list: json.subscriptions
    , success: json.success
    , error: json.message
    , receivedAt: Date.now()
  }
}

export const ADD_SUBSCRIPTION_TO_LIST = "ADD_SUBSCRIPTION_TO_LIST";
export function addSubscriptionToList(id, ...listArgs) {
  // console.log("Add subscription to list", id);
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: ADD_SUBSCRIPTION_TO_LIST
    , id
    , listArgs
  }
}

export const REMOVE_SUBSCRIPTION_FROM_LIST = "REMOVE_SUBSCRIPTION_FROM_LIST"
export function removeSubscriptionFromList(id, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ['all'];
  }
  return {
    type: REMOVE_SUBSCRIPTION_FROM_LIST
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
    dispatch(requestSubscriptionList(listArgs))
    /**
     * determine what api route we want to hit
     *
     * NOTE: use listArgs to determine what api call to make.
     * if listArgs[0] == null or "all", return list
     *
     * if listArgs has 1 arg, return "/api/subscriptions/by-[ARG]"
     *
     * if 2 args, additional checks required.
     *  if 2nd arg is a string, return "/api/subscriptions/by-[ARG1]/[ARG2]".
     *    ex: /api/subscriptions/by-category/:category
     *  if 2nd arg is an array, though, return "/api/subscriptions/by-[ARG1]-list" with additional query string
     *
     * TODO:  make this accept arbitrary number of args. Right now if more
     * than 2, it requires custom checks on server
     */
    let apiTarget = "/api/subscriptions";
    if(listArgs.length == 1 && listArgs[0] !== "all") {
      apiTarget += `/by-${listArgs[0]}`;
    } else if(listArgs.length == 2 && Array.isArray(listArgs[1])) {
      // length == 2 has it's own check, specifically if the second param is an array
      // if so, then we need to call the "listByValues" api method instead of the regular "listByRef" call
      // this can be used for querying for a list of subscriptions given an array of subscription id's, among other things
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
      json => dispatch(receiveSubscriptionList(json, listArgs))
    )
  }
}

/**
 * LIST UTIL METHODS
 */
export const SET_SUBSCRIPTION_FILTER = "SET_SUBSCRIPTION_FILTER"
export function setFilter(filter, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_SUBSCRIPTION_FILTER
    , filter
    , listArgs
  }
}

export const SET_SUBSCRIPTION_PAGINATION = "SET_SUBSCRIPTION_PAGINATION"
export function setPagination(pagination, ...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: SET_SUBSCRIPTION_PAGINATION
    , pagination
    , listArgs
  }
}

export const INVALIDATE_SUBSCRIPTION_LIST = "INVALIDATE_SUBSCRIPTION_LIST"
export function invalidateList(...listArgs) {
  if(listArgs.length === 0) {
    listArgs = ["all"];
  }
  return {
    type: INVALIDATE_SUBSCRIPTION_LIST
    , listArgs
  }
}
