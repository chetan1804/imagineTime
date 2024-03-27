import * as Actions from "./InvoiceActions";

function invoiceList(
  state = {
    didInvalidate: false,
    error: null,
    filter: {},
    isFetching: false,
    items: [],
    lastUpdated: null,
    pagination: {},
  },
  action
) {
  let nextAction = JSON.parse(JSON.stringify(action));
  nextAction.listArgs.shift();

  if (nextAction.listArgs.length > 0) {
    return {
      ...state,
      [nextAction.listArgs[0]]: invoiceList(
        state[nextAction.listArgs[0]] || {},
        nextAction
      ),
    };
  } else {
    switch (action.type) {
      case Actions.INVALIDATE_INVOICE_LIST: {
        return {
          ...state,
          didInvalidate: true,
        };
      }
      case Actions.REQUEST_INVOICE_LIST: {
        return {
          ...state,
          error: null,
          filter: state.filter || {},
          isFetching: true,
          items: [],
          lastUpdated: null,
          pagination: state.pagination || {},
        };
      }
      case Actions.RECEIVE_INVOICE_LIST: {
        if (!action.success) {
          return {
            ...state,
            error: action.error,
            isFetching: false,
            items: [],
            lastUpdated: action.receivedAt,
          };
        } else {
          let idArray = [];
          for (const item of action.list) {
            idArray.push(item.invoice_id);
          }
          return {
            ...state,
            didInvalidate: false,
            error: action.error || null,
            isFetching: false,
            items: idArray,
            lastUpdated: action.receivedAt,
          };
        }
      }
      case Actions.SET_INVOICE_FILTER: {
        return {
          ...state
          , filter: action.filter
        }
      }
      case Actions.SET_INVOICE_PAGINATION: {
        return {
          ...state,
          pagination: action.pagination,
        };
      }
      default:
        return state;
    }
  }
}

function invoice(
  state = {
    byId: {},

    defaultItem: {
      error: null,
      getItemFromSchema: () => {
        return null;
      },
      obj: null,
      schema: null,
      lastUpdated: null,
    },

    lists: {},
    selectedInvoice: null,
    isValidForm: false,

    selected: {
      didInvalidate: false,
      error: null,
      getItem: () => {
        return null;
      },
      id: null,
      isFetching: false,
      lastUpdated: null,
    },

    util: {
      getKeyArrayFromList: () => {
        return null;
      },
      getList: () => {
        return null;
      },
      getSelectedStore: () => {
        return null;
      },
    },
  },
  action
) {
  let nextState;
  switch (action.type) {
    /**
     * LIST ACTIONS
     */
    case Actions.INVALIDATE_INVOICE_LIST:
    case Actions.REQUEST_INVOICE_LIST:
    case Actions.SET_INVOICE_FILTER:
    case Actions.SET_INVOICE_PAGINATION: {
      nextState = {
        ...state,
        lists: {
          ...state.lists,
          [action.listArgs[0]]: invoiceList(
            state.lists[action.listArgs[0]] || {},
            action
          ),
        },
      };
      break;
    }
    case Actions.RECEIVE_INVOICE_LIST: {
      let newIdMap = {};
      if (action.success) {
        for (const item of action.list) {
          newIdMap[item.invoice_id] = item;
        }
      }
      nextState = {
        ...state,
        byId: newIdMap,
        lists: {
          ...state.lists,
          [action.listArgs[0]]: invoiceList(
            state.lists[action.listArgs[0]],
            action
          ),
        },
        selected: {
          error: null,
          id: null,
          isFetching: false,
        },
      };
      break;
    }
    case Actions.REQUEST_CREATE_INVOICE: {
      nextState = {
        ...state,
        selected: {
          error: null,
          id: null,
          isFetching: true,
        },
      };
      break;
    }
    case Actions.RECEIVE_CREATE_INVOICE: {
      if (action.success) {
        nextState = {
          ...state,
          byId: {
            ...state.byId,
            [action.id]: action.item,
          },
          selected: {
            didInvalidate: false,
            error: null,
            id: action.id,
            isFetching: false,
            lastUpdated: action.receivedAt,
          },
        };
      } else {
        nextState = {
          ...state,
          selected: {
            error: action.error,
            isFetching: false,
            lastUpdated: action.receivedAt,
          },
        };
      }
      break;
    }
    case Actions.REQUEST_UPDATE_INVOICE: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_UPDATE_INVOICE: {
      if (action.success) {
        nextState = {
          ...state
          , byId: {
            ...state.byId
            , [action.id]: action.item
          }
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }

    case Actions.REQUEST_GET_INVOICE_LAST_NUMBER: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_GET_INVOICE_LAST_NUMBER: {
      if (action.success) {
        nextState = {
          ...state
          , invoice: {
            ...state.invoice
            , number: action.item
          }
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }

    case Actions.REQUEST_DELETE_INVOICE: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_DELETE_INVOICE: {
      if (action.success) {
        nextState = {
          ...state
          , byId: {
            ...state.byId
            , [action.id]: action.item
          }
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }

    case Actions.REQUEST_INVOICE_GET_BY_ID: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.invoice_id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_INVOICE_GET_BY_ID: {
      if (action.success) {
        nextState = {
          ...state
          , selectedInvoice: action.item
          , isValidForm: false
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.invoice_id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          },
          selectedInvoice: null,
          isValidForm: false
        }
      }
      break;
    }

    case Actions.REQUEST_DELETE_INVOICE_DETAIL: {
      nextState = {
        ...state
        , selected: {
          error: null
          , id: action.id
          , isFetching: true
        }
      }
      break;
    }
    case Actions.RECEIVE_DELETE_INVOICE_DETAIL: {
      if (action.success) {
        nextState = {
          ...state
          , byId: {
            ...state.byId
            , [action.id]: action.item
          }
          , selected: {
            didInvalidate: false
            , error: null
            , id: action.id
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      } else {
        nextState = {
          ...state
          , selected: {
            error: action.error
            , isFetching: false
            , lastUpdated: action.receivedAt
          }
        }
      }
      break;
    }

    default: {
      nextState = state;
      break;
    }
  }

  nextState.util.getSelectedStore = (...listArgs) => {
    /**
     * utility method for a) determining if a list exists and b) getting those list objects
     * this can be used in the render function of a component to avoid having to
     * type: lists.player && lists.player.[id] && lists.player.[id].items
     * if list doesnt exist yet, it returns null, else returns array of objects
     * not meant to replace the map and individual list reducers, but to reduce
     * boiler plate and produce cleaner code in the front end components.
     */
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return {}
    } else {
      return nextList;
    }
  }
  nextState.util.getList = (...listArgs) => {
    /**
     * utility method for a) determining if a list exists and b) getting those list objects
     * this can be used in the render function of a component to avoid having to
     * type: lists.player && lists.player.[id] && lists.player.[id].items
     * if list doesnt exist yet, it returns null, else returns array of objects
     * not meant to replace the map and individual list reducers, but to reduce
     * boiler plate and produce cleaner code in the front end components.
     */
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return null
    } else {
      return nextList.items.map((item) => nextState.byId[item])
    }
  }
  nextState.util.getKeyArrayFromList = (key, ...listArgs) => {
    /**
     * utility method for returning an ARRAY of all of the "key" values
     * for the objects defined in a certain list. for example, if we have
     * a list defined by listArgs ("status", "published"), we can return an
     * array of all that list's author ids by calling:
     * Reducer.getKeyArrayFromList("_author","status","published")
     */
    if(listArgs.length === 0) {
      // If no arguments passed, make the list we want "all"
      listArgs = ["all"];
    }
    let nextList = nextState.lists;
    for(var i = 0; i < listArgs.length; i++) {
      if(nextList[listArgs[i]]) {
        nextList = nextList[listArgs[i]];
      } else {
        nextList = null;
        break;
      }
    }
    if(!nextList || !nextList.items || nextList.didInvalidate) {
      return null
    } else {
      return nextList.items.map((item) => nextState.byId[item][key])
    }
  }

  return nextState;
}

export default invoice;
