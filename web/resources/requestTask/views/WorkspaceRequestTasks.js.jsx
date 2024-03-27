/**
 * view component for /firm/:firmId/workspaces/:clientId/request-list/:requestId/:requestTaskStatus
 */

// import constants
import * as constants from '../../../config/constants.js';
import * as searchConstants from '../../../global/utils/searchConstants';

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Switch, Route } from 'react-router-dom';

// import layout
import WorkspaceLayout from '../../client/practice/components/WorkspaceLayout.js.jsx';
import PracticeFirmLayout from '../../firm/practice/components/PracticeFirmLayout.js.jsx';

// import third-party components
import { Helmet } from 'react-helmet';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import _ from 'lodash';

// import global components
import YTRoute from '../../../global/components/routing/YTRoute.js.jsx';
import Binder from '../../../global/components/Binder.js.jsx';
import RoleModalComponent from '../../../global/enum/RoleModalComponent.js.jsx';

// import components
import TaskActivityOverview from '../components/TaskActivityOverview.js.jsx';

// import reusable UI components
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import DataTable from '../../../global/components/DataTable.js.jsx';
import FilterList from '../../../global/components/helpers/FilterList.js.jsx';
import ButtonList from '../../../global/components/helpers/ButtonList.js.jsx';
import {FeedbackMessage} from '../../../global/components/helpers/FeedbackMessage.js.jsx';
import {LoadingBiscuit} from '../../../global/components/helpers/LoadingBiscuit.js.jsx';

// import actions
import * as requestTaskActions from '../requestTaskActions';
import * as staffActions from '../../staff/staffActions';
import * as firmActions from '../../firm/firmActions';
import * as userActions from '../../user/userActions';
import * as requestActions from '../../request/requestActions';

// import utilities
import apiUtils from '../../../global/utils/api';
import links from '../../../global/components/navigation/links.js.jsx';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/request-task/search';
const API_CHANGE_STATUS = '/api/request-task-bulk-update-status';

const FILTER_STATUS_ALL = 'Status_All';
const FILTER_STATUS_PUBLISHED = 'Status_Published';
const FILTER_STATUS_UNPUBLISHED = 'Status_Unpublished';
const FILTER_STATUS_COMPLETED = 'Status_Completed';

const DB_STATUS_PUBLISHED = 'published';
const DB_STATUS_UNPUBLISHED = 'unpublished';
const DB_STATUS_COMPLETED = 'completed';

const ATTRIBUTE_ID = 'id';
const ATTRIBUTE_CLIENTID = 'clientId';
const ATTRIBUTE_REQUESTLISTID = 'requestListId';
const ATTRIBUTE_CATEGORY = 'category';
const ATTRIBUTE_DUEDATE = 'dueDate';
const ATTRIBUTE_DESCRIPTION = 'description';
const ATTRIBUTE_ASSIGNEES = 'assignees';
const ATTRIBUTE_FILEUPLOADCOUNT = 'totalUploadedFiles';
const ATTRIBUTE_RESPONSEDATE = 'responseDate';
const ATTRIBUTE_STATUS = 'status';
const ATTRIBUTE_CREATEDBYNAME = 'createdByName';
const ATTRIBUTE_CREATEDDATETIME = "createdDateTime";
const ATTRIBUTE_UPDATEDDATETIME = "updatedDateTime";

const ATTRIBUTELABEL_CATEGORY = 'Category';
const ATTRIBUTELABEL_DUEDATE = 'Due Date';
const ATTRIBUTELABEL_DESCRIPTION = 'Description';
const ATTRIBUTELABEL_ASSIGNEES = 'Assignee(s)';
const ATTRIBUTELABEL_FILEUPLOADCOUNT = 'Files Uploaded';
const ATTRIBUTELABEL_RESPONSEDATE = 'Response Date';
const ATTRIBUTELABEL_STATUS = 'Status';
const ATTRIBUTELABEL_CREATEDBYNAME = 'Created By';
const ATTRIBUTELABEL_CREATEDDATETIME = "Created On";
const ATTRIBUTELABEL_UPDATEDDATETIME = "Last Updated On";

