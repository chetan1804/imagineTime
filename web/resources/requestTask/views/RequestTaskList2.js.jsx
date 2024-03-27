/**
 * view component for /firm/:firmId/lists/request-tasks
 */

// import constants
import * as constants from '../../../config/constants.js';

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import * as searchConstants from '../../../global/utils/searchConstants';

// import firm components
import PracticeLayout from '../../../global/practice/components/PracticeLayout.js.jsx';

// import actions
import * as requestTaskActions from '../requestTaskActions';
import * as staffActions from '../../staff/staffActions';
import * as firmActions from '../../firm/firmActions';

import DataTable from '../../../global/components/DataTable.js.jsx';
import FilterList from '../../../global/components/helpers/FilterList.js.jsx';
import ButtonList from '../../../global/components/helpers/ButtonList.js.jsx';
import {FeedbackMessage} from '../../../global/components/helpers/FeedbackMessage.js.jsx';
import {LoadingBiscuit} from '../../../global/components/helpers/LoadingBiscuit.js.jsx';
import SelectOrderedSubList from '../../../global/components/helpers/SelectOrderedSubList.js.jsx';

// import api utility
import apiUtils from '../../../global/utils/api';

import _ from 'lodash';
// To force the download of the CSV file fetched from the server, in the client's browser.
import { saveAs } from 'file-saver';
import localStorageUtils from '../../../global/utils/localStorageUtils.js';
import sanitizeUtils from '../../../global/utils/sanitizeUtils.js';
import links from '../../../global/components/navigation/links.js.jsx';

const LSKEY_DISPLAYCOLUMNS = 'RequestTaskList2_DisplayColumns';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/request-task/search';
//const API_DELETE = '/api/request-task/';
const API_DELETE_BULK = '/api/request-task/bulk-delete';

// The following FILTER_XXX constant values are hard-coded in
// getXXXFilterCriteria functions. So if you need to change one, make sure it is
// changed in the corresponding function as well.
const FILTER_CLIENT_ALL = 'Client_All';
const FILTER_CLIENT_NONE = 'Client_None';
const FILTER_CLIENT_SPECIFIC = 'Client_Specific';

const FILTER_STATUS_ALL = 'Status_All';
const FILTER_STATUS_PUBLISHED = 'Status_Published';
const FILTER_STATUS_UNPUBLISHED = 'Status_Unpublished';
const FILTER_STATUS_COMPLETED = 'Status_Completed';

const FILTER_REQUESTLIST_ALL = 'RequestList_All';
const FILTER_REQUESTLIST_SPECIFIC = 'RequestList_Specific';

const DB_STATUS_PUBLISHED = 'published';
const DB_STATUS_UNPUBLISHED = 'unpublished';
const DB_STATUS_COMPLETED = 'completed';

const ATTRIBUTE_ID = 'id';
const ATTRIBUTE_CLIENTID = 'clientId';
//const ATTRIBUTE_USERNAME = 'userName';
const ATTRIBUTE_CLIENTNAME = 'clientName';
const ATTRIBUTE_DESCRIPTION = 'description';
const ATTRIBUTE_DUEDATE = 'dueDate';
const ATTRIBUTE_RESPONSEDATE = 'responseDate';
const ATTRIBUTE_CATEGORY = 'category';
const ATTRIBUTE_STATUS = 'status';
const ATTRIBUTE_REQUESTLISTID = 'requestListId';
const ATTRIBUTE_REQUESTLISTNAME = 'requestListName';
const ATTRIBUTE_CREATEDBYNAME = 'createdByName';
const ATTRIBUTE_CREATEDDATETIME = "createdDateTime";
const ATTRIBUTE_UPDATEDDATETIME = "updatedDateTime";

//const ATTRIBUTELABEL_USERNAME = 'User';
const ATTRIBUTELABEL_CLIENTNAME = 'Client';
const ATTRIBUTELABEL_DESCRIPTION = 'Description';
const ATTRIBUTELABEL_DUEDATE = 'Due Date';
const ATTRIBUTELABEL_RESPONSEDATE = 'Response Date';
const ATTRIBUTELABEL_CATEGORY = 'Category';
const ATTRIBUTELABEL_STATUS = 'Status';
const ATTRIBUTELABEL_REQUESTLISTNAME = 'List Name';
const ATTRIBUTELABEL_CREATEDBYNAME = 'Created By';
const ATTRIBUTELABEL_CREATEDDATETIME = "Created On";
const ATTRIBUTELABEL_UPDATEDDATETIME = "Last Updated On";

const BULK_ACTION_DELETE = 'Action_Delete';

const clientFilterNames = [
  {label: 'All', name: FILTER_CLIENT_ALL, value: FILTER_CLIENT_ALL}
  //, {label: 'None', name: FILTER_CLIENT_NONE, value: FILTER_CLIENT_NONE}
  //, {label: 'Others', name: FILTER_CLIENT_SPECIFIC, value: FILTER_CLIENT_SPECIFIC}
];

const statusFilterNames = [
  {label: 'All', name: FILTER_STATUS_ALL, value: FILTER_STATUS_ALL}
  , {label: 'Published', name: FILTER_STATUS_PUBLISHED, value: FILTER_STATUS_PUBLISHED}
  , {label: 'Unpublished', name: FILTER_STATUS_UNPUBLISHED, value: FILTER_STATUS_UNPUBLISHED}
  , {label: 'Completed', name: FILTER_STATUS_COMPLETED, value: FILTER_STATUS_COMPLETED}
];

const requestListFilterNames = [
  {label: 'All', name: FILTER_REQUESTLIST_ALL, value: FILTER_REQUESTLIST_ALL}
];

const bulkActions = [
  {
    label: 'Delete'
    , name: BULK_ACTION_DELETE
    , value: BULK_ACTION_DELETE
    , showConfirmModal: true
    , confirmModalLabel: 'request list task'
    , confirmModalLabelPlural: 'request list tasks'
    , confirmModalTitle: 'Delete Request List Task?'
    , confirmModalConfirmText: 'OK'
    , confirmModalDeclineText: 'Cancel'
    , showCount: true
  }
];

