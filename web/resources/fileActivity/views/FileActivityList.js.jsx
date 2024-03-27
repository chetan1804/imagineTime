/**
 * view component for /firm/:firmId/lists/file-activity
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
import { dateUtils } from '../../../global/utils';

// import api utility
import apiUtils from '../../../global/utils/api';

// import firm components
import PracticeLayout from '../../../global/practice/components/PracticeLayout.js.jsx';

// import actions
import * as fileActivityActions from '../fileActivityActions';
import * as staffActions from '../../staff/staffActions';
import * as firmActions from '../../firm/firmActions';

import {SingleDatePickerInput} from '../../../global/components/forms';
import DataTable from '../../../global/components/DataTable.js.jsx';
import FilterList from '../../../global/components/helpers/FilterList.js.jsx';
import {FeedbackMessage} from '../../../global/components/helpers/FeedbackMessage.js.jsx';
import {LoadingBiscuit} from '../../../global/components/helpers/LoadingBiscuit.js.jsx';
import SelectOrderedSubList from '../../../global/components/helpers/SelectOrderedSubList.js.jsx';

import _ from 'lodash';
// To force the download of the CSV file fetched from the server, in the client's browser.
import { saveAs } from 'file-saver';
import localStorageUtils from '../../../global/utils/localStorageUtils.js';
import sanitizeUtils from '../../../global/utils/sanitizeUtils.js';
import links from '../../../global/components/navigation/links.js.jsx';

const LSKEY_DISPLAYCOLUMNS = 'FileActivityList_DisplayColumns';


const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/file-activity/search';
//const API_DELETE = '/api/file-activity/';
const API_DELETE_BULK = '/api/file-activity/bulk-delete';

// The following FILTER_XXX constant values are hard-coded in
// getXXXFilterCriteria functions. So if you need to change one, make sure it is
// changed in the corresponding function as well.
const FILTER_ASSOCIATION_ALL = 'Association_All';
const FILTER_ASSOCIATION_CLIENTS = 'Association_Clients';
//const FILTER_ASSOCIATION_SELECTCLIENT = 'Association_SelectClients';
const FILTER_ASSOCIATION_OTHERS = 'Association_Others';

const FILTER_STATUS_ALL = 'Status_All';
const FILTER_STATUS_VISIBLE = 'Status_Visible';
const FILTER_STATUS_DELETED = 'Status_Deleted';
const FILTER_STATUS_HIDDEN = 'Status_Hidden';
const FILTER_STATUS_ARCHIVED = 'Status_Archived';
const FILTER_STATUS_OTHERS = 'Status_Others';

const FILTER_FORMAT_ALL = 'Format_All';
const FILTER_FORMAT_PDF = 'Format_PDF';
const FILTER_FORMAT_DOCUMENTS = 'Format_Documents';
const FILTER_FORMAT_SHEETS = 'Format_Sheets';
const FILTER_FORMAT_PRESENTATIONS = 'Format_Presentations';
const FILTER_FORMAT_IMAGES = 'Format_Images';
const FILTER_FORMAT_AUDIO = 'Format_Audio';
const FILTER_FORMAT_VIDEO = 'Format_Video';
const FILTER_FORMAT_TEXT = 'Format_Text';
const FILTER_FORMAT_WEB = 'Format_Web';
const FILTER_FORMAT_OTHERS = 'Format_Others';

const FILTER_USER_ALL = 'User_All';
const FILTER_USER_NONE = 'User_None';
const FILTER_USER_SPECIFIC = 'User_Specific';

const FILTER_CREATEDDATE_ALL = 'CreatedDate_All';
const FILTER_CREATEDDATE_YESTERDAY = 'CreatedDate_Yesterday';
const FILTER_CREATEDDATE_LASTWEEK = 'CreatedDate_LastWeek';
const FILTER_CREATEDDATE_LASTMONTH = 'CreatedDate_LastMonth';
const FILTER_CREATEDDATE_LASTYEAR = 'CreatedDate_LastYear';
const FILTER_CREATEDDATE_TODAY = 'CreatedDate_Today';
const FILTER_CREATEDDATE_THISWEEK = 'CreatedDate_ThisWeek';
const FILTER_CREATEDDATE_THISMONTH = 'CreatedDate_ThisMonth';
const FILTER_CREATEDDATE_THISYEAR = 'CreatedDate_ThisYear';
const FILTER_CREATEDDATE_CUSTOM = 'CreatedDate_Custom';

const DB_STATUS_VISIBLE = 'visible';
const DB_STATUS_DELETED = 'deleted';
const DB_STATUS_HIDDEN = 'hidden';
const DB_STATUS_ARCHIVED = 'archived';

const ATTRIBUTE_ID = 'id';
const ATTRIBUTE_FILEID = 'fileId';
const ATTRIBUTE_FILENAME = 'fileName';
const ATTRIBUTE_CLIENTNAME = 'clientName';
const ATTRIBUTE_ACTIVITYTEXT = 'activityText';
const ATTRIBUTE_CLIENTID = 'clientId';
const ATTRIBUTE_CREATEDDATETIME = 'createdDateTime';
const ATTRIBUTE_UPDATEDDATETIME = 'updatedDateTime';
const ATTRIBUTE_USERID = 'userId';
const ATTRIBUTE_USERNAME = 'userName';
const ATTRIBUTE_USERFIRSTNAME = 'userFirstName';
const ATTRIBUTE_USERLASTNAME = 'userLastName';
const ATTRIBUTE_STATUS = 'activityStatus';
const ATTRIBUTE_FILEEXTENSION = 'fileExtension';
const ATTRIBUTE_FILECATEGORY = 'fileCategory';
const ATTRIBUTE_FILECONTENTTYPE = 'fileContentType';

const ATTRIBUTELABEL_FILENAME = 'File';
const ATTRIBUTELABEL_CLIENTNAME = 'Client';
const ATTRIBUTELABEL_ACTIVITYTEXT = 'Activity';
const ATTRIBUTELABEL_CREATEDDATETIME = 'Created On';
const ATTRIBUTELABEL_UPDATEDDATETIME = 'Last Updated On';
const ATTRIBUTELABEL_USERNAME = 'User';
const ATTRIBUTELABEL_STATUS = 'Status';

const BULK_ACTION_DELETE = 'Action_Delete';

const associationFilterNames = [
  {label: 'All', name: FILTER_ASSOCIATION_ALL, value: FILTER_ASSOCIATION_ALL}
  , {label: 'Clients', name: FILTER_ASSOCIATION_CLIENTS, value: FILTER_ASSOCIATION_CLIENTS}
  , {label: 'Others', name: FILTER_ASSOCIATION_OTHERS, value: FILTER_ASSOCIATION_OTHERS}
];

const statusFilterNames = [
  {label: 'All', name: FILTER_STATUS_ALL, value: FILTER_STATUS_ALL}
  , {label: 'Visible', name: FILTER_STATUS_VISIBLE, value: FILTER_STATUS_VISIBLE}
  , {label: 'Deleted', name: FILTER_STATUS_DELETED, value: FILTER_STATUS_DELETED}
  , {label: 'Hidden', name: FILTER_STATUS_HIDDEN, value: FILTER_STATUS_HIDDEN}
  , {label: 'Archived', name: FILTER_STATUS_ARCHIVED, value: FILTER_STATUS_ARCHIVED}
  , {label: 'Others', name: FILTER_STATUS_OTHERS, value: FILTER_STATUS_OTHERS}
];

const fileFormatFilterNames = [
  {label: 'All', name: FILTER_FORMAT_ALL, value: FILTER_FORMAT_ALL}
  , {label: 'PDF', name: FILTER_FORMAT_PDF, value: FILTER_FORMAT_PDF}
  , {label: 'Documents', name: FILTER_FORMAT_DOCUMENTS, value: FILTER_FORMAT_DOCUMENTS}
  , {label: 'Sheets', name: FILTER_FORMAT_SHEETS, value: FILTER_FORMAT_SHEETS}
  , {label: 'Presentations', name: FILTER_FORMAT_PRESENTATIONS, value: FILTER_FORMAT_PRESENTATIONS}
  , {label: 'Images', name: FILTER_FORMAT_IMAGES, value: FILTER_FORMAT_IMAGES}
  , {label: 'Audio', name: FILTER_FORMAT_AUDIO, value: FILTER_FORMAT_AUDIO}
  , {label: 'Video', name: FILTER_FORMAT_VIDEO, value: FILTER_FORMAT_VIDEO}
  , {label: 'Text', name: FILTER_FORMAT_TEXT, value: FILTER_FORMAT_TEXT}
  , {label: 'Web', name: FILTER_FORMAT_WEB, value: FILTER_FORMAT_WEB}
  , {label: 'Others', name: FILTER_FORMAT_OTHERS, value: FILTER_FORMAT_OTHERS}
];

let userFilterNames = [
  {label: 'All', name: FILTER_USER_ALL, value: FILTER_USER_ALL}
  , {label: 'None', name: FILTER_USER_NONE, value: FILTER_USER_NONE}
];

const createdDateFilterNames = [
  {label: 'All', name: FILTER_CREATEDDATE_ALL, value: FILTER_CREATEDDATE_ALL}
  , {label: 'Today', name: FILTER_CREATEDDATE_TODAY, value: FILTER_CREATEDDATE_TODAY}
  , {label: 'Yesterday', name: FILTER_CREATEDDATE_YESTERDAY, value: FILTER_CREATEDDATE_YESTERDAY}
  , {label: 'Last Week', name: FILTER_CREATEDDATE_LASTWEEK, value: FILTER_CREATEDDATE_LASTWEEK}
  , {label: 'Last Month', name: FILTER_CREATEDDATE_LASTMONTH, value: FILTER_CREATEDDATE_LASTMONTH}
  , {label: 'Last Year', name: FILTER_CREATEDDATE_LASTYEAR, value: FILTER_CREATEDDATE_LASTYEAR}
  , {label: 'This Week', name: FILTER_CREATEDDATE_THISWEEK, value: FILTER_CREATEDDATE_THISWEEK}
  , {label: 'This Month', name: FILTER_CREATEDDATE_THISMONTH, value: FILTER_CREATEDDATE_THISMONTH}
  , {label: 'This Year', name: FILTER_CREATEDDATE_THISYEAR, value: FILTER_CREATEDDATE_THISYEAR}
  , {label: 'Custom', name: FILTER_CREATEDDATE_CUSTOM, value: FILTER_CREATEDDATE_CUSTOM}
];

class FileActivityList extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    const { filterData } = props.fileActivityStore;
    const params = {firmId: this.props.match.params.firmId};

    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_FILENAME, key: ATTRIBUTE_FILENAME, isSortable: true, headerStyle: {minWidth: 100}, style: {whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100}, valueFunction: this.getFileNameCellValue, params: params}
      , {label: ATTRIBUTELABEL_CLIENTNAME, key: ATTRIBUTE_CLIENTNAME, isSortable: true, headerStyle:{}, style:{whiteSpace: 'initial', minWidth: 100}, valueFunction: this.getClientCellValue, params: params}
      , {label: ATTRIBUTELABEL_ACTIVITYTEXT, key: ATTRIBUTE_ACTIVITYTEXT, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 80, maxWidth: 250} }
      , {label: ATTRIBUTELABEL_CREATEDDATETIME, key: ATTRIBUTE_CREATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_USERNAME, key: ATTRIBUTE_USERNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100} }
      , {label: ATTRIBUTELABEL_STATUS, key: ATTRIBUTE_STATUS, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{textTransform: 'capitalize'} }
    ];
    
    this.defaultDisplayColumns = this.allDisplayColumns;
    let displayColumns = props.fileActivityStore.displayColumns;
    if(!displayColumns) {
      displayColumns = localStorageUtils.getJSONValue(LSKEY_DISPLAYCOLUMNS, this.defaultDisplayColumns);
      displayColumns = sanitizeUtils.sanitizeDisplayColumns(displayColumns, this.allDisplayColumns);
      this.props.dispatch(fileActivityActions.setFileActivityDisplayolumns(displayColumns));
    }

    this.state = {
      list: []
      , totalCount: 0
      , isProcessing: 0
      , filterStartDate: (filterData.startDate ? filterData.startDate.getTime() : null)
      , filterEndDate: (filterData.endDate ? filterData.endDate.getTime() : null)
      , filterUserId: (filterData.userId || -1)
      , isSelectDisplayColumnModalOpen : false
      , selectedDisplayColumns: displayColumns
    };

    this._bind(
      'fetchList'
      , 'getUserList'
      , 'getDefaultFilterNames'
      , 'refreshList'
      , 'getFilterCriteria'
      , 'getAssociationFilterCriteria'
      , 'getStatusFilterCriteria'
      , 'getFileFormatFilterCriteria'
      , 'getUserFilterCriteria'
      , 'getCreatedDateFilterCriteria'
      , 'onAssociationFilterChange'
      , 'onStatusFilterChange'
      , 'onFileFormatFilterChange'
      , 'onUserFilterChange'
      , 'onCreatedDateFilterChange'
      , 'onDisplayColumnChange'
      , 'onOrderByChange'
      , 'onPageNumberChange'
      , 'onPageSizeChange'
      , 'onFilterStartDateChange'
      , 'onFilterEndDateChange'
      , 'searchButtonClicked'
      , 'showSelectDisplayColumnModal'
      , 'downloadCSVFile'
      , 'getClientCellValue'
      , 'getFileNameCellValue'
      );
  }

  componentDidMount() {
    console.log('here in FileActivityList.componentDidMount');
    
    const { dispatch, match, fileActivityStore, socket, loggedInUser } = this.props;
    const { filter, filterNames } = fileActivityStore;

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    let newFilterNames;
    let newFilter = {};
    if(!filterNames.associationFilter) {
      newFilterNames = this.getDefaultFilterNames();
      newFilter = {
        firmId: this.props.match.params.firmId
        , orderBy: ATTRIBUTE_CREATEDDATETIME
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
    // incrementing isProcessing in state for user list call made in this.getUserList()
    this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
      this.getUserList();
      this.fetchList(newFilter, newFilterNames);
    });

    socket.on('disconnect', reason => {
      socket.open();
    })
    socket.on('connect', () => {
      console.log('Connected! 12345');
      if(loggedInUser && loggedInUser._id) {
        socket.emit('subscribe', loggedInUser._id);
      } else {
        socket.emit('subscribe', match.params.hex);
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log('here in FileActivityList.componentDidUpdate');
  }

  getUserList() {
    let criteriaObj = {
      distinct: true
      , columns: [ATTRIBUTE_USERID, ATTRIBUTE_USERFIRSTNAME, ATTRIBUTE_USERLASTNAME]
      , operator: searchConstants.OPERATOR_AND
      , firmId: this.props.match.params.firmId
      , orderBy: ATTRIBUTE_USERNAME
      , sortOrderAscending: true
      , includeCount: false
      , ignoreLimit: true
      , group: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_USERID
            , operator: searchConstants.OPERATOR_NOT_NULL
          }
        ]
      }
    };
    apiUtils.callAPI(API_SEARCH, 'POST', criteriaObj).then(
      json => {
        json.results.forEach(item => {
          userFilterNames.push({label: item[ATTRIBUTE_USERNAME], name: item[ATTRIBUTE_USERNAME], value: item[ATTRIBUTE_USERID]});
        });
        this.setState({isProcessing: (this.state.isProcessing - 1)});
      }
    );
  }

  getDefaultFilterNames() {
    return {
      associationFilter: associationFilterNames[0].value
      , statusFilter: FILTER_STATUS_ALL
      , fileFormatFilter: FILTER_FORMAT_ALL
      , userFilter: FILTER_USER_ALL
      , createdDateFilter: FILTER_CREATEDDATE_ALL
    }
  }

  onPageSizeChange(pageSize) {
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
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
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
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
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
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

  onFileFormatFilterChange(value) {
    if(!value) {
      return;
    }
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
    if(value === filterNames.fileFormatFilter) {
        return;
    }

    let newFilterNames = {...filterNames, fileFormatFilter: value};
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

  onUserFilterChange(value) {
    if(!value) {
      return;
    }
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
    if(value === filterNames.userFilter || (filterNames.userFilter === FILTER_USER_SPECIFIC && value === this.state.filterUserId)) {
        return;
    }
    let userId = -1;
    if(value !== FILTER_USER_ALL && value !== FILTER_USER_NONE) {
      userId = value;
      value = FILTER_USER_SPECIFIC;
    }
    this.setState({filterUserId: userId}, () => {
      let newFilterNames = {...filterNames, userFilter: value};
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

  onCreatedDateFilterChange(value) {
    if(!value) {
      return;
    }
    const { fileActivityStore, dispatch } = this.props;
    const { filter, filterNames, filterData } = fileActivityStore;
    if(value === filterNames.createdDateFilter) {
        return;
    }

    let newFilterNames = {...filterNames, createdDateFilter: value};
    let criteriaObj = this.getFilterCriteria(newFilterNames);
    if(!criteriaObj) {
      return;
    }

    let newFilter = {
      ...filter
      , pageNumber: 1
      , group: criteriaObj
    };

    // if either filter start or end date is not given
    if(value === FILTER_CREATEDDATE_CUSTOM && (!this.state.filterStartDate || !this.state.filterEndDate)) {
      let filterData1 = {
        ...filterData
        , startDate:(this.state.filterStartDate ? new Date(this.state.filterStartDate) : null)
        , endDate:(this.state.filterEndDate ? new Date(this.state.filterEndDate) : null)
      };
      dispatch(fileActivityActions.setFileActivityFilter(newFilterNames, newFilter, filterData1));
      return;
    }
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

    let statusCriteria = this.getStatusFilterCriteria(filterNames.statusFilter);
    if(!!statusCriteria) {
      groups.push(statusCriteria);
    }

    let fileFormatCriteria = this.getFileFormatFilterCriteria(filterNames.fileFormatFilter);
    if(!!fileFormatCriteria) {
      groups.push(fileFormatCriteria);
    }

    let userCriteria = this.getUserFilterCriteria(filterNames.userFilter);
    if(!!userCriteria) {
      groups.push(userCriteria);
    }

    let createdDateCriteria = this.getCreatedDateFilterCriteria(filterNames.createdDateFilter);
    if(!!createdDateCriteria) {
      groups.push(createdDateCriteria);
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
      Association_All: null,
      Association_Clients: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_NOT_NULL
          }
        ]
      },
      Association_Others: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CLIENTID
            , operator: searchConstants.OPERATOR_NULL
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
      , Status_Visible: {
        operator: searchConstants.OPERATOR_OR
        , groups: [
          {
            operator: searchConstants.OPERATOR_AND
            , criteria: [
              {
                fieldName: ATTRIBUTE_STATUS
                , operator: searchConstants.OPERATOR_EQUAL
                , value: DB_STATUS_VISIBLE
              }
            ]
          }
        ]
      }
      , Status_Deleted: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_DELETED
          }
        ]
      }
      , Status_Hidden: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_HIDDEN
          }
        ]
      }
      , Status_Archived: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_EQUAL
            , value: DB_STATUS_ARCHIVED
          }
        ]
      }
      , Status_Others: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_STATUS
            , operator: searchConstants.OPERATOR_NOT_IN
            , value: [DB_STATUS_VISIBLE, DB_STATUS_DELETED, DB_STATUS_HIDDEN, DB_STATUS_ARCHIVED]
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  getFileFormatFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }
    let criteriaGroup = {
      Format_All: null
      , Format_PDF: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.pdf', '.Pdf', '.PDF']
          }
        ]
      }
      , Format_Documents: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.doc', '.DOC', '.docx', '.DOCX', '.dot', '.DOT', '.dotx', '.DOTX']
          }
        ]
      }
      , Format_Sheets: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.xls', '.XLS', '.xlsx', '.XLSX', '.csv', '.CSV']
          }
        ]
      }
      , Format_Presentations: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.ppt', '.PPT', '.pptx', '.PPTX']
          }
        ]
      }
      , Format_Images: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.jpeg', '.JPEG', '.jpg', '.JPG', '.jfif', '.JFIF', '.png', '.PNG', '.gif', '.GIF', '.ico', '.ICO', '.svg', '.SVG']
          }
        ]
      }
      , Format_Audio: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.wav', '.WAV', '.mp3', '.MP3', '.m4a', '.M4A', '.aiff', '.AIFF', '.aac', '.AAC', '.ogg', '.OGG', '.wma', '.WMA', '.flac', '.FLAC', '.alac', '.ALAC']
          }
        ]
      }
      , Format_Video: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.mp4', '.MP4', '.mov', '.MOV', '.wmv', '.WMV', '.avi', '.AVI', '.avchd', '.AVCHD', '.flv', '.FLV', '.f4v', '.F4V', '.swf', '.SWF', '.mkv', '.MKV', '.webm', '.WEB']
          }
        ]
      }
      , Format_Text: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.txt', '.TXT', '.rtf', '.RTF']
          }
        ]
      }
      , Format_Web: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_IN
            , value: ['.html', '.HTML', '.xml', '.XML', '.css', '.CSS', '.js', '.JS', '.jsx', '.JSX', '.json', '.JSON']
          }
        ]
      }
      , Format_Others: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_FILEEXTENSION
            , operator: searchConstants.OPERATOR_NOT_IN
            , value: ['.pdf', '.Pdf', '.PDF', '.doc', '.DOC', '.docx', '.DOCX', '.dot', '.DOT', '.dotx', '.DOTX', '.xls', '.XLS', '.xlsx', '.XLSX', '.csv', '.CSV', '.ppt', '.PPT', '.pptx', '.PPTX', '.jpeg', '.JPEG', '.jpg', '.JPG', '.jfif', '.JFIF', '.png', '.PNG', '.gif', '.GIF', '.ico', '.ICO', '.svg', '.SVG', '.wav', '.WAV', '.mp3', '.MP3', '.m4a', '.M4A', '.aiff', '.AIFF', '.aac', '.AAC', '.ogg', '.OGG', '.wma', '.WMA', '.flac', '.FLAC', '.alac', '.ALAC', '.mp4', '.MP4', '.mov', '.MOV', '.wmv', '.WMV', '.avi', '.AVI', '.avchd', '.AVCHD', '.flv', '.FLV', '.f4v', '.F4V', '.swf', '.SWF', '.mkv', '.MKV', '.webm', '.WEB', '.txt', '.TXT', '.rtf', '.RTF', '.html', '.HTML', '.xml', '.XML', '.css', '.CSS', '.js', '.JS', '.jsx', '.JSX', '.json', '.JSON']
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  getUserFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }
    let criteriaGroup = {
      User_All: null
      , User_None: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_USERID
            , operator: searchConstants.OPERATOR_NULL
          }
        ]
      }
      , User_Specific: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_USERID
            , operator: searchConstants.OPERATOR_EQUAL
            , value: '' + this.state.filterUserId
          }
        ]
      }
    };
    return (criteriaGroup[filterName]);
  }

  getCreatedDateFilterCriteria(filterName) {
    if(!filterName) {
      return null;
    }
    let criteriaGroup = {
      CreatedDate_All: null
      , CreatedDate_Today: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getDateTimeStartISOString(new Date()), dateUtils.getDateTimeEndISOString(new Date())]
          }
        ]
      }
      , CreatedDate_Yesterday: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getDateTimeStartISOString(new Date().addDays(-1)), dateUtils.getDateTimeEndISOString(new Date().addDays(-1))]
          }
        ]
      }
      , CreatedDate_LastWeek: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfLastWeekISOString(new Date()), dateUtils.getEndOfLastWeekISOString(new Date())]
          }
        ]
      }
      , CreatedDate_LastMonth: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfLastMonthISOString(new Date()), dateUtils.getEndOfLastMonthISOString(new Date())]
          }
        ]
      }
      , CreatedDate_LastYear: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfLastYearISOString(new Date()), dateUtils.getEndOfLastYearISOString(new Date())]
          }
        ]
      }
      , CreatedDate_ThisWeek: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfWeekISOString(new Date()), dateUtils.getEndOfWeekISOString(new Date())]
          }
        ]
      }
      , CreatedDate_ThisMonth: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfMonthISOString(new Date()), dateUtils.getEndOfMonthISOString(new Date())]
          }
        ]
      }
      , CreatedDate_ThisYear: {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
            , operator: searchConstants.OPERATOR_BETWEEN
            , value: [dateUtils.getStartOfYearISOString(new Date()), dateUtils.getEndOfYearISOString(new Date())]
          }
        ]
      }
      , CreatedDate_Custom: (!this.state.filterStartDate || !this.state.filterStartDate ? null : {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_CREATEDDATETIME
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
    //console.log('About to refresh list');
    const {fileActivityStore} = this.props;
    const {filter, filterNames} = fileActivityStore;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    let filterData = {
      startDate:(this.state.filterStartDate ? new Date(this.state.filterStartDate) : null)
      , endDate:(this.state.filterEndDate ? new Date(this.state.filterEndDate) : null)
      , userId:(this.state.userId ? this.state.userId : -1)
    };

    //console.log('Filter: ', filter);
    //console.log('FilterNames: ', filterNames);
    const { dispatch } = this.props;
    this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
      dispatch(fileActivityActions.setFileActivityFilter(filterNames, filter, filterData));
      apiUtils.callAPI(API_SEARCH, 'POST', filter).then(
        json => {
          //console.log('response: ');
          //console.log(json);
          this.setState({
            list: json.results
            , totalCount: json.totalCount
            , isProcessing: (this.state.isProcessing - 1)
          });
        }
      )
    });
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
    const { fileActivityStore } = this.props;
    const { filter, filterNames } = fileActivityStore;
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
    dispatch(fileActivityActions.setFileActivityDisplayolumns(displayColumns));
  }

  downloadCSVFile() {
    const { fileActivityStore } = this.props;
    const { filter } = fileActivityStore;

    apiUtils.downloadFile(API_SEARCH, 'POST', filter).then(blob => {
      saveAs(blob, 'Files Activities.csv');
    });
  }
  
  showSelectDisplayColumnModal() {
    this.setState({isSelectDisplayColumnModalOpen: true});
  }
  
  getClientCellValue(attributeValue, fileActivity, params) {
    return links.getClientFilesLink(fileActivity[ATTRIBUTE_CLIENTID], fileActivity[ATTRIBUTE_CLIENTNAME], params.firmId);
  }

  getFileNameCellValue(attributeValue, fileActivity, params) {
    const fileId = fileActivity[ATTRIBUTE_FILEID];
    const fileName = fileActivity[ATTRIBUTE_FILENAME];
    const fileCategory = fileActivity[ATTRIBUTE_FILECATEGORY];
    const fileExtension = fileActivity[ATTRIBUTE_FILEEXTENSION];
    const fileContentType = fileActivity[ATTRIBUTE_FILECONTENTTYPE];
    const clientId = fileActivity[ATTRIBUTE_CLIENTID];
    const isDeleted = fileActivity[ATTRIBUTE_STATUS] === DB_STATUS_DELETED;

    return links.getFileLinkWithIcon(fileId, fileName, fileExtension, fileContentType, fileCategory, isDeleted, fileActivity, clientId, params.firmId);
  }

  render() {
    const {
      list
      , isProcessing
      , filterStartDate
      , filterEndDate
      , isSelectDisplayColumnModalOpen
      , selectedDisplayColumns
    } = this.state;

    const { 
      location
      , fileActivityStore
    } = this.props;

    console.log(new Date().getTime(), '- In FileActivityList.render - isProcessing:', isProcessing);

    const { filter } = fileActivityStore;

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const isEmpty = !list || list.length < 1;

    const filterNames = fileActivityStore.filterNames.associationFilter ? fileActivityStore.filterNames : this.getDefaultFilterNames();

    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = false;
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = false;
    columnVisibility[ATTRIBUTE_FILENAME] = true;
    columnVisibility[ATTRIBUTE_CLIENTNAME] = !(filterNames.associationFilter === FILTER_ASSOCIATION_OTHERS);
    columnVisibility[ATTRIBUTE_ACTIVITYTEXT] = true;
    columnVisibility[ATTRIBUTE_CREATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_UPDATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_USERNAME] = (filterNames.userFilter === FILTER_USER_ALL);
    columnVisibility[ATTRIBUTE_STATUS] = (filterNames.statusFilter === FILTER_STATUS_ALL || filterNames.statusFilter === FILTER_STATUS_OTHERS);

    const disableSearchButton = (filterStartDate == null || filterEndDate == null);

    return  (
      <PracticeLayout >
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isProcessing > 0} />
        <Helmet>
          <title>Files Activity</title>
        </Helmet>
        <div className='-practice-subnav'>
          <div className='yt-container fluid'>
            <div className='yt-row center-vert space-between'>
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className='yt-container fluid'>
          <h1>Files Activity</h1>
        </div>
        <div className='-practice-content'>
          <div className='yt-container fluid'>
            <div className='yt-toolbar -mobile-yt-hide'>
              <div className='yt-tools space-between'>
                <div className='-filters -left'>
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
                    label='File Format'
                    select={this.onFileFormatFilterChange}
                    displayKey='label'
                    items={fileFormatFilterNames}
                    selected={filterNames.fileFormatFilter}
                    valueKey='value'
                    name='_filterFormat'
                    isEnabled={true}
                  />
                  <FilterList
                    label='User'
                    select={this.onUserFilterChange}
                    displayKey="label"
                    items={userFilterNames}
                    selected={(filterNames.userFilter === FILTER_USER_SPECIFIC ? this.state.filterUserId : filterNames.userFilter)}
                    valueKey="value"
                    name="_filterUser"
                    isEnabled={true}
                  />
                  <FilterList
                    label='Created On'
                    select={this.onCreatedDateFilterChange}
                    displayKey="label"
                    items={createdDateFilterNames}
                    selected={filterNames.createdDateFilter}
                    valueKey="value"
                    name="_filterCreatedDate"
                    isEnabled={true}
                  />
                  { filterNames.createdDateFilter === FILTER_CREATEDDATE_CUSTOM ?
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
            <hr className='-mobile-yt-hide' />
            <div>
              <div className="table-wrapper -practice-table-wrapper" style={{ opacity: (isProcessing > 0) ? 0.5 : 1 }}>
                <div className="table-actions">
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
                  itemName="file activities"
                />
                <DataTable
                  displayColumns={selectedDisplayColumns}
                  columnVisibility={columnVisibility}
                  data={list}
                  onSort={this.onOrderByChange}
                  currentSortOrderAttribute={orderBy}
                  isCurrentSortOrderAscending={sortOrderAscending}
                  animate={true}
                  emptyTableMessage='No file activities found'
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
                itemName="file activities"
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

FileActivityList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , fileActivityStore: store.fileActivity
    , socket: store.user.socket
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FileActivityList)
);
