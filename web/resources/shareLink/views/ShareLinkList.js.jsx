/**
 * view component for /firm/:firmId/sharelinks
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';

// import constants
import * as constants from '../../../config/constants.js';
import * as searchConstants from '../../../global/utils/searchConstants';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import {SingleDatePickerInput} from '../../../global/components/forms';
import DataTable from '../../../global/components/DataTable.js.jsx';
import FilterList from '../../../global/components/helpers/FilterList.js.jsx';
import ButtonList from '../../../global/components/helpers/ButtonList.js.jsx';
import {FeedbackMessage} from '../../../global/components/helpers/FeedbackMessage.js.jsx';
import {LoadingBiscuit} from '../../../global/components/helpers/LoadingBiscuit.js.jsx';
import SelectOrderedSubList from '../../../global/components/helpers/SelectOrderedSubList.js.jsx';

// import utilities
import { permissions, dateUtils } from '../../../global/utils';
import _ from 'lodash';

// import firm components
import PracticeLayout from '../../../global/practice/components/PracticeLayout.js.jsx';

// import actions
import * as shareLinkActions from '../shareLinkActions';
import * as staffActions from '../../staff/staffActions';
import * as firmActions from '../../firm/firmActions';

// import api utility
import apiUtils from '../../../global/utils/api';

// To force the download of the CSV file fetched from the server, in the client's browser.
import { saveAs } from "file-saver";
import localStorageUtils from '../../../global/utils/localStorageUtils.js';
import sanitizeUtils from '../../../global/utils/sanitizeUtils.js';
import links from '../../../global/components/navigation/links.js.jsx';

const LSKEY_DISPLAYCOLUMNS = 'ShareLinkList_DisplayColumns';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/share-links/search';
//const API_DELETE = '/api/share-links/';
const API_DELETE_BULK = '/api/share-links/bulk-delete';
//const API_UPDATE_EXPIRY_BULK = '/api/share-links/bulk-update-expiry';

// The following FILTER_XXX constant values are hard-coded in
// getXXXFilterCriteria functions. So if you need to change one, make sure it is
// changed in the corresponding function as well.
const FILTER_ASSOCIATION_ALLCLIENTS = 'Association_AllClients';
//const FILTER_ASSOCIATION_SELECTCLIENT = 'Association_SelectClients';
const FILTER_ASSOCIATION_MY = 'Association_My';

const FILTER_LINKTYPE_ALL = 'LinkType_All';
const FILTER_LINKTYPE_SHARE = 'LinkType_Share';
const FILTER_LINKTYPE_OTHERS = 'LinkType_Others';
const FILTER_LINKTYPE_FILEREQUEST = 'LinkType_FileRequest';

const FILTER_STATUS_ALL = 'Status_All';
const FILTER_STATUS_OPEN = 'Status_Open';
const FILTER_STATUS_EXPIRED = 'Status_Expired';
const FILTER_STATUS_COMPLETED = 'Status_Completed';

const FILTER_EXPIREDATE_ALL = 'ExpireDate_All';
const FILTER_EXPIREDATE_OVERDUE = 'ExpireDate_Overdue';
const FILTER_EXPIREDATE_TODAY = 'ExpireDate_Today';
const FILTER_EXPIREDATE_THISWEEK = 'ExpireDate_ThisWeek';
const FILTER_EXPIREDATE_THISMONTH = 'ExpireDate_ThisMonth';
const FILTER_EXPIREDATE_THISYEAR = 'ExpireDate_ThisYear';
const FILTER_EXPIREDATE_CUSTOM = 'ExpireDate_Custom';

const DB_STATUS_COMPLETED = "closed";
const DB_STATUS_OPEN = "open";
const DB_TYPE_SHARE = "share";
const DB_TYPE_REQUEST = "request";
const DB_TYPE_FILEREQUEST = "file-request";
const DB_TYPE_SIGNATUREREQUEST = "signature-request";

const ATTRIBUTE_TYPE = "type";
const ATTRIBUTE_CLIENTID = "clientId";
const ATTRIBUTE_USERID = "userId";
const ATTRIBUTE_PROMPT = "prompt";
const ATTRIBUTE_CLIENTNAME = "clientName";
const ATTRIBUTE_FILEIDS = "files";
const ATTRIBUTE_FILENAMES = "fileNames";
const ATTRIBUTE_FILESTATUSES = 'fileStatuses';
const ATTRIBUTE_CREATEDDATETIME = "createdDateTime";
const ATTRIBUTE_UPDATEDDATETIME = "updatedDateTime";
const ATTRIBUTE_EXPIREDATE = "expireDate";
const ATTRIBUTE_STATUS = "status";
const ATTRIBUTE_RESPONSEDATE = "responseDate";

const ATTRIBUTELABEL_TYPE = "Type";
const ATTRIBUTELABEL_PROMPT = "Prompt";
const ATTRIBUTELABEL_CLIENTNAME = "Client";
const ATTRIBUTELABEL_FILENAMES = "File(s)";
const ATTRIBUTELABEL_CREATEDDATETIME = "Created On";
const ATTRIBUTELABEL_UPDATEDDATETIME = "Last Updated On";
const ATTRIBUTELABEL_EXPIREDATE = "Expiry Date";
const ATTRIBUTELABEL_STATUS = "Status";
const ATTRIBUTELABEL_RESPONSEDATE = "Response Date";

const BULK_ACTION_DELETE = "Action_Delete";
//const BULK_ACTION_UPDATEEXPIRY = "Action_UpdateExpiry";

const associationFilterNames = [
  {label: 'All Clients', name: FILTER_ASSOCIATION_ALLCLIENTS, value: FILTER_ASSOCIATION_ALLCLIENTS}
  , {label: 'My', name: FILTER_ASSOCIATION_MY, value: FILTER_ASSOCIATION_MY}
];

const linkTypeFilterNames = [
  {label: 'All', name: FILTER_LINKTYPE_ALL, value: FILTER_LINKTYPE_ALL}
  , {label: 'Shared Links', name: FILTER_LINKTYPE_SHARE, value: FILTER_LINKTYPE_SHARE}
  , {label: 'File Requests', name: FILTER_LINKTYPE_FILEREQUEST, value: FILTER_LINKTYPE_FILEREQUEST}
  , {label: 'Other Requests', name: FILTER_LINKTYPE_OTHERS, value: FILTER_LINKTYPE_OTHERS}
];

const statusFilterNames = [
  {label: 'All', name: FILTER_STATUS_ALL, value: FILTER_STATUS_ALL}
  , {label: 'Open', name: FILTER_STATUS_OPEN, value: FILTER_STATUS_OPEN}
  , {label: 'Expired', name: FILTER_STATUS_EXPIRED, value: FILTER_STATUS_EXPIRED}
  , {label: 'Completed', name: FILTER_STATUS_COMPLETED, value: FILTER_STATUS_COMPLETED}
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

const bulkActions = [
  {
    label: 'Delete'
    , name: BULK_ACTION_DELETE
    , value: BULK_ACTION_DELETE
    , showConfirmModal: true
    , confirmModalLabel: 'shared link'
    , confirmModalLabelPlural: 'shared links'
    , confirmModalTitle: 'Delete Shared Links?'
    , confirmModalConfirmText: 'OK'
    , confirmModalDeclineText: 'Cancel'
    , showCount: true
  }
  /*
  , {
    label: 'Set Expiry Date'
    , name: BULK_ACTION_UPDATEEXPIRY
    , value: BULK_ACTION_UPDATEEXPIRY
    , showConfirmModal: false
    , additionalButtonClasses: 'info'
    , showCount: true
  }
  */
];

