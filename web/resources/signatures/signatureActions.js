/**
 * Signature screen related actions that are dispatched for reducers to store
 * information in application-level (redux) store.
 *
 * For Signatures screen, the only things we want to persist in the application
 * store are last filter and its pagination information i.e. rows per page and
 * current pag number.
 */

export const SET_SIGNATURE_FILTER = "SET_SIGNATURE_FILTER"
export function setFilter(filterNames, filter, filterData) {
  return {
    filterNames
    , filterData
    , filter
    , type: SET_SIGNATURE_FILTER
  }
}

export const SET_SIGNATURE_DISPLAY_COLUMNS = "SET_SIGNATURE_DISPLAY_COLUMNS"
export function setSignatureDisplayolumns(displayColumns) {
  return {
    displayColumns
    , type: SET_SIGNATURE_DISPLAY_COLUMNS
  }
}