class RequestTaskList2 extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    const { filterData } = props.requestTaskStore;
    const params = {firmId: this.props.match.params.firmId};

    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_CLIENTNAME, key: ATTRIBUTE_CLIENTNAME, isSortable: true, headerStyle:{}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100}, valueFunction: this.getClientCellValue, params: params}
      , {label: ATTRIBUTELABEL_REQUESTLISTNAME, key: ATTRIBUTE_REQUESTLISTNAME, isSortable: true, headerStyle:{whiteSpace: 'initial'}, valueFunction: this.getRequestListNameCellValue, params: params}
      , {label: ATTRIBUTELABEL_CATEGORY, key: ATTRIBUTE_CATEGORY, isSortable: true, headerStyle:{whiteSpace: 'initial'}}
      , {label: ATTRIBUTELABEL_DESCRIPTION, key: ATTRIBUTE_DESCRIPTION, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 200, maxWidth: 250}, valueFunction: this.getDescriptionCellValue, params: params }
      , {label: ATTRIBUTELABEL_CREATEDDATETIME, key: ATTRIBUTE_CREATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_CREATEDBYNAME, key: ATTRIBUTE_CREATEDBYNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100} }
      , {label: ATTRIBUTELABEL_DUEDATE, key: ATTRIBUTE_DUEDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 120} }
      , {label: ATTRIBUTELABEL_RESPONSEDATE, key: ATTRIBUTE_RESPONSEDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 120} }
      //, {label: ATTRIBUTELABEL_USERNAME, key: ATTRIBUTE_USERNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100} }
      , {label: ATTRIBUTELABEL_STATUS, key: ATTRIBUTE_STATUS, isSortable: true, style:{textTransform: 'capitalize'}}
    ];
    
    this.defaultDisplayColumns = this.allDisplayColumns.slice(0, 7);
    
    let displayColumns = props.requestTaskStore.displayColumns;
    if(!displayColumns) {
      displayColumns = localStorageUtils.getJSONValue(LSKEY_DISPLAYCOLUMNS, this.defaultDisplayColumns);
      displayColumns = sanitizeUtils.sanitizeDisplayColumns(displayColumns, this.allDisplayColumns);
      this.props.dispatch(requestTaskActions.setRequestTaskList2Displayolumns(displayColumns));
    }

    this.state = {
      list: []
      , totalCount: 0
      , isProcessing: 0
      , isSelectAllChecked: false
      , selectedRows: {}
      , checkboxes: {}
      , filterRequestListId: (filterData.requestListId || -1)
      , filterClientId: (filterData.clientId || -1)
      , isSelectDisplayColumnModalOpen : false
      , selectedDisplayColumns: displayColumns
    };

    this._bind(
      'fetchList'
      , 'getDefaultFilterNames'
      , 'getClientList'
      , 'getRequestListList'
      , 'refreshList'
      , 'getFilterCriteria'
      , 'getClientFilterCriteria'
      , 'getStatusFilterCriteria'
      , 'getRequestListFilterCriteria'
      , 'onClientFilterChange'
      , 'onStatusFilterChange'
      , 'onRequestListFilterChange'
      , 'onOrderByChange'
      , 'onPageNumberChange'
      , 'onPageSizeChange'
      , 'onSelectAllCheckedChange'
      , 'onSingleCheckboxChange'
      , 'onCheckboxCheckedChange'
      , 'showCheckbox'
      , 'onActionSelected'
      , 'updateListAfterDelete'
      , 'showSelectDisplayColumnModal'
      , 'downloadCSVFile'
      , 'getClientCellValue'
      , 'getDescriptionCellValue'
      , 'getRequestListNameCellValue'
      );
  }

  componentDidMount() {
    //console.log('here in RequestTaskList2.componentDidMount');
    
    const { dispatch, match, requestTaskStore, socket, loggedInUser } = this.props;
    const { filter, filterNames } = requestTaskStore;

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    let newFilterNames;
    let newFilter = {};
    if(!filterNames.clientFilter) {
      newFilterNames = this.getDefaultFilterNames();
      newFilter = {
        firmId: this.props.match.params.firmId
        , orderBy: ATTRIBUTE_DUEDATE
        , sortOrderAscending: true
        , pageSize: DEFAULT_PAGE_SIZE
        , pageNumber: 1
        , includeCount: true
        , group: this.getFilterCriteria(newFilterNames)
      };
    }
    else {
      newFilterNames = filterNames;
      newFilter = filter;
    }

    // incrementing isProcessing in state for the server call made in
    // this.getRequestListList() and this.getClientList() functions
    this.setState({isProcessing: (this.state.isProcessing + 2)}, () => {
      this.getClientList();
      this.getRequestListList();
      this.fetchList(newFilter, newFilterNames);
    });

    socket.on('disconnect', reason => {
      socket.open();
    })
    socket.on('connect', () => {
      //console.log('Connected! 12345');
      if(loggedInUser && loggedInUser._id) {
        socket.emit('subscribe', loggedInUser._id);
      } else {
        socket.emit('subscribe', match.params.hex);
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log('here in RequestTaskList2.componentDidUpdate');
  }

  getRequestListList() {
    let criteriaObj = {
      distinct: true
      , columns: [ATTRIBUTE_REQUESTLISTID, ATTRIBUTE_REQUESTLISTNAME]
      , operator: searchConstants.OPERATOR_AND
      , firmId: this.props.match.params.firmId
      , orderBy: ATTRIBUTE_REQUESTLISTNAME
      , sortOrderAscending: true
      , includeCount: false
      , ignoreLimit: true
      , group: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_REQUESTLISTID
            , operator: searchConstants.OPERATOR_NOT_NULL
          }
        ]
      }
    };
    apiUtils.callAPI(API_SEARCH, 'POST', criteriaObj).then(
      json => {
        json.results.forEach(item => {
          requestListFilterNames.push({label: item[ATTRIBUTE_REQUESTLISTNAME], name: item[ATTRIBUTE_REQUESTLISTNAME], value: item[ATTRIBUTE_REQUESTLISTID]});
        });
        this.setState({isProcessing: (this.state.isProcessing - 1)});
      }
    );
  }

  getClientList() {
    let criteriaObj = {
      distinct: true
      , columns: [ATTRIBUTE_CLIENTID, ATTRIBUTE_CLIENTNAME]
      , operator: searchConstants.OPERATOR_AND
      , firmId: this.props.match.params.firmId
      , orderBy: ATTRIBUTE_CLIENTNAME
      , sortOrderAscending: true
      , includeCount: false
      , ignoreLimit: true
      , group: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_NOT_NULL
          }
        ]
      }
    };
    apiUtils.callAPI(API_SEARCH, 'POST', criteriaObj).then(
      json => {
        json.results.forEach(item => {
          clientFilterNames.push({label: item[ATTRIBUTE_CLIENTNAME], name: item[ATTRIBUTE_CLIENTNAME], value: item[ATTRIBUTE_CLIENTID]});
        });
        this.setState({isProcessing: (this.state.isProcessing - 1)});
      }
    );
  }

  getDefaultFilterNames() {
    return {
      clientFilter: clientFilterNames[0].value
      , statusFilter: FILTER_STATUS_ALL
      , requestListFilter: FILTER_REQUESTLIST_ALL
    }
  }

  onSelectAllCheckedChange() {
    let newSelectAllState = !this.state.isSelectAllChecked;
    let newCheckboxesState = {};

    this.state.list.forEach(item => {
      if(this.showCheckbox(item) === true) {
        newCheckboxesState[item[ATTRIBUTE_ID]] = newSelectAllState;
      }
    });

    this.setState({
      checkboxes: newCheckboxesState
      , isSelectAllChecked: newSelectAllState
    });
  }

  onSingleCheckboxChange(id) {
    console.log(id);
    this.onCheckboxCheckedChange(id);
  }

  onCheckboxCheckedChange(id) {
    let newCheckboxesState = _.cloneDeep(this.state.checkboxes);
    newCheckboxesState[id] = !newCheckboxesState[id];
    //console.log(newCheckboxesState);
    let allChecked = true;
    _.forEach(newCheckboxesState, function(value, key) {
      allChecked = allChecked && value;
    });
    this.setState({
      checkboxes: newCheckboxesState
      , isSelectAllChecked: allChecked
    });
  }

  onActionSelected(action) {
    let selectedIds = [];
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedIds.push(key);
      }
    });
    if(selectedIds.length < 1) {
      return;
    }
    
    if(action === BULK_ACTION_DELETE) {
      console.log('here in Delete bulk action ', selectedIds);
      /*****/
      this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
        apiUtils.callAPI(API_DELETE_BULK, 'POST', selectedIds).then(
          json => {
            this.setState({isProcessing: (this.state.isProcessing - 1)});
            //console.log('response: ');
            //console.log(json);
            if(json.success) {
              this.feedbackMessage.current.showSuccess('The selected request list task' + (selectedIds.length > 1 ? 's' : '') + ' deleted successfully.');
              this.refreshList();
            }
            else {
              // json.data[index].message contains error message from the server
              let errorCount = 0;
              json.data.forEach(item => {
                if(!!item.message) errorCount++;
              });
              let feedbackMessageStr = '';
              if(errorCount < selectedIds.length) {
                feedbackMessageStr = 'Could not delete ' + errorCount + ' of the selected ' + selectedIds.length + ' request list task' + (selectedIds.length > 1 ? 's' : '');
              }
              else if(errorCount === selectedIds.length) {
                feedbackMessageStr = 'Could not delete the selected request list task' + (selectedIds.length > 1 ? 's' : '');
              }
              feedbackMessageStr += '. Please hover over the error icon for the corresponding row to see the error description.';
              this.feedbackMessage.current.showError(feedbackMessageStr);
              this.updateListAfterDelete(json.data);
            }
          }
        );
      });
      /*****/
    }
  }

  updateListAfterDelete(responseList) {
    let list = _.cloneDeep(this.state.list);
    let checkboxes = _.cloneDeep(this.state.checkboxes);
    let totalCount = this.state.totalCount;

    // remove any errorMessage attributes in the list and create a map of id
    // attributes in the list containing their index in the list for later
    // iteration
    let listMap = {};
    list.forEach((item, index, array) => {
      delete array[index].errorMessage;
      listMap[item.id] = index;
    });

    responseList.forEach((item, index) => {
      index = listMap[item.id];
      index = index !== 'undefined' ? index : -1;
      //console.log(item.id, 'found at', index);
      if(index > -1) {
        if(!!item.message) { // error
          list[index].errorMessage = item.message;
          //console.log('error "', item.message, '" was returned for id:', item.id, 'and has been set in the list');
        }
        else {
          delete checkboxes[list[index].id];
          totalCount--;
          list.splice(index, 1);
        }
      }
    });

    this.setState({list, checkboxes, totalCount});
  }

  onPageSizeChange(pageSize) {
    const { requestTaskStore } = this.props;
    const { filter, filterNames } = requestTaskStore;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { requestTaskStore } = this.props;
    const { filter, filterNames } = requestTaskStore;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { requestTaskStore } = this.props;
    const { filter, filterNames } = requestTaskStore;
    const { orderBy, sortOrderAscending } = filter;
    //console.log('Current orderBy: ' + orderBy + ', sortOrderAscending: ' + sortOrderAscending);
    let newSortOrderAscending = true;
    if(newOrderBy === orderBy) {
      newSortOrderAscending = !sortOrderAscending;
    }
    
    let newFilter = {
      ...filter
      , orderBy: newOrderBy
      , sortOrderAscending: newSortOrderAscending
      , pageNumber: 1
    };
    //console.log('New Filter');
    //console.log(newFilter);
    this.fetchList(newFilter, filterNames);
  }

  onClientFilterChange(value) {
    if(!value) {
      return;
    }
    const { requestTaskStore } = this.props;
    const { filter, filterNames } = requestTaskStore;
    if(value === filterNames.clientFilter || (filterNames.clientFilter === FILTER_CLIENT_SPECIFIC && value === this.state.filterClientId)) {
      return;
    }
    let clientId = -1;
    if(value !== FILTER_CLIENT_ALL) {
      clientId = value;
      value = FILTER_CLIENT_SPECIFIC;
    }
    this.setState({filterClientId: clientId}, () => {
      let newFilterNames = {...filterNames, clientFilter: value};
      let criteria = this.getFilterCriteria(newFilterNames);
      if(!criteria) {
        return;
      }

      let newFilter = {
        ...filter
        , pageNumber: 1
        , group: criteria
      };
      this.fetchList(newFilter, newFilterNames);
    });
  }

  onStatusFilterChange(value) {
    if(!value) {
      return;
    }
    const { requestTaskStore } = this.props;
    const { filter, filterNames } = requestTaskStore;
    if(value === filterNames.statusFilter) {
        return;
    }

    let newFilterNames = {...filterNames, statusFilter: value};
    let criteria = this.getFilterCriteria(newFilterNames);
    if(!criteria) {
      return;
    }

    let newFilter = {
      ...filter
      , pageNumber: 1
      , group: criteria
    };
    this.fetchList(newFilter, newFilterNames);
  }

  onRequestListFilterChange(value) {
    if(!value) {
      return;
    }
    const { requestTaskStore } = this.props;
    const { filter, filterNames } = requestTaskStore;
    if(value === filterNames.requestListFilter || (filterNames.requestListFilter === FILTER_REQUESTLIST_SPECIFIC && value === this.state.filterRequestListId)) {
        return;
    }
    let requestListId = -1;
    if(value !== FILTER_REQUESTLIST_ALL) {
      requestListId = value;
      value = FILTER_REQUESTLIST_SPECIFIC;
    }
    this.setState({filterRequestListId: requestListId}, () => {
      let newFilterNames = {...filterNames, requestListFilter: value};
      let criteria = this.getFilterCriteria(newFilterNames);
      if(!criteria) {
        return;
      }
  
      let newFilter = {
        ...filter
        , pageNumber: 1
        , group: criteria
      };
      this.fetchList(newFilter, newFilterNames);
    });
  }

  getFilterCriteria(filterNames) {
    if(!filterNames) {
      return null;
    }

    let groups = [];

    let clientCriteria = this.getClientFilterCriteria(filterNames.clientFilter);
    if(!!clientCriteria) {
      groups.push(clientCriteria);
    }

    let statusCriteria = this.getStatusFilterCriteria(filterNames.statusFilter);
    if(!!statusCriteria) {
      groups.push(statusCriteria);
    }

    let requestListCriteria = this.getRequestListFilterCriteria(filterNames.requestListFilter);
    if(!!requestListCriteria) {
      groups.push(requestListCriteria);
    }

    let criteriaObj = {
      operator: searchConstants.OPERATOR_AND
      , groups: groups
    };
    //console.log('criteriaGroupObj: ', criteriaGroupObj);
    return criteriaObj;
  }

  getClientFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }

    let criteriaGroup = {
      Client_All: null
      , Client_None: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_NULL
          }
        ]
      }
      , Client_Specific: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_EQUAL
            , value: '' + this.state.filterClientId
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  getStatusFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }

    let criteriaGroup = {
      Status_All: null,
      Status_Published: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_PUBLISHED
          }
        ]
      },
      Status_Unpublished: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_UNPUBLISHED
          }
        ]
      },
      Status_Completed: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_COMPLETED
          }
        ]
      },
    };
    return (criteriaGroup[filterName]);
  }

  getRequestListFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }
    let criteriaGroup = {
      RequestList_All: null
      , RequestList_Specific: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_REQUESTLISTID
            , operator: searchConstants.OPERATOR_EQUAL
            , value: '' + this.state.filterRequestListId
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  refreshList() {
    //console.log('About to refresh list');
    const {requestTaskStore} = this.props;
    const {filter, filterNames} = requestTaskStore;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    let filterData = {
      requestListId: (this.state.filterRequestListId ? this.state.filterRequestListId : -1)
      , clientId: (this.state.filterClientId ? this.state.filterClientId : -1)
    };

    //console.log('Filter: ', filter);
    //console.log('FilterNames: ', filterNames);
    const { dispatch } = this.props;
    this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
      dispatch(requestTaskActions.setRequestTaskList2Filter(filterNames, filter, filterData));
      //console.log('State: ');
      //console.log(this.state);
      apiUtils.callAPI(API_SEARCH, 'POST', filter).then(
        json => {
          //console.log('response: ');
          //console.log(json);
          let checkboxes = {};
          let isCheckboxVisible = this.showCheckbox;
          _.forEach(json.results, function(requestTask) {
            if(isCheckboxVisible(requestTask) === true) {
              checkboxes[requestTask[ATTRIBUTE_ID]] = false;
            }
          });
          this.setState({
            list: json.results
            , totalCount: json.totalCount
            , isProcessing: (this.state.isProcessing - 1)
            , checkboxes: checkboxes
          });
        }
      )
    });
  }

  showCheckbox(requestTask) {
    return requestTask[ATTRIBUTE_STATUS] === DB_STATUS_UNPUBLISHED
  }

  onDisplayColumnChange(displayColumns) {
    //console.log('Selected Display Columns: ', displayColumns);
    const { dispatch } = this.props;

    this.setState({
      selectedDisplayColumns: displayColumns
      , isSelectDisplayColumnModalOpen: false
    });

    localStorageUtils.setJSONValue(LSKEY_DISPLAYCOLUMNS, displayColumns);

    //console.log('selectedDisplayColumns', displayColumns);
    dispatch(requestTaskActions.setRequestTaskList2Displayolumns(displayColumns));
  }

  downloadCSVFile() {
    const { requestTaskStore } = this.props;
    const { filter } = requestTaskStore;

    apiUtils.downloadFile(API_SEARCH, 'POST', filter).then(blob => {
      saveAs(blob, 'Request Tasks.csv');
    });
  }
  
  showSelectDisplayColumnModal() {
    this.setState({isSelectDisplayColumnModalOpen: true});
  }
  
  getClientCellValue(attributeValue, requestListTask, params) {
    return links.getClientRequestListsLink(requestListTask[ATTRIBUTE_CLIENTID], requestListTask[ATTRIBUTE_CLIENTNAME], params.firmId);
  }

  getDescriptionCellValue(attributeValue, requestListTask, params) {
    return links.getClientRequestTaskLink(requestListTask[ATTRIBUTE_ID], requestListTask[ATTRIBUTE_DESCRIPTION], requestListTask[ATTRIBUTE_STATUS], requestListTask[ATTRIBUTE_REQUESTLISTID], requestListTask[ATTRIBUTE_CLIENTID], params.firmId);
  }

  getRequestListNameCellValue(attributeValue, requestListTask, params) {
    return links.getClientRequestListLink(requestListTask[ATTRIBUTE_REQUESTLISTID], requestListTask[ATTRIBUTE_REQUESTLISTNAME], requestListTask[ATTRIBUTE_STATUS], requestListTask[ATTRIBUTE_CLIENTID], params.firmId);
  }

  render() {
    const {
      list
      , isProcessing
      , checkboxes
      , isSelectDisplayColumnModalOpen
      , selectedDisplayColumns
    } = this.state;

    const { 
      location
      , requestTaskStore
    } = this.props;

    //console.log(new Date().getTime(), '- In RequestTaskList2.render - isProcessing:', isProcessing);

    const { filter } = requestTaskStore;

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const isEmpty = !list || list.length < 1;

    const filterNames = requestTaskStore.filterNames.clientFilter ? requestTaskStore.filterNames : this.getDefaultFilterNames();

    const errors = list.filter(item => {
      return !!item.errorMessage;
    });

    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = errors && errors.length > 0;
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = true;
    //columnVisibility[ATTRIBUTE_USERNAME] = !(filterNames.clientFilter === FILTER_CLIENT_SPECIFIC);
    columnVisibility[ATTRIBUTE_CLIENTNAME] = (filterNames.clientFilter === FILTER_CLIENT_ALL);
    columnVisibility[ATTRIBUTE_DESCRIPTION] = true;
    columnVisibility[ATTRIBUTE_DUEDATE] = true;
    columnVisibility[ATTRIBUTE_RESPONSEDATE] = true;
    columnVisibility[ATTRIBUTE_CATEGORY] = true;
    columnVisibility[ATTRIBUTE_STATUS] = (filterNames.statusFilter === FILTER_STATUS_ALL);
    columnVisibility[ATTRIBUTE_REQUESTLISTNAME] = (filterNames.requestListFilter === FILTER_REQUESTLIST_ALL);

    let singleObjectActions = [
      //{label: 'Delete', eventHandler: this.onDelete}
    ];

    let selectedRequestTaskCount = 0;
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedRequestTaskCount++;
      }
    });
    return  (
      <PracticeLayout >
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isProcessing > 0} />
        <Helmet>
          <title>Request List Tasks</title>
        </Helmet>
        <div className='-practice-subnav'>
          <div className='yt-container fluid'>
            <div className='yt-row center-vert space-between'>
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className='yt-container fluid'>
          <h1>Request List Tasks</h1>
        </div>
        <div className='-practice-content'>
          <div className='yt-container fluid'>
            <div className='yt-toolbar -mobile-yt-hide'>
              <div className='yt-tools space-between'>
                <div className='-filters -left'>
                  <span>Filters </span>
                  <FilterList
                    label='Client'
                    select={this.onClientFilterChange}
                    displayKey='label'
                    items={clientFilterNames}
                    selected={(filterNames.clientFilter === FILTER_CLIENT_SPECIFIC ? this.state.filterClientId : filterNames.clientFilter)}
                    valueKey='value'
                    name='_filterClient'
                    isEnabled={true}
                  />
                  <FilterList
                    label='Status'
                    select={this.onStatusFilterChange}
                    displayKey='label'
                    items={statusFilterNames}
                    selected={filterNames.statusFilter}
                    valueKey='value'
                    name='_filterStatus'
                    isEnabled={true}
                  />
                  <FilterList
                    label='Request List'
                    select={this.onRequestListFilterChange}
                    displayKey='label'
                    items={requestListFilterNames}
                    selected={(filterNames.requestListFilter === FILTER_REQUESTLIST_SPECIFIC ? this.state.filterRequestListId : filterNames.requestListFilter)}
                    valueKey='value'
                    name='_filterRequestList'
                    isEnabled={true}
                  />
                </div>
              </div>
            </div>
            <hr className='-mobile-yt-hide' />
            <div>
              <div className="table-wrapper -practice-table-wrapper" style={{ opacity: (isProcessing > 0) ? 0.5 : 1 }}>
                <div className="table-actions">
                  {
                  <ButtonList
                      label='Actions'
                      select={this.onActionSelected}
                      displayKey="label"
                      items={bulkActions}
                      valueKey="value"
                      name="_bulkActions"
                      selectedRowCount={selectedRequestTaskCount}
                      isEnabled={selectedRequestTaskCount > 0}
                    />
                  }
                  <div className='data-table-actions'>
                    <button
                      disabled={isEmpty}
                      title='Download as CSV'
                      className="yt-btn info"
                      onClick={this.downloadCSVFile}
                    >
                      <i className="fal fa-download"/>
                    </button>
                    <button
                      disabled={false}
                      title='Edit Columns'
                      className="yt-btn info"
                      onClick={this.showSelectDisplayColumnModal}
                    >
                      <i className="fal fa-columns"/>
                    </button>
                  </div>
                </div>
                <PageTabber
                  totalItems={totalCount}
                  totalPages={Math.ceil(totalCount / pageSize)}
                  pagination={({per: pageSize, page: pageNumber})}
                  setPagination={this.onPageNumberChange}
                  setPerPage={this.onPageSizeChange}
                  viewingAs="top"
                  itemName="request list tasks"
                />
                <DataTable
                  displayColumns={selectedDisplayColumns}
                  columnVisibility={columnVisibility}
                  data={list}
                  onSort={this.onOrderByChange}
                  currentSortOrderAttribute={orderBy}
                  isCurrentSortOrderAscending={sortOrderAscending}
                  checkboxesState={checkboxes}
                  checkboxNamePrefix="requestTask2"
                  onSelectAllCheckboxStateChange={this.onSelectAllCheckedChange}
                  onCheckboxStateChange={this.onSingleCheckboxChange}
                  checkboxDisplayCriteriaFunction={this.showCheckbox}
                  isSelectAllChecked={this.state.isSelectAllChecked}
                  rowActions={singleObjectActions}
                  animate={true}
                  emptyTableMessage='No request list tasks found'
                  isProcessing={isProcessing > 0}
                />
              </div>
              <PageTabber
                totalItems={totalCount}
                totalPages={Math.ceil(totalCount / pageSize)}
                pagination={({per: pageSize, page: pageNumber})}
                setPagination={this.onPageNumberChange}
                setPerPage={this.onPageSizeChange}
                viewingAs="bottom"
                itemName="request list tasks"
              />
            </div>
            <SelectOrderedSubList
              isOpen={isSelectDisplayColumnModalOpen}
              allItems={this.allDisplayColumns}
              selectedItems={selectedDisplayColumns}
              displayKey='label'
              valueKey='key'
              onDone={(selectedDisplayColumns) => {this.onDisplayColumnChange(selectedDisplayColumns);}}
              onCancelled={() => {this.setState({isSelectDisplayColumnModalOpen: false});}}
            />
          </div>
        </div>
      </PracticeLayout>
    )
  }

}

RequestTaskList2.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , requestTaskStore: store.requestTask
    , socket: store.user.socket
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(RequestTaskList2)
);