const statusFilterNames = [
  {label: 'All', name: FILTER_STATUS_ALL, value: FILTER_STATUS_ALL}
  , {label: 'Published', name: FILTER_STATUS_PUBLISHED, value: FILTER_STATUS_PUBLISHED}
  , {label: 'Unpublished', name: FILTER_STATUS_UNPUBLISHED, value: FILTER_STATUS_UNPUBLISHED}
  , {label: 'Completed', name: FILTER_STATUS_COMPLETED, value: FILTER_STATUS_COMPLETED}
];

class WorkspaceRequestTasks extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    const {match} = this.props;

    const params = {firmId: match.params.firmId};

    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_DESCRIPTION, key: ATTRIBUTE_DESCRIPTION, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 200, maxWidth: 250}, valueFunction: this.getDescriptionCellValue, params: params }
      , {label: ATTRIBUTELABEL_CATEGORY, key: ATTRIBUTE_CATEGORY, isSortable: true, headerStyle:{whiteSpace: 'initial'}}
      , {label: ATTRIBUTELABEL_DUEDATE, key: ATTRIBUTE_DUEDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 120} }
      , {label: ATTRIBUTELABEL_ASSIGNEES, key: ATTRIBUTE_ASSIGNEES, isSortable: false, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100}, valueFunction: this.getAssigneeNamesCellValue }
      , {label: ATTRIBUTELABEL_FILEUPLOADCOUNT, key: ATTRIBUTE_FILEUPLOADCOUNT, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, valueFunction: this.getFileUploadCountCellValue }
      , {label: ATTRIBUTELABEL_STATUS, key: ATTRIBUTE_STATUS, isSortable: true, style:{textTransform: 'capitalize'}}
      , {label: ATTRIBUTELABEL_RESPONSEDATE, key: ATTRIBUTE_RESPONSEDATE, dataType: constants.DATATYPE_DATE, format: 'LL/dd/yyyy', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 120} }
      //, {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      //, {label: ATTRIBUTELABEL_CREATEDBYNAME, key: ATTRIBUTE_CREATEDBYNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100} }
      //, {label: ATTRIBUTELABEL_USERNAME, key: ATTRIBUTE_USERNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100} }
    ];
    
    this.displayColumns = this.allDisplayColumns;

    this.state = {
      list: []
      , totalCount: 0
      , isProcessing: 0
      , isSelectAllChecked: false
      , selectedRows: {}
      , checkboxes: {}

      , filterNames: this.getDefaultFilterNames(match.params.requestTaskStatus)
      , filter: {
        firmId: null
        , orderBy: 'id'
        , sortOrderAscending: true
        , pageSize: 50
        , pageNumber: 1
        , includeCount: true
        , group: {}
      }
      , selectedDisplayColumns: this.displayColumns
      , roleModal: null
      , selectedRequestTask: {} // task to be edited
      , isBulkEditMode: false
    };

    this._bind(
      'fetchList'
      , 'getDefaultFilterNames'
      , 'refreshList'
      , 'getFilterCriteria'
      , 'getStatusFilterCriteria'
      , 'onStatusFilterChange'
      , 'onOrderByChange'
      , 'onPageNumberChange'
      , 'onPageSizeChange'
      , 'onSelectAllCheckedChange'
      , 'onSingleCheckboxChange'
      , 'onCheckboxCheckedChange'
      , 'showCheckbox'
      , 'getSelectedIds'
      , 'changeStatusTo'
      , 'onEdit'
      , 'onTaskEditModalClose'
      , 'updateListAfterDelete'
      , 'getDescriptionCellValue'
      , 'getAssigneeNamesCellValue'
      , 'getFileUploadCountCellValue'
      );
  }

  componentDidMount() {
    //console.log('here in WorkspaceRequestTasks.componentDidMount');
    
    const { dispatch, requestTaskStore, match, socket, loggedInUser } = this.props;
    
    dispatch(requestActions.fetchSingleIfNeeded(match.params.requestId)); 
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    if (match.params.clientId) {
      dispatch(userActions.fetchListIfNeeded(...['_client', match.params.clientId]));
    }

    let newFilterNames;
    let newFilter = {};

    newFilterNames = this.getDefaultFilterNames(match.params.requestTaskStatus);
    newFilter = {
      firmId: match.params.firmId
      , orderBy: ATTRIBUTE_DUEDATE
      , sortOrderAscending: true
      , pageSize: DEFAULT_PAGE_SIZE
      , pageNumber: 1
      , includeCount: true
      , group: this.getFilterCriteria(newFilterNames)
    };

    // incrementing isProcessing in state for the server call made in
    // this.getRequestListList() and this.getClientList() functions
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
    //console.log('here in WorkspaceRequestTasks.componentDidUpdate');
  }

  getDefaultFilterNames(requestTaskStatus) {
    switch(requestTaskStatus) {
      case DB_STATUS_UNPUBLISHED:
        return {statusFilter: FILTER_STATUS_UNPUBLISHED};
      case DB_STATUS_PUBLISHED:
        return {statusFilter: FILTER_STATUS_PUBLISHED};
      case DB_STATUS_COMPLETED:
        return {statusFilter: FILTER_STATUS_COMPLETED};
    }
    return {statusFilter: FILTER_STATUS_ALL};
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

  getSelectedIds() {
    let selectedIds = [];
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedIds.push(key);
      }
    });
    return selectedIds;
  }

  changeStatusTo(newStatus) {
    let selectedIds = this.getSelectedIds();
    let requestBody = {
      firmId: this.props.match.params.firmId
      , requestListId: this.props.match.params.requestId
      , requestTaskIds: selectedIds
      , status: newStatus
    };
    this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
      //console.log('State: ');
      //console.log(this.state);
      apiUtils.callAPI(API_CHANGE_STATUS, 'PUT', requestBody)
      .then(
        json => {
          console.log('changeStatusTo - response: ');
          console.log(json);
          if(json.success) {
            this.feedbackMessage.current.showSuccess('Status of the selected task' + (selectedIds.length > 1 ? 's' : '') + ' updated successfully.');
          }
          else {
            this.feedbackMessage.current.showError('Could not update the status of the selected tasks. Please try again later or contact support.');
          }
          this.setState({isProcessing: (this.state.isProcessing - 1)}, () => {
            if(json.success) {
              this.refreshList();
            }
          });
        }
      )
      .catch(err => {
        console.log(err);
        this.feedbackMessage.current.showError('Could not contact the server. Please try again later or contact support.');
        this.setState({isProcessing: (this.state.isProcessing - 1)});
      })
    });
  }

  onEdit(event, task) {
    const { dispatch, requestTaskStore } = this.props;
    //console.log('Edit link clicked for task[id: ' + task[ATTRIBUTE_ID] + ', description:', task[ATTRIBUTE_DESCRIPTION], ']');
    this.setState({ roleModal: 'request_task_list', selectedRequestTask: {} }, () =>{
      dispatch(requestTaskActions.fetchSingleIfNeeded(task[ATTRIBUTE_ID])).then(taskResult => {
        console.log('Task to be editd:', taskResult.item);
        this.setState({ roleModal: 'request_task_list', selectedRequestTask: taskResult.item })    
      });
    });    
  }

  onTaskEditModalClose() {
    this.setState({
      requestTaskBulkEdit: false
      , roleModal: null
      , selectedRequestTask: {}
    }, () => {
      this.refreshList();
    });
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
    const { filter, filterNames } = this.state;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { filter, filterNames } = this.state;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { filter, filterNames } = this.state;
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

  onStatusFilterChange(value) {
    if(!value) {
      return;
    }
    const { filter, filterNames } = this.state;
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

    const {match} = this.props;
    let groups = [
      {
        operator: searchConstants.OPERATOR_AND
        , criteria: [
          {
            fieldName: ATTRIBUTE_REQUESTLISTID
            , operator: searchConstants.OPERATOR_EQUAL
            , value: match.params.requestId
          }
        ]
      }
    ];

    if (match.params.clientId) {
      groups[0].criteria.push({
        fieldName: ATTRIBUTE_CLIENTID
        , operator: searchConstants.OPERATOR_EQUAL
        , value: match.params.clientId
      })
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

  refreshList() {
    //console.log('About to refresh list');
    const {filter, filterNames} = this.state;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    //console.log('Filter: ', filter);
    //console.log('FilterNames: ', filterNames);
    this.setState({isProcessing: (this.state.isProcessing + 1), filter, filterNames}, () => {
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
            , isSelectAllChecked: false
          });
        }
      )
    });
  }

  showCheckbox(requestTask) {
    return true; //requestTask[ATTRIBUTE_STATUS] === DB_STATUS_UNPUBLISHED
  }

  getDescriptionCellValue(attributeValue, requestListTask, params) {
    return links.getClientRequestTaskLink(requestListTask[ATTRIBUTE_ID], requestListTask[ATTRIBUTE_DESCRIPTION], requestListTask[ATTRIBUTE_STATUS], requestListTask[ATTRIBUTE_REQUESTLISTID], requestListTask[ATTRIBUTE_CLIENTID], params.firmId);
  }

  getAssigneeNamesCellValue(attributeValue, requestListTask, params) {
    if(!requestListTask[ATTRIBUTE_ASSIGNEES] || !requestListTask[ATTRIBUTE_ASSIGNEES].length) return '';
    return requestListTask[ATTRIBUTE_ASSIGNEES].map(assignee => {
      return <div key={`${ATTRIBUTE_ASSIGNEES}_${assignee.id}`}>{assignee.firstname} {assignee.lastname}</div>
    })
  }

  getFileUploadCountCellValue(attributeValue, requestListTask, params) {
    return <div className='-status-count' style={{marginTop: '5px'}}><span>{attributeValue}</span></div>
  }

  render() {
    const {
      list
      , isProcessing
      , checkboxes
      , selectedDisplayColumns
      , roleModal
      , isBulkEditMode
      , selectedRequestTask
      , filter
      , filterNames
    } = this.state;

    const { 
      location
      , clientStore
      , userStore
      , userMap
      , match
    } = this.props;

    //console.log(new Date().getTime(), '- In WorkspaceRequestTasks.render - isProcessing:', isProcessing);

    const selectedClient = clientStore.selected.getItem();
    const selectedUsers = match.params.clientId && userStore.util.getList(...['_client', match.params.clientId]);

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const isEmpty = !list || list.length < 1;

    const errors = list && list.filter(item => {
      return !!item.errorMessage;
    });

    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = errors && errors.length > 0;
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = true;
    columnVisibility[ATTRIBUTE_DESCRIPTION] = true;
    columnVisibility[ATTRIBUTE_CATEGORY] = true;
    columnVisibility[ATTRIBUTE_DUEDATE] = true;
    columnVisibility[ATTRIBUTE_ASSIGNEES] = true;
    columnVisibility[ATTRIBUTE_FILEUPLOADCOUNT] = true;
    columnVisibility[ATTRIBUTE_RESPONSEDATE] = (filterNames.statusFilter === FILTER_STATUS_ALL || filterNames.statusFilter === FILTER_STATUS_COMPLETED);
    columnVisibility[ATTRIBUTE_STATUS] = (filterNames.statusFilter === FILTER_STATUS_ALL);

    let singleObjectActions = [
      //{label: 'Edit', eventHandler: this.onEdit}
    ];

    let selectedTaskIds = this.getSelectedIds();

    const ModalComponent = RoleModalComponent[roleModal];
    const ComponentLayout = match.params.clientId ? WorkspaceLayout : PracticeFirmLayout;

    return  (
      <ComponentLayout>
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isProcessing > 0} />
        <Helmet>
          <title>Request List Tasks</title>
        </Helmet>
        <div>
          <div className='yt-toolbar -mobile-yt-hide'>
            <div className='yt-tools space-between'>
              <div className='-filters -left'>
                <span>Filters </span>
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
              </div>
              <div className='data-table-actions'>
                <button
                  disabled={!match.params.clientId || selectedTaskIds.length < 1 || filterNames.statusFilter !== FILTER_STATUS_PUBLISHED}
                  className="yt-btn info x-small -mobile-yt-hide"
                  onClick={() => {this.changeStatusTo(DB_STATUS_UNPUBLISHED)}}
                >Unpublish</button>

                <button
                  disabled={!match.params.clientId || selectedTaskIds.length < 1 || filterNames.statusFilter !== FILTER_STATUS_UNPUBLISHED}
                  className="yt-btn x-small -mobile-yt-hide"
                  onClick={() => {this.changeStatusTo(DB_STATUS_PUBLISHED)}}
                >Publish</button>

                <button
                disabled={!match.params.clientId || selectedTaskIds.length < 1 || filterNames.statusFilter !== FILTER_STATUS_PUBLISHED}
                className="yt-btn x-small -mobile-yt-hide"
                  onClick={() => {this.changeStatusTo(DB_STATUS_COMPLETED)}}
                >Complete</button>

                <button
                  disabled={selectedTaskIds.length < 1 || filterNames.statusFilter !== FILTER_STATUS_UNPUBLISHED}
                  className="yt-btn x-small -mobile-yt-hide"
                  onClick={() => this.setState({ isBulkEditMode: true, roleModal: "request_task_list", selectedRequestTask: {} })}
                >Bulk Edit</button>

                <button
                  disabled={false}
                  className="yt-btn info x-small -mobile-yt-hide"
                  onClick={() => this.setState({ roleModal: "request_task_list" })}
                >New Task</button>
              </div>
            </div>
          </div>
          <hr className='-mobile-yt-hide' />
          <div>
            <div className="table-wrapper -practice-table-wrapper" style={{ opacity: (isProcessing > 0) ? 0.5 : 1 }}>
              <PageTabber
                totalItems={totalCount}
                totalPages={Math.ceil(totalCount / pageSize)}
                pagination={({per: pageSize, page: pageNumber})}
                setPagination={this.onPageNumberChange}
                setPerPage={this.onPageSizeChange}
                viewingAs="top"
                itemName="tasks"
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
                emptyTableMessage='No tasks found'
                isProcessing={isProcessing > 0}
              />
            </div>
            <PageTabber
              totalItems={totalCount}
              totalPages={Math.ceil(totalCount / pageSize)}
              pagination={({per: pageSize, page: pageNumber})}
              setPagination={this.onPageNumberChange}
              setPerPage={this.onPageSizeChange}
              viewingAs="top"
              itemName="tasks"
            />
          </div>
        </div>
        <ModalComponent 
          isOpen={!!roleModal}
          close={this.onTaskEditModalClose}
          //listArgs={listArgs}
          selectedClient={match.params.clientId && selectedClient || {}}
          selectedUsers={selectedUsers}
          userMap={userMap}
          selectedRequestTask={selectedRequestTask}
          selectedTaskIds={selectedTaskIds}
          requestTaskBulkEdit={isBulkEditMode}
        />
            {
              !!list && !!list.length ?
              <div>
                <TransitionGroup>
                  <CSSTransition
                    key={location.key}
                    classNames="slide-from-right"
                    timeout={300}
                  >
                    <Switch location={location}>
                      <YTRoute
                        breadcrumbs={[]}
                        exact
                        path="/firm/:firmId/workspaces/:clientId/request-list/:requestId/:requestTaskStatus/task-activity/:requestTaskId/:viewingAs"
                        staff={true}
                        component={TaskActivityOverview}
                      />
                      <Route render={() => <div/>} />
                    </Switch>
                  </CSSTransition>
                </TransitionGroup>
              </div> : null
            }

      </ComponentLayout>
    )
  }

}

WorkspaceRequestTasks.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , socket: store.user.socket
    , requestTaskStore: store.requestTask
    , clientStore: store.client
    , userStore: store.user
    , userMap: store.user.byId
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(WorkspaceRequestTasks)
);