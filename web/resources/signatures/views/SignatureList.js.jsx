/**
 * view component for /firm/:firmId/signatures
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
import {SingleDatePickerInput} from '../../../global/components/forms';

// import utilities
import { permissions } from '../../../global/utils';
import * as searchConstants from '../../../global/utils/searchConstants';

// import firm components
import PracticeLayout from '../../../global/practice/components/PracticeLayout.js.jsx';

// import actions
import * as signatureActions from '../signatureActions';
import * as staffActions from '../../staff/staffActions';
import * as firmActions from '../../firm/firmActions';

// import global components
import DataTable from '../../../global/components/DataTable.js.jsx';
import FilterList from '../../../global/components/helpers/FilterList.js.jsx';
import ButtonList from '../../../global/components/helpers/ButtonList.js.jsx';
import {FeedbackMessage} from '../../../global/components/helpers/FeedbackMessage.js.jsx';
import {LoadingBiscuit} from '../../../global/components/helpers/LoadingBiscuit.js.jsx';
import SelectOrderedSubList from '../../../global/components/helpers/SelectOrderedSubList.js.jsx';

// import api utility
import apiUtils from '../../../global/utils/api';
import dateUtils from '../../../global/utils/dateUtils';
import _ from 'lodash';
import DateInputModal from '../components/DateInputModal.js.jsx';

// To force the download of the CSV file fetched from the server, in the client's browser.
import { saveAs } from "file-saver";
import localStorageUtils from '../../../global/utils/localStorageUtils.js';
import sanitizeUtils from '../../../global/utils/sanitizeUtils.js';
import links from '../../../global/components/navigation/links.js.jsx';

const LSKEY_DISPLAYCOLUMNS = 'SignatureList_DisplayColumns';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/signature/search';
const API_DELETE = '/api/signature/';
const API_DELETE_BULK = '/api/signature/bulk-delete';
const API_UPDATE_EXPIRY_BULK = '/api/signature/bulk-update-expiry';
const API_SEND_REMINDER = (id) => {return `/api/signature/${id}/send-reminder`};

// The following FILTER_XXX constant values are hard-coded in
// getXXXFilterCriteria functions. So if you need to change one, make sure it is
// changed in the corresponding function as well.
const FILTER_ASSOCIATION_ALLCLIENTS = 'Association_AllClients';
//const FILTER_ASSOCIATION_SELECTCLIENT = 'Association_SelectClients';
const FILTER_ASSOCIATION_MY = 'Association_My';

const FILTER_EXPIREDATE_ALL = 'ExpireDate_All';
const FILTER_EXPIREDATE_OVERDUE = 'ExpireDate_Overdue';
const FILTER_EXPIREDATE_TODAY = 'ExpireDate_Today';
const FILTER_EXPIREDATE_THISWEEK = 'ExpireDate_ThisWeek';
const FILTER_EXPIREDATE_THISMONTH = 'ExpireDate_ThisMonth';
const FILTER_EXPIREDATE_THISYEAR = 'ExpireDate_ThisYear';
const FILTER_EXPIREDATE_CUSTOM = 'ExpireDate_Custom';

const FILTER_STATUS_ALL = 'Status_All';
const FILTER_STATUS_OPEN = 'Status_Open';
const FILTER_STATUS_INPROGRESS = 'Status_InProgress';
const FILTER_STATUS_EXPIRED = 'Status_Expired';
const FILTER_STATUS_COMPLETED = 'Status_Completed';

const DB_STATUS_COMPLETED = "closed";
const DB_STATUS_OPEN = "open";
const DB_TYPE_SIGNATUREREQUEST = "signature-request";

const ATTRIBUTE_ID = "id";
const ATTRIBUTE_TYPE = "type";
const ATTRIBUTE_CLIENTID = "clientId";
const ATTRIBUTE_QUICKTASKID = "quickTaskId"
const ATTRIBUTE_USERID = "userId";
const ATTRIBUTE_TITLE = "title";
const ATTRIBUTE_CLIENTNAME = "clientName";
const ATTRIBUTE_CREATEDDATETIME = "createdDateTime";
const ATTRIBUTE_UPDATEDDATETIME = "updatedDateTime";
const ATTRIBUTE_CREATEDBYNAME = "createdBy";
const ATTRIBUTE_SIGNERS = "signerNames";
const ATTRIBUTE_EXPIREDATE = "expireDate";
const ATTRIBUTE_STATUS = "status";
const ATTRIBUTE_RESPONSEDATE = "responseDate";
const ATTRIBUTE_REQUESTEDBYNAME = "userName";

const ATTRIBUTELABEL_TYPE = "Type";
const ATTRIBUTELABEL_TITLE = "Envelope";
const ATTRIBUTELABEL_CLIENTNAME = "Client";
const ATTRIBUTELABEL_CREATEDDATETIME = "Created On";
const ATTRIBUTELABEL_UPDATEDDATETIME = "Last Updated On";
const ATTRIBUTELABEL_CREATEDBYNAME = "Created By";
const ATTRIBUTELABEL_SIGNERS = "Signer(s)";
const ATTRIBUTELABEL_EXPIREDATE = "Expiry Date";
const ATTRIBUTELABEL_STATUS = "Status";
const ATTRIBUTELABEL_RESPONSEDATE = "Response Date";
const ATTRIBUTELABEL_REQUESTEDBYNAME = "Requested By";

const BULK_ACTION_DELETE = "Action_Delete";
const BULK_ACTION_UPDATEEXPIRY = "Action_UpdateExpiry";

const associationFilterNames = [
  {label: 'All Clients', name: FILTER_ASSOCIATION_ALLCLIENTS, value: FILTER_ASSOCIATION_ALLCLIENTS}
  //, {label: 'Select Client', name: FILTER_ASSOCIATION_SELECTCLIENT, value: FILTER_ASSOCIATION_SELECTCLIENT}
  , {label: 'My', name: FILTER_ASSOCIATION_MY, value: FILTER_ASSOCIATION_MY}
];

const expireDateFilterNames = [
  {label: 'All', name: FILTER_EXPIREDATE_ALL, value: FILTER_EXPIREDATE_ALL}
  , {label: 'Overdue', name: FILTER_EXPIREDATE_OVERDUE, value: FILTER_EXPIREDATE_OVERDUE}
  , {label: 'Today', name: FILTER_EXPIREDATE_TODAY, value: FILTER_EXPIREDATE_TODAY}
  , {label: 'This Week', name: FILTER_EXPIREDATE_THISWEEK, value: FILTER_EXPIREDATE_THISWEEK}
  , {label: 'This Month', name: FILTER_EXPIREDATE_THISMONTH, value: FILTER_EXPIREDATE_THISMONTH}
  , {label: 'This Year', name: FILTER_EXPIREDATE_THISYEAR, value: FILTER_EXPIREDATE_THISYEAR}
  , {label: 'Custom', name: FILTER_EXPIREDATE_CUSTOM, value: FILTER_EXPIREDATE_CUSTOM}
];

const statusFilterNames = [
  {label: 'All', name: FILTER_STATUS_ALL, value: FILTER_STATUS_ALL}
  , {label: 'Open', name: FILTER_STATUS_OPEN, value: FILTER_STATUS_OPEN}
  , {label: 'In Progress', name: FILTER_STATUS_INPROGRESS, value: FILTER_STATUS_INPROGRESS}
  , {label: 'Expired', name: FILTER_STATUS_EXPIRED, value: FILTER_STATUS_EXPIRED}
  , {label: 'Completed', name: FILTER_STATUS_COMPLETED, value: FILTER_STATUS_COMPLETED}
];

const bulkActions = [
  {
    label: 'Delete'
    , name: BULK_ACTION_DELETE
    , value: BULK_ACTION_DELETE
    , showConfirmModal: true
    , confirmModalLabel: 'signature'
    , confirmModalLabelPlural: 'signatures'
    , confirmModalTitle: 'Delete Signatures?'
    , confirmModalConfirmText: 'OK'
    , confirmModalDeclineText: 'Cancel'
    , showCount: true
  }

  , {
    label: 'Set Expiry Date'
    , name: BULK_ACTION_UPDATEEXPIRY
    , value: BULK_ACTION_UPDATEEXPIRY
    , showConfirmModal: false
    , additionalButtonClasses: 'info'
    , showCount: true
  }
];

class SignatureList extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    const { filterData } = props.signatureStore;

    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_TITLE, key: ATTRIBUTE_TITLE, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100} }
      , {label: ATTRIBUTELABEL_CLIENTNAME, key: ATTRIBUTE_CLIENTNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100}, valueFunction: this.getClientCellValue, params: {firmId: this.props.match.params.firmId} }
      , {label: ATTRIBUTELABEL_REQUESTEDBYNAME, key: ATTRIBUTE_REQUESTEDBYNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100} }
      , {label: ATTRIBUTELABEL_SIGNERS, key: ATTRIBUTE_SIGNERS, isSortable: false, headerStyle: {whiteSpace: 'nowrap', maxWidth: 200}, style: {whiteSpace: 'initial', minWidth: 90}}
      , {label: ATTRIBUTELABEL_EXPIREDATE, key: ATTRIBUTE_EXPIREDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 90} }
      , {label: ATTRIBUTELABEL_RESPONSEDATE, key: ATTRIBUTE_RESPONSEDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 90} }
      , {label: ATTRIBUTELABEL_STATUS, key: ATTRIBUTE_STATUS, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{textTransform: 'capitalize'} }
      , {label: ATTRIBUTELABEL_CREATEDDATETIME, key: ATTRIBUTE_CREATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_CREATEDBYNAME, key: ATTRIBUTE_CREATEDBYNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100} }
    ];
    
    this.defaultDisplayColumns = [this.allDisplayColumns[0], this.allDisplayColumns[1], this.allDisplayColumns[2], this.allDisplayColumns[3], this.allDisplayColumns[4], this.allDisplayColumns[6]];
    
    let displayColumns = props.signatureStore.displayColumns;
    if(!displayColumns) {
      displayColumns = localStorageUtils.getJSONValue(LSKEY_DISPLAYCOLUMNS, this.defaultDisplayColumns);
      displayColumns = sanitizeUtils.sanitizeDisplayColumns(displayColumns, this.allDisplayColumns);
      this.props.dispatch(signatureActions.setSignatureDisplayolumns(displayColumns));
    }

    this.state = {
      list: []
      , totalCount: 0
      , isProcessing: false
      , isSelectAllChecked: false
      , selectedRows: {}
      , checkboxes: {}
      , isDateInputModalOpen: false
      , filterStartDate: (filterData.startDate ? filterData.startDate.getTime() : null)
      , filterEndDate: (filterData.endDate ? filterData.endDate.getTime() : null)
      , isSelectDisplayColumnModalOpen : false
      , selectedDisplayColumns: displayColumns
    };

    this._bind(
      'fetchList'
      , 'getDefaultFilterNames'
      , 'refreshList'
      , 'getFilterCriteria'
      , 'getAssociationFilterCriteria'
      , 'getStatusFilterCriteria'
      , 'getExpireDateFilterCriteria'
      , 'onAssociationFilterChange'
      , 'onExpireDateFilterChange'
      , 'onStatusFilterChange'
      , 'onOrderByChange'
      , 'onPageNumberChange'
      , 'onPageSizeChange'
      , 'onSelectAllCheckedChange'
      , 'onSingleCheckboxChange'
      , 'onCheckboxCheckedChange'
      , 'onActionSelected'
      , 'onDateInputModalClose'
      , 'onDateInputModalSave'
      , 'updateListAfterDelete'
      , 'updateListAfterExpiryDateSet'
      , 'onFilterStartDateChange'
      , 'onFilterEndDateChange'
      , 'searchButtonClicked'
      , 'downloadCSVFile'
      , 'showColumnSelectionModal'
      , 'showCheckbox'
      , 'getClientCellValue'
      , 'onRemind'
      , 'displayRemindAction'
      );
  }

  componentDidMount() {
    //console.log('SignatureList.componentDidMount - Here');
    
    const { dispatch, match, signatureStore, socket, loggedInUser, location } = this.props;
    const { filter, filterNames } = signatureStore;

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    let newFilterNames;
    let newFilter = {};
    if(!filterNames.associationFilter) {
      newFilterNames = this.getDefaultFilterNames();
      newFilter = {
        firmId: match.params.firmId
        , orderBy: ATTRIBUTE_EXPIREDATE
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

    const query = new URLSearchParams(location.search);
    const page = query.get('page')
    const perPage = query.get('per')

    newFilter.pageNumber = !!page ? parseInt(page) : newFilter.pageNumber;
    newFilter.pageSize = !!perPage ? parseInt(perPage) : newFilter.pageSize;

    this.fetchList(newFilter, newFilterNames);

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
    //console.log('SignatureList.componentDidUpdate - Here');
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
    //console.log(id);
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

  onDateInputModalClose() {
    this.setState({isDateInputModalOpen: false});
  }
  
  onDateInputModalSave(expireDate) {
    console.log('New Expiry Date: ', new Date(expireDate));

    let selectedIds = [];
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedIds.push(key);
      }
    });
    
    this.setState({isProcessing: true });
    apiUtils.callAPI(API_UPDATE_EXPIRY_BULK, 'POST', {signatureIds: selectedIds, expireDate}).then(
      json => {
        this.setState({
          isProcessing: false
          , isDateInputModalOpen: false
        });
        //console.log('response: ');
        //console.log(json);
        if(json.success) {
          this.feedbackMessage.current.showSuccess('Expiry date updated for the selected signature request' + (selectedIds.length > 1 ? 's' : '') + ' successfully.');
          this.refreshList();
        }
        else {
          this.feedbackMessage.current.showError('Could not update the expiry date of the selected signature request' + (selectedIds.length > 1 ? 's' : '') + '. Please hover over the error icon for the corresponding row to see the error description.');
          this.updateListAfterExpiryDateSet(json.data, new Date(expireDate))
        }
      }
    );
  }
  
  updateListAfterExpiryDateSet(responseList, expireDate) {
    let list = _.cloneDeep(this.state.list);

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
        list[index].errorMessage = item.message;
        //console.log('error "', item.message, '" was returned for id', item.id, 'and has been set in the list');
        if(!item.message) { // success - set the expire date
          list[index].expireDate = expireDate.toISOString();
          //console.log('action was successful for id', item.id, 'and expire date has been set in the list');
        }
      }
    });

    this.setState({list});
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
      //console.log('SignatureList.onActionSelected - here in Delete bulk action ', selectedIds);
      /*****/
      this.setState({isProcessing: true});
      apiUtils.callAPI(API_DELETE_BULK, 'POST', selectedIds).then(
        json => {
          this.setState({isProcessing: false});
          //console.log('SignatureList.onActionSelected - response: ');
          //console.log(json);
          if(json.success) {
            this.feedbackMessage.current.showSuccess('The selected signature request' + (selectedIds.length > 1 ? 's' : '') + ' deleted successfully.');
            this.refreshList();
          }
          else {
            // json.message contains error message from the server
            this.feedbackMessage.current.showError('Could not delete the selected signature request' + (selectedIds.length > 1 ? 's' : '') + '. Please hover over the error icon for the corresponding row to see the error description.');
            this.updateListAfterDelete(json.data);
          }
        }
      );
      /*****/
    }
    else if(action === BULK_ACTION_UPDATEEXPIRY) {
      //console.log('SignatureList.onActionSelected - here in update expiry date bulk action ', selectedIds);
      this.setState({isDateInputModalOpen: true});
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
    const { signatureStore } = this.props;
    const { filter, filterNames } = signatureStore;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.onPageNumberChange(newFilter);
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { signatureStore } = this.props;
    const { filter, filterNames } = signatureStore;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { signatureStore } = this.props;
    const { filter, filterNames } = signatureStore;
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
    //console.log('SignatureList.onOrderByChange - filter:', newFilter);
    this.fetchList(newFilter, filterNames);
  }

  onAssociationFilterChange(value) {
    if(!value) {
      return;
    }
    const { signatureStore } = this.props;
    const { filter, filterNames } = signatureStore;
    if(value === filterNames.associationFilter) {
        return;
    }

    let newFilterNames = {...filterNames, associationFilter: value};
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

  onStatusFilterChange(value) {
    if(!value) {
      return;
    }
    const { signatureStore } = this.props;
    const { filter, filterNames } = signatureStore;
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

  onExpireDateFilterChange(value) {
    if(!value) {
      return;
    }
    const { signatureStore, dispatch } = this.props;
    const { filter, filterNames } = signatureStore;
    //console.log('value: ', value, ', filterNames.expireDateFilter: ', filterNames.expireDateFilter);
    if(value === filterNames.expireDateFilter) {
        return;
    }

    let newFilterNames = {...filterNames, expireDateFilter: value};
    let criteriaObj = this.getFilterCriteria(newFilterNames);
    //console.log('criteriaObj: ', criteriaObj);
    if(!criteriaObj) {
      return;
    }

    let newFilter = {
      ...filter
      , pageNumber: 1
      , group: criteriaObj
    };

    // if either filter start or end date is not given
    if(value === FILTER_EXPIREDATE_CUSTOM && (!this.state.filterStartDate || !this.state.filterEndDate)) {
      let filterData = {
        startDate:(this.state.filterStartDate ? new Date(this.state.filterStartDate) : null)
        , endDate:(this.state.filterEndDate ? new Date(this.state.filterEndDate) : null)
      };
      dispatch(signatureActions.setFilter(newFilterNames, newFilter, filterData));
      return;
    }
    this.fetchList(newFilter, newFilterNames);
  }

  getDefaultFilterNames() {
    return {
      associationFilter: associationFilterNames[0].value
      , statusFilter: FILTER_STATUS_OPEN
      , expireDateFilter: FILTER_EXPIREDATE_ALL
    }
  }

  getFilterCriteria(filterNames) {
    if(!filterNames) {
      return null;
    }

    let groups = [];

    let associationCriteria = this.getAssociationFilterCriteria(filterNames.associationFilter);
    if(!!associationCriteria) {
      groups.push(associationCriteria);
    }

    let statusCriteria = this.getStatusFilterCriteria(filterNames.statusFilter);
    if(!!statusCriteria) {
      groups.push(statusCriteria);
    }

    let expireDateCriteria = this.getExpireDateFilterCriteria(filterNames.expireDateFilter);
    if(!!expireDateCriteria) {
      groups.push(expireDateCriteria);
    }

    let criteriaObj = {
      operator: searchConstants.OPERATOR_AND
      , groups: groups
    };
    //console.log('criteriaGroupObj: ', criteriaGroupObj);
    return criteriaObj;
  }

  getAssociationFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }

    let criteriaGroup = {
      Association_AllClients: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_NOT_NULL
          }
          , {
            fieldName: ATTRIBUTE_TYPE
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_TYPE_SIGNATUREREQUEST
          }
        ]
      },
      Association_My: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_NULL
          }
          , {
            fieldName: ATTRIBUTE_TYPE
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_TYPE_SIGNATUREREQUEST
          }
          , {
            fieldName: ATTRIBUTE_USERID
            , operator: searchConstants.OPERATOR_EQUAL
            , value: this.props.loggedInUser._id
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
      Status_All: null
      , Status_Open: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_EXPIREDATE
                , operator: searchConstants.OPERATOR_GREATERTHAN_EQUAL
                , value: dateUtils.getDateTimeStartISOString(new Date())
              }
              , {
                fieldName: ATTRIBUTE_EXPIREDATE
                , operator: searchConstants.OPERATOR_NULL
              }
            ]
          }
        ]
      }
      , Status_InProgress: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
          , {
            fieldName: ATTRIBUTE_RESPONSEDATE
            , operator: searchConstants.OPERATOR_NOT_NULL
          }
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_EXPIREDATE
                , operator: searchConstants.OPERATOR_GREATERTHAN_EQUAL
                , value: dateUtils.getDateTimeStartISOString(new Date())
              }
              , {
                fieldName: ATTRIBUTE_EXPIREDATE
                , operator: searchConstants.OPERATOR_NULL
              }
            ]
          }
        ]
      }
      , Status_Expired: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
          , {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_LESSTHAN
            , value: dateUtils.getDateTimeStartISOString(new Date())    
          }
        ]
      }
      , Status_Completed: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_COMPLETED
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  getExpireDateFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }
    let criteriaGroup = {
      ExpireDate_All: null
      , ExpireDate_Overdue: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_LESSTHAN
            , value: dateUtils.getDateTimeStartISOString(new Date())
          }
          , {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
        ]
      }
      , ExpireDate_Today: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getDateTimeStartISOString(new Date()), dateUtils.getDateTimeEndISOString(new Date())]
          }
          , {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
        ]
      }
      , ExpireDate_ThisWeek: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfWeekISOString(new Date()), dateUtils.getEndOfWeekISOString(new Date())]
          }
          , {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
        ]
      }
      , ExpireDate_ThisMonth: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfMonthISOString(new Date()), dateUtils.getEndOfMonthISOString(new Date())]
          }
          , {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
        ]
      }
      , ExpireDate_ThisYear: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfYearISOString(new Date()), dateUtils.getEndOfYearISOString(new Date())]
          }
          , {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_OPEN
          }
        ]
      }
      , ExpireDate_Custom: (!this.state.filterStartDate || !this.state.filterStartDate ? null : {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getDateTimeStartISOString(new Date(this.state.filterStartDate)), dateUtils.getDateTimeEndISOString(new Date(this.state.filterEndDate))]
          }
        ]
      })
    };
    //console.log('State: filterStartDate:', this.state.filterStartDate, ', filterEndDate:', this.state.filterEndDate)
    return (criteriaGroup[filterName]);
  }

  refreshList() {
    const {signatureStore} = this.props;
    const {filter, filterNames} = signatureStore;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    let filterData = {
      startDate:(this.state.filterStartDate ? new Date(this.state.filterStartDate) : null)
      , endDate:(this.state.filterEndDate ? new Date(this.state.filterEndDate) : null)
    };

    //console.log('SignatureList.fetchList - Filter:', filter);
    //console.log('FilterNames: ', filterNames);
    const { dispatch } = this.props;
    this.setState({isProcessing: true});
    dispatch(signatureActions.setFilter(filterNames, filter, filterData));
    //console.log('State: ');
    //console.log(this.state);
    apiUtils.callAPI(API_SEARCH, 'POST', filter).then(
      json => {
        //console.log('response: ');
        //console.log(json);
        let checkboxes = {};
        let isCheckboxVisible = this.showCheckbox;
        _.forEach(json.results, function(signature) {
          if(isCheckboxVisible(signature) === true) {
            checkboxes[signature[ATTRIBUTE_ID]] = false;
          }
        });
        this.setState({
          list: json.results || []
          , totalCount: json.totalCount
          , isProcessing: false
          , checkboxes: checkboxes
        });
      }
    )
  }

  onFilterStartDateChange(event) {
    let filterStartDate = event.target.value;
    if(!filterStartDate) {
      filterStartDate = null;
    }
    //console.log('Selected Start Date:', filterStartDate);
    this.setState({filterStartDate});
  }

  onFilterEndDateChange(event) {
    let filterEndDate = event.target.value;
    if(!filterEndDate) {
      filterEndDate = null;
    }
    //console.log('Selected End Date:', filterEndDate);
    this.setState({filterEndDate});
  }

  searchButtonClicked() {
    const { signatureStore } = this.props;
    const { filter, filterNames } = signatureStore;
    let newFilterNames = filterNames;
    let criteriaObj = this.getFilterCriteria(newFilterNames);
    //console.log('criteriaObj: ', criteriaObj);
    if(!criteriaObj) {
      return;
    }

    let newFilter = {
      ...filter
      , pageNumber: 1
      , group: criteriaObj
    };
    this.fetchList(newFilter, newFilterNames);
  }

  showCheckbox(signature) {
    return !(signature[ATTRIBUTE_STATUS] === DB_STATUS_COMPLETED || !!signature[ATTRIBUTE_RESPONSEDATE]);
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
    dispatch(signatureActions.setSignatureDisplayolumns(displayColumns));
    //this.refreshList();
  }

  downloadCSVFile() {
    const { signatureStore } = this.props;
    const { filter } = signatureStore;

    apiUtils.downloadFile(API_SEARCH, 'POST', filter).then(blob => {
      saveAs(blob, 'Signature Requests.csv');
    });
  }
  
  showColumnSelectionModal() {
    this.setState({isSelectDisplayColumnModalOpen: true});
  }
  
  getClientCellValue(attributeValue, signature, params) {
    return links.getClientFilesLink(signature[ATTRIBUTE_CLIENTID], signature[ATTRIBUTE_CLIENTNAME], params.firmId);
  }

  onRemind(event, signature) {
    //console.log('Row event Remind clicked for signature [id:', signature[ATTRIBUTE_ID] + ', title:' + signature[ATTRIBUTE_TITLE]);
    this.setState({isProcessing: true});
    let URL = API_SEND_REMINDER(signature[ATTRIBUTE_ID]);
    let headers = {'Accept': 'application/json'};
    apiUtils.callAPI(URL, 'GET', null, headers)
    .then(
      json => {
        //console.log('response: ');
        //console.log(json);
        
        this.setState({isProcessing: false});

        if(json.success) {
          this.feedbackMessage.current.showSuccess('The reminder has been sent to the signer(s) successfully.');
        }
        else {
          // json.message contains error message from the server
          this.feedbackMessage.current.showError(json.message);
          //this.feedbackMessage.current.showError('Could not send the reminder to the signer(s) because "' + json.message + '"');
        }
      }
    )
  }

  displayRemindAction(signature) {
    return !(signature[ATTRIBUTE_STATUS] === DB_STATUS_COMPLETED || !!signature[ATTRIBUTE_RESPONSEDATE]);
  }

  render() {
    const {
      list
      , checkboxes
      , filterStartDate
      , filterEndDate
      , isSelectDisplayColumnModalOpen
      , selectedDisplayColumns
    } = this.state;

    const { 
      location
      , staffStore
      , loggedInUser
      , match
      , signatureStore
      , socket
    } = this.props;

    const isFetching = this.state.isProcessing;
    //console.log(new Date().getTime(), '- In SignatureList.render - isProcessing:', isFetching);

    const { filter } = signatureStore;

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const ownerPermissions = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
    const hasESignAccess = permissions.hasESignAccess(staffStore, match.params.firmId);
    const isEmpty = !list || list.length < 1;

    const filterNames = this.props.signatureStore.filterNames.associationFilter ? this.props.signatureStore.filterNames : this.getDefaultFilterNames();

    let errors = [];
    if(!isEmpty) {
      errors = list.filter(item => {
        if(!!item.errorMessage) {
          //console.log('row with error message:', item);
          return true;
        }
        return false;
      });
    }
    //console.log('errors:', errors);

    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = (errors && errors.length > 0);
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = (filterNames.statusFilter !== FILTER_STATUS_COMPLETED && hasESignAccess === true);
    columnVisibility[ATTRIBUTE_TITLE] = true;
    columnVisibility[ATTRIBUTE_CREATEDBYNAME] = true;
    columnVisibility[ATTRIBUTE_REQUESTEDBYNAME] = filterNames.associationFilter === FILTER_ASSOCIATION_MY;
    columnVisibility[ATTRIBUTE_SIGNERS] = true;
    columnVisibility[ATTRIBUTE_CLIENTNAME] = !(filterNames.associationFilter === FILTER_ASSOCIATION_MY);
    columnVisibility[ATTRIBUTE_CREATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_UPDATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_EXPIREDATE] = !(filterNames.expireDateFilter === FILTER_EXPIREDATE_TODAY);
    columnVisibility[ATTRIBUTE_STATUS] = ((filterNames.statusFilter === FILTER_STATUS_ALL || filterNames.statusFilter === FILTER_STATUS_OPEN) && (filterNames.expireDateFilter === FILTER_EXPIREDATE_ALL || filterNames.expireDateFilter === FILTER_EXPIREDATE_CUSTOM));
    columnVisibility[ATTRIBUTE_RESPONSEDATE] = !(filterNames.statusFilter === FILTER_STATUS_EXPIRED || filterNames.expireDateFilter !== FILTER_EXPIREDATE_ALL);

    let singleObjectActions = [
      {label: 'Remind', eventHandler: this.onRemind, displayCriteriaFunction: this.displayRemindAction, tooltipText: 'Send reminder email to signer(s)', style: {}}
    ];

    let selectedSignatureCount = 0;
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedSignatureCount++;
      }
    });
    const isExpiryDateFilterEnabled = filterNames.statusFilter !== FILTER_STATUS_COMPLETED;
    const disableSearchButton = (filterStartDate == null || filterEndDate == null);
    //console.log('test 12345');
    //console.log(list)
    return  (
      <PracticeLayout >
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isFetching} />
        <Helmet>
          <title>Signatures</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>{ ownerPermissions ? 'All ' : 'My '} Signatures</h1>
        </div>
        <div className="-practice-content">
          <div className="yt-container fluid">
            <div className="yt-toolbar -mobile-yt-hide">
                <div className="yt-tools space-between">
                  <div className="-filters -left">
                    <span>Filters </span>
                    <FilterList
                      label='Status'
                      select={this.onStatusFilterChange}
                      displayKey="label"
                      items={statusFilterNames}
                      selected={filterNames.statusFilter}
                      valueKey="value"
                      name="_filterStatus"
                      isEnabled={true}
                    />
                    <FilterList
                      label='Type'
                      select={this.onAssociationFilterChange}
                      displayKey='label'
                      items={associationFilterNames}
                      selected={filterNames.associationFilter}
                      valueKey='value'
                      name='_filterAssociation'
                      isEnabled={true}
                    />
                    <FilterList
                      label='Expiry'
                      select={this.onExpireDateFilterChange}
                      displayKey="label"
                      items={expireDateFilterNames}
                      selected={filterNames.expireDateFilter}
                      valueKey="value"
                      name="_filterExpireDate"
                      isEnabled={isExpiryDateFilterEnabled}
                    />
                    { filterNames.expireDateFilter === FILTER_EXPIREDATE_CUSTOM ?
                    (
                    <div style={{display: 'flex'}}>
                      <div style={{paddingTop: 9, paddingLeft: 10}}>
                        Start
                      </div>
                      <SingleDatePickerInput
                        anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                        change={this.onFilterStartDateChange}
                        enableOutsideDays={false}
                        initialDate={this.state.filterStartDate} // epoch/unix time in milliseconds
                        inputClasses=""
                        minDate={new Date(2010, 0, 1).getTime()}
                        name='filterStartDate'
                        numberOfMonths={1}
                        placeholder={""}
                      />
                      <div style={{paddingTop: 9, paddingLeft: 10}}>
                        End
                      </div>
                      <SingleDatePickerInput
                        anchorDirection="right" // This aligns the calendar drop down to the right side of the date-input. Default is to the left.
                        change={this.onFilterEndDateChange}
                        enableOutsideDays={false}
                        initialDate={this.state.filterEndDate} // epoch/unix time in milliseconds
                        inputClasses=""
                        minDate={new Date(2010, 0, 1).getTime()}
                        name='filterEndDate'
                        numberOfMonths={1}
                        placeholder={""}
                      />
                      <button type="button" onClick={()=> this.searchButtonClicked()} disabled={disableSearchButton} className=' yt-btn x-small -filter-btn -filter-applied' style={{marginLeft: 10}}>Apply</button>
                    </div>
                    )
                    : null
                    }
                  </div>
                </div>
              </div>
              <hr className="-mobile-yt-hide" />
              <div>
              <div className="table-wrapper -practice-table-wrapper" style={{ opacity: isFetching ? 0.5 : 1 }}>
                <div className="table-actions">
                  {hasESignAccess ?
                  <ButtonList
                      label='Actions'
                      select={this.onActionSelected}
                      displayKey="label"
                      items={bulkActions}
                      valueKey="value"
                      name="_bulkActions"
                      selectedRowCount={selectedSignatureCount}
                      isEnabled={selectedSignatureCount > 0}
                  />
                  : null
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
                      onClick={this.showColumnSelectionModal}
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
                  itemName="signature requests"
                />
                <DataTable
                  displayColumns={selectedDisplayColumns}
                  columnVisibility={columnVisibility}
                  data={list}
                  onSort={this.onOrderByChange}
                  currentSortOrderAttribute={orderBy}
                  isCurrentSortOrderAscending={sortOrderAscending}
                  checkboxesState={checkboxes}
                  checkboxNamePrefix="signature"
                  onSelectAllCheckboxStateChange={this.onSelectAllCheckedChange}
                  onCheckboxStateChange={this.onSingleCheckboxChange}
                  isSelectAllChecked={this.state.isSelectAllChecked}
                  checkboxDisplayCriteriaFunction={this.showCheckbox}
                  rowActions={singleObjectActions}
                  animate={true}
                  emptyTableMessage='No signature requests found'
                  isProcessing={isFetching}
                />
              </div>
              <PageTabber
                totalItems={totalCount}
                totalPages={Math.ceil(totalCount / pageSize)}
                pagination={({per: pageSize, page: pageNumber})}
                setPagination={this.onPageNumberChange}
                setPerPage={this.onPageSizeChange}
                viewingAs="bottom"
                itemName="signature requests"
              />
            </div>
          </div>
        </div>
        <DateInputModal
          onClose={this.onDateInputModalClose}
          onSave={this.onDateInputModalSave}
          isOpen={this.state.isDateInputModalOpen}
          socket={socket}
        />
        <SelectOrderedSubList
          isOpen={isSelectDisplayColumnModalOpen}
          allItems={this.allDisplayColumns}
          selectedItems={selectedDisplayColumns}
          displayKey='label'
          valueKey='key'
          onDone={(selectedDisplayColumns) => {this.onDisplayColumnChange(selectedDisplayColumns);}}
          onCancelled={() => {this.setState({isSelectDisplayColumnModalOpen: false});}}
        />
      </PracticeLayout>
    )
  }

}

SignatureList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , signatureStore: store.signature
    , staffStore: store.staff
    , socket: store.user.socket
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SignatureList)
);
