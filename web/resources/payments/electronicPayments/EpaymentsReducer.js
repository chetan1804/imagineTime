import * as Actions from "./EpaymentsActions";

function staxUtilities(
  state = {
    merchant: {},

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
      getListInfo: () => {
        return null;
      },
    },
  },
  action
) {
  let nextState;
  switch (action.type) {
    case Actions.REQUEST_GET_ENROLL_MERCHANT_STATUS: {
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
    case Actions.RECEIVE_GET_ENROLL_MERCHANT_STATUS: {
      if (action.item) {
        nextState = {
          ...state,
          merchant: {
            ...state.merchant,
            registration: action.item,
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

    case Actions.REQUEST_ENROLL_ASSUME: {
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
    case Actions.RECEIVE_ENROLL_ASSUME: {
      if (action.success) {
        nextState = {
          ...state,
          merchant: {
            ...state.merchant,
            assume: action.item,
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

    case Actions.REQUEST_SSO_TOKEN: {
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
    case Actions.RECEIVE_SSO_TOKEN: {
      if (action.success) {
        nextState = {
          ...state,
          merchant: {
            ...state.merchant,
            ssoToken: action.item,
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
    default: {
      nextState = state;
      break;
    }
  }
  return nextState;
}

export default staxUtilities;