class ShareLinkList extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    //console.log('props.shareLinkStore', props.shareLinkStore);
    const { filterData } = props.shareLinkStore;
    const params = {firmId: this.props.match.params.firmId};
    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_TYPE, key: ATTRIBUTE_TYPE, isSortable: true, headerStyle: {whiteSpace: 'nowrap', maxWidth: 200}, style: {whiteSpace: 'initial', minWidth: 90}}
      , {label: ATTRIBUTELABEL_CLIENTNAME, key: ATTRIBUTE_CLIENTNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100}, valueFunction: this.getClientCellValue, params: params}
      , {label: ATTRIBUTELABEL_FILENAMES, key: ATTRIBUTE_FILENAMES, isSortable: false, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 80, maxWidth: 250}, valueFunction: this.getFileNameCellValue, params: params }
      , {label: ATTRIBUTELABEL_PROMPT, key: ATTRIBUTE_PROMPT, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100} }
      , {label: ATTRIBUTELABEL_CREATEDDATETIME, key: ATTRIBUTE_CREATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_EXPIREDATE, key: ATTRIBUTE_EXPIREDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 90} }
      , {label: ATTRIBUTELABEL_STATUS, key: ATTRIBUTE_STATUS, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{textTransform: 'capitalize'} }
    ];
    
    this.defaultDisplayColumns = this.allDisplayColumns;
    let displayColumns = props.shareLinkStore.displayColumns;
    if(!displayColumns) {
      displayColumns = localStorageUtils.getJSONValue(LSKEY_DISPLAYCOLUMNS, this.defaultDisplayColumns);
      displayColumns = sanitizeUtils.sanitizeDisplayColumns(displayColumns, this.allDisplayColumns);
      this.props.dispatch(shareLinkActions.setShareLinkDisplayolumns(displayColumns));
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
      , 'getLinkTypeFilterCriteria'
      , 'getExpireDateFilterCriteria'
      , 'getStatusFilterCriteria'
      , 'onAssociationFilterChange'
      , 'onLinkTypeFilterChange'
      , 'onExpireDateFilterChange'
      , 'onStatusFilterChange'
      , 'onDisplayColumnChange'
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
      , 'showSelectDisplayColumnModal'
      , 'getClientCellValue'
      , 'getFileNameCellValue'
    );
  }

  componentDidMount() {
    console.log('here in ShareLinkList.componentDidMount');
    
    const { dispatch, match, shareLinkStore, socket, loggedInUser } = this.props;
    const { filter, filterNames } = shareLinkStore;

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    let newFilterNames;
    let newFilter = {};
    if(!filterNames.associationFilter) {
      newFilterNames = this.getDefaultFilterNames();
      newFilter = {
        firmId: this.props.match.params.firmId
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
    //console.log('here in ShareLinkList.componentDidUpdate');
  }

  getDefaultFilterNames() {
    return {
      associationFilter: associationFilterNames[0].value
      , linkTypeFilter: FILTER_LINKTYPE_ALL
      , expireDateFilter: FILTER_EXPIREDATE_ALL
      , statusFilter: FILTER_STATUS_ALL
    }
  }

  onSelectAllCheckedChange() {
    let newSelectAllState = !this.state.isSelectAllChecked;
    let newCheckboxesState = _.cloneDeep(this.state.checkboxes);
    
    _.forEach(newCheckboxesState, function(value, key) {
      newCheckboxesState[key] = newSelectAllState;
    });
    this.setState({
      ...this.state
      , checkboxes: newCheckboxesState
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
      ...this.state
      , checkboxes: newCheckboxesState
      , isSelectAllChecked: allChecked
    });
  }

  onDateInputModalClose() {
    this.setState({...this.state, isDateInputModalOpen: false});
  }
  
  onDateInputModalSave(expireDate) {
    console.log('New Expiry Date: ', new Date(expireDate));

    let selectedIds = [];
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedIds.push(key);
      }
    });
    
    this.setState({...this.state, isProcessing: true });
    apiUtils.callAPI(API_UPDATE_EXPIRY_BULK, 'POST', {sharelinkIds: selectedIds, expireDate}).then(
      json => {
        this.setState({
          ...this.state
          , isProcessing: false
          , isDateInputModalOpen: false
        });
        console.log('response: ');
        console.log(json);
        if(json.success) {
          this.feedbackMessage.current.showSuccess('Expiry date updated for the selected shared link' + (selectedIds.length > 1 ? 's' : '') + ' successfully.');
          this.refreshList();
        }
        else {
          this.feedbackMessage.current.showError('Could not update the expiry date of the selected shared link' + (selectedIds.length > 1 ? 's' : '') + '. Please hover over the error icon for the corresponding row to see the error description.');
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
      console.log('here in Delete bulk action ', selectedIds);
      /*****/
      this.setState({
        ...this.state
        , isProcessing: true
      });
      apiUtils.callAPI(API_DELETE_BULK, 'POST', selectedIds).then(
        json => {
          this.setState({
            ...this.state
            , isProcessing: false
          });
          console.log('response: ');
          console.log(json);
          if(json.success) {
            this.feedbackMessage.current.showSuccess('The selected link' + (selectedIds.length > 1 ? 's' : '') + ' deleted successfully.');
            this.refreshList();
          }
          else {
            // json.message contains error message from the server
            this.feedbackMessage.current.showError('Could not delete the selected link' + (selectedIds.length > 1 ? 's' : '') + '. Please hover over the error icon for the corresponding row to see the error description.');
            this.updateListAfterDelete(json.data);
          }
        }
      );
      /*****/
    }
    /*
    else if(action === BULK_ACTION_UPDATEEXPIRY) {
      console.log('here in update expiry date bulk action ', selectedIds);
      this.setState({...this.state, isDateInputModalOpen: true});
    }
    */
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
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
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

  onAssociationFilterChange(value) {
    if(!value) {
      return;
    }
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
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

  onLinkTypeFilterChange(value) {
    if(!value) {
      return;
    }
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
    if(value === filterNames.linkTypeFilter) {
        return;
    }

    let newFilterNames = {...filterNames, linkTypeFilter: value};
    if(value === FILTER_LINKTYPE_SHARE) {
      newFilterNames.statusFilter = FILTER_STATUS_ALL;
    }
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
    const { shareLinkStore, dispatch } = this.props;
    const { filter, filterNames } = shareLinkStore;
    //console.log('filter: ', filter);
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
      dispatch(shareLinkActions.setShareLinkFilter(newFilterNames, newFilter, filterData));
      return;
    }
    this.fetchList(newFilter, newFilterNames);
  }

  onStatusFilterChange(value) {
    if(!value) {
      return;
    }
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
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

  getFilterCriteria(filterNames) {
    if(!filterNames) {
      return null;
    }

    let groups = [];

    let associationCriteria = this.getAssociationFilterCriteria(filterNames.associationFilter);
    if(!!associationCriteria) {
      groups.push(associationCriteria);
    }

    let linkTypeCriteria = this.getLinkTypeFilterCriteria(filterNames.linkTypeFilter);
    if(!!linkTypeCriteria) {
      groups.push(linkTypeCriteria);
    }

    let expireDateCriteria = this.getExpireDateFilterCriteria(filterNames.expireDateFilter);
    if(!!expireDateCriteria) {
      groups.push(expireDateCriteria);
    }

    let statusCriteria = this.getStatusFilterCriteria(filterNames.statusFilter);
    if(!!statusCriteria) {
      groups.push(statusCriteria);
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
            fieldName: ATTRIBUTE_USERID
            , operator: searchConstants.OPERATOR_EQUAL
            , value: this.props.loggedInUser._id
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  getLinkTypeFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }

    let criteriaGroup = {
      LinkType_All: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_TYPE
            , operator: searchConstants.OPERATOR_NOT_EQUAL
            , value: DB_TYPE_SIGNATUREREQUEST
          }
        ]
      }
      , LinkType_Share: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_TYPE
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_TYPE_SHARE
          }
        ]
      }
      , LinkType_Others: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_TYPE
            , operator: searchConstants.OPERATOR_NOT_IN
            , value: [DB_TYPE_SIGNATUREREQUEST, DB_TYPE_SHARE, DB_TYPE_FILEREQUEST]
          }
        ]
      }
      , LinkType_FileRequest: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_TYPE
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_TYPE_FILEREQUEST
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
        operator: searchConstants.OPERATOR_OR
        , groups: [
          {
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
        ]
      }
      , Status_Expired: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_EXPIREDATE
            , operator: searchConstants.OPERATOR_LESSTHAN
            , value: dateUtils.getDateTimeStartISOString(new Date())    
          }
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_EQUAL
                , value: DB_STATUS_OPEN
              }
            ]
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
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NOT_EQUAL
                , value: DB_STATUS_COMPLETED
              }
            ]
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
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NOT_EQUAL
                , value: DB_STATUS_COMPLETED
              }
            ]
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
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NOT_EQUAL
                , value: DB_STATUS_COMPLETED
              }
            ]
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
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NOT_EQUAL
                , value: DB_STATUS_COMPLETED
              }
            ]
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
        ]
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NOT_EQUAL
                , value: DB_STATUS_COMPLETED
              }
            ]
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
        , groups: [
          {
            operator: searchConstants.OPERATOR_OR
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NULL
              }
              , {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_NOT_EQUAL
                , value: DB_STATUS_COMPLETED
              }
            ]
          }
        ]
      })
    };
    //console.log('State: filterStartDate:', this.state.filterStartDate, ', filterEndDate:', this.state.filterEndDate)
    return (criteriaGroup[filterName]);
  }

  refreshList() {
    //console.log('About to refresh list');
    const {shareLinkStore} = this.props;
    const {filter, filterNames} = shareLinkStore;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    let filterData = {
      startDate:(this.state.filterStartDate ? new Date(this.state.filterStartDate) : null)
      , endDate:(this.state.filterEndDate ? new Date(this.state.filterEndDate) : null)
    };

    //console.log('Filter: ', filter);
    //console.log('FilterNames: ', filterNames);
    const { dispatch } = this.props;
    this.setState({isProcessing: true});
    dispatch(shareLinkActions.setShareLinkFilter(filterNames, filter, filterData));
    //console.log('State: ');
    //console.log(this.state);
    apiUtils.callAPI(API_SEARCH, 'POST', filter).then(
      json => {
        //console.log('response: ');
        //console.log(json);
        let checkboxes = {};
        _.forEach(json.results, function(sharelink) {
          if(sharelink.status !== DB_STATUS_COMPLETED) {
            checkboxes[sharelink.id] = false;
          }
          sharelink.type = (sharelink.type !== DB_TYPE_SHARE ? 'Shared Link' : sharelink.type !== DB_TYPE_FILEREQUEST ? 'File Request' : sharelink.status);
          //sharelink.status = (sharelink.status !== "closed" && !!sharelink.responseDate) ? "partially signed" : sharelink.status;
        });

        this.setState({
          list: json.results
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
    const { shareLinkStore } = this.props;
    const { filter, filterNames } = shareLinkStore;
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

  onDisplayColumnChange(displayColumns) {
    //console.log('Selected Display Columns: ', displayColumns);
    const { dispatch } = this.props;

    this.setState({
      selectedDisplayColumns: displayColumns
      , isSelectDisplayColumnModalOpen: false
    });

    localStorageUtils.setJSONValue(LSKEY_DISPLAYCOLUMNS, displayColumns);

    //console.log('selectedDisplayColumns', displayColumns);
    dispatch(shareLinkActions.setShareLinkDisplayolumns(displayColumns));
  }

  downloadCSVFile() {
    const { shareLinkStore } = this.props;
    const { filter } = shareLinkStore;

    apiUtils.downloadFile(API_SEARCH, 'POST', filter).then(blob => {
      saveAs(blob, 'Shared Links.csv');
    });
  }
  
  showSelectDisplayColumnModal() {
    this.setState({isSelectDisplayColumnModalOpen: true});
  }
  
  getClientCellValue(attributeValue, shareLink, params) {
    return links.getClientFilesLink(shareLink[ATTRIBUTE_CLIENTID], shareLink[ATTRIBUTE_CLIENTNAME], params.firmId);
  }

  getFileNameCellValue(attributeValue, shareLink, params) {
    const fileIds = shareLink[ATTRIBUTE_FILEIDS];
    if(!fileIds || fileIds.length < 1) {
      return attributeValue;
    }

    const clientId = shareLink[ATTRIBUTE_CLIENTID];
    const fileNames = shareLink[ATTRIBUTE_FILENAMES];
    const fileStatuses = shareLink[ATTRIBUTE_FILESTATUSES];
    return fileIds.map((item, index) => {
      let isDeleted = fileStatuses[index] === constants.DB_FILE_STATUS_DELETED;
      return links.getFileLink(item, fileNames[index], '', 'file', isDeleted, clientId, params.firmId);
    });
    /*
    const fileId = fileIds[0];
    const fileName = shareLink[ATTRIBUTE_FILENAMES][0];
    const fileCategory = 'file';
    const fileExtension = '';
    return links.getFileLink(fileId, fileName, fileExtension, fileCategory, isDeleted, clientId, params.firmId);
    */
  }

  render() {
    const {
      list
      , checkboxes
      , isProcessing
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
      , shareLinkStore
      , socket
    } = this.props;

    const { filter } = shareLinkStore;

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const ownerPermissions = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
    const isEmpty = !list || list.length < 1;

    const filterNames = shareLinkStore.filterNames.associationFilter ? shareLinkStore.filterNames : this.getDefaultFilterNames();
    const errors = list.filter(item => {
      return !!item.errorMessage;
    });
    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = errors && errors.length > 0;
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = filterNames.statusFilter !== FILTER_STATUS_COMPLETED;
    columnVisibility[ATTRIBUTE_TYPE] = (filterNames.linkTypeFilter === FILTER_LINKTYPE_ALL || filterNames.linkTypeFilter === FILTER_LINKTYPE_OTHERS);
    columnVisibility[ATTRIBUTE_CLIENTNAME] = !(filterNames.associationFilter === FILTER_ASSOCIATION_MY);
    columnVisibility[ATTRIBUTE_FILENAMES] = (filterNames.linkTypeFilter === FILTER_LINKTYPE_ALL || filterNames.linkTypeFilter === FILTER_LINKTYPE_SHARE || filterNames.linkTypeFilter === FILTER_LINKTYPE_FILEREQUEST);
    columnVisibility[ATTRIBUTE_PROMPT] = true;
    columnVisibility[ATTRIBUTE_CREATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_UPDATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_EXPIREDATE] = !(filterNames.expireDateFilter === FILTER_EXPIREDATE_TODAY);
    columnVisibility[ATTRIBUTE_STATUS] = (filterNames.statusFilter === FILTER_STATUS_ALL && filterNames.linkTypeFilter !== FILTER_LINKTYPE_SHARE && filterNames.linkTypeFilter !== FILTER_LINKTYPE_OTHERS);

    let singleObjectActions = [
      //{label: 'Delete', eventHandler: this.onDelete}
    ];

    let selectedSharelinkCount = 0;
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedSharelinkCount++;
      }
    });
    const isExpiryDateFilterEnabled = filterNames.statusFilter !== FILTER_STATUS_COMPLETED;
    const disableSearchButton = (filterStartDate == null || filterEndDate == null);
    return  (
      <PracticeLayout >
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isProcessing} />
        <Helmet>
          <title>Shared Links</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>Shared Links</h1>
        </div>
        <div className="-practice-content">
          <div className="yt-container fluid">
            <div className="yt-toolbar -mobile-yt-hide">
              <div className="yt-tools space-between">
                <div className="-filters -left">
                  <span>Filters </span>
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
                    label='Link Type'
                    select={this.onLinkTypeFilterChange}
                    displayKey='label'
                    items={linkTypeFilterNames}
                    selected={filterNames.linkTypeFilter}
                    valueKey='value'
                    name='_filterLinkType'
                    isEnabled={true}
                  />
                  <FilterList
                    label='Status'
                    select={this.onStatusFilterChange}
                    displayKey="label"
                    items={statusFilterNames}
                    selected={filterNames.statusFilter}
                    valueKey="value"
                    name="_filterStatus"
                    isEnabled={filterNames.linkTypeFilter !== FILTER_LINKTYPE_SHARE && filterNames.linkTypeFilter !== FILTER_LINKTYPE_OTHERS}
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
                    ) : 
                    null
                  }
                </div>
              </div>
            </div>
            <hr className="-mobile-yt-hide" />
            <div>
              <div className="table-wrapper -practice-table-wrapper" style={{ opacity: isProcessing ? 0.5 : 1 }}>
                <div className="table-actions">
                  <ButtonList
                      label='Actions'
                      select={this.onActionSelected}
                      displayKey="label"
                      items={bulkActions}
                      valueKey="value"
                      name="_bulkActions"
                      selectedRowCount={selectedSharelinkCount}
                      isEnabled={selectedSharelinkCount > 0}
                    />
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
                  itemName="share links"
                />
                <DataTable
                  displayColumns={selectedDisplayColumns}
                  columnVisibility={columnVisibility}
                  data={list}
                  onSort={this.onOrderByChange}
                  currentSortOrderAttribute={orderBy}
                  isCurrentSortOrderAscending={sortOrderAscending}
                  checkboxesState={checkboxes}
                  checkboxNamePrefix="sharelink"
                  onSelectAllCheckboxStateChange={this.onSelectAllCheckedChange}
                  onCheckboxStateChange={this.onSingleCheckboxChange}
                  isSelectAllChecked={this.state.isSelectAllChecked}
                  rowActions={singleObjectActions}
                  animate={true}
                  emptyTableMessage='No shared links found'
                  isProcessing={isProcessing}
                />
              </div>
              <PageTabber
                totalItems={totalCount}
                totalPages={Math.ceil(totalCount / pageSize)}
                pagination={({per: pageSize, page: pageNumber})}
                setPagination={this.onPageNumberChange}
                setPerPage={this.onPageSizeChange}
                viewingAs="bottom"
                itemName="share links"
              />
            </div>
          </div>
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
      </PracticeLayout>
    )
  }

}

ShareLinkList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , shareLinkStore: store.shareLink
    , fileStore: store.file
    , staffStore: store.staff
    , socket: store.user.socket
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ShareLinkList)
);
