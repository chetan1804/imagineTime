/**
 * Build the Signature store
 *
 * Follows best practices from Redux documentation:
 *   - Single source of truth
 *   - State/Store is read-only
 *   - Changes are made with pure functions
 *
 * See http://redux.js.org/docs/recipes/StructuringReducers.html for specific
 * docs on structuring reducers
 *
 * NOTE: In Yote, we try to keep actions and reducers dealing with CRUD payloads
 * in terms of 'item' or 'items'. This keeps the action payloads consistent and
 * aides various scoping issues with list management in the reducers.
 */

// import actions
import * as Actions from './signatureActions';

/**
 * Primary signature reducer -
 *
 * This is the single source of truth for all things 'signature' related within the
 * application. The primary components of the reducer are defined in detail below.
 *
 * The basic idea is that the reducer listens for actions indicating a desired
 * state change and the reducer returns a new _copy_ of the state accordingly.
 */
function signature(state = {

  /**
   * Default object to be persisted in the application store. state represents
   * the application store here.
   */
  displayColumns: null
  , filterNames: {associationFilter: null, statusFilter: null, expireDateFilter: null}
  , filterData: {startDate: null, endDate: null}
  , filter: {
    firmId: null
    , orderBy: 'expireDate'
    , sortOrderAscending: true
    , pageSize: 50
    , pageNumber: 1
    , includeCount: true
    , group: {}
  }

}, action) {
  /**
   * Listen for the actions and respond accordingly.
   */
  let nextState;
  switch(action.type) {
    case Actions.SET_SIGNATURE_FILTER: {
      nextState = {
        ...state
        , filterNames: action.filterNames
        , filterData: action.filterData
        , filter: action.filter
      }
      break;
    }
    case Actions.SET_SIGNATURE_DISPLAY_COLUMNS: {
      nextState = {
        ...state
        , displayColumns: action.displayColumns
      }
      break;
    }
    default: {
      nextState = state
      break;
    }
  }

  return nextState;
}

export default signature;
