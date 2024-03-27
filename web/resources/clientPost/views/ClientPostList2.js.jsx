/**
 * view component for /firm/:firmId/lists/client-message
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
import TableHeaderCell from '../../../global/components/TableHeaderCell.js.jsx';
import Breadcrumbs from '../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import * as searchConstants from '../../../global/utils/searchConstants';

// import firm components
import PracticeLayout from '../../../global/practice/components/PracticeLayout.js.jsx';

// import actions
import * as clientPostActions from '../clientPostActions';
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

const LSKEY_DISPLAYCOLUMNS = 'ClientPostList2_DisplayColumns';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/client-posts/search';
//const API_DELETE = '/api/client-posts/';
const API_DELETE_BULK = '/api/client-posts/bulk-delete';

// The following FILTER_XXX constant values are hard-coded in
// getXXXFilterCriteria functions. So if you need to change one, make sure it is
// changed in the corresponding function as well.
const FILTER_CLIENT_ALL = 'Client_All';
const FILTER_CLIENT_SPECIFIC = 'Client_Specific';

const ATTRIBUTE_ID = "id";
const ATTRIBUTE_CLIENTNAME = "clientName";
const ATTRIBUTE_SUBJECT = "subject";
const ATTRIBUTE_MESSAGE = "message";
const ATTRIBUTE_CLIENTID = "clientId";
const ATTRIBUTE_CREATEDDATETIME = "createdDateTime";
const ATTRIBUTE_UPDATEDDATETIME = "updatedDateTime";
const ATTRIBUTE_CREATEDBYNAME = "createdByName";
const ATTRIBUTE_REPLYCOUNT = "replyCount";

const ATTRIBUTELABEL_CLIENTNAME = "Client";
const ATTRIBUTELABEL_SUBJECT = "Subject";
const ATTRIBUTELABEL_MESSAGE = "Message";
const ATTRIBUTELABEL_CREATEDDATETIME = "Created On";
const ATTRIBUTELABEL_UPDATEDDATETIME = "Last Updated On";
const ATTRIBUTELABEL_CREATEDBYNAME = "Created By";
const ATTRIBUTELABEL_REPLYCOUNT = "Replies";

const BULK_ACTION_DELETE = "Action_Delete";

const clientFilterNames = [
  {label: 'All', name: FILTER_CLIENT_ALL, value: FILTER_CLIENT_ALL}
];

const bulkActions = [
  {
    label: 'Delete'
    , name: BULK_ACTION_DELETE
    , value: BULK_ACTION_DELETE
    , showConfirmModal: true
    , confirmModalLabel: 'client message'
    , confirmModalLabelPlural: 'client messages'
    , confirmModalTitle: 'Delete Client Message?'
    , confirmModalConfirmText: 'OK'
    , confirmModalDeclineText: 'Cancel'
    , showCount: true
  }
];

class ClientPostList2 extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    const params = {firmId: this.props.match.params.firmId};

    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_CLIENTNAME, key: ATTRIBUTE_CLIENTNAME, isSortable: true, headerStyle:{}, style:{whiteSpace: 'initial', minWidth: 120}, valueFunction: this.getClientCellValue, params: params}
      , {label: ATTRIBUTELABEL_SUBJECT, key: ATTRIBUTE_SUBJECT, isSortable: true, headerStyle: {minWidth: 150}, style: {whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100}, valueFunction: this.getClientPostLink, params: params}
      , {label: ATTRIBUTELABEL_MESSAGE, key: ATTRIBUTE_MESSAGE, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 200}, valueFunction: this.getClientPostLink, params: params}
      , {label: ATTRIBUTELABEL_CREATEDDATETIME, key: ATTRIBUTE_CREATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_CREATEDBYNAME, key: ATTRIBUTE_CREATEDBYNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', minWidth: 100} }
      , {label: ATTRIBUTELABEL_REPLYCOUNT, key: ATTRIBUTE_REPLYCOUNT, isSortable: true, style:{maxWidth: 80} }
    ];
    
    this.defaultDisplayColumns = this.allDisplayColumns;
    let displayColumns = props.clientPostStore.displayColumns;
    if(!displayColumns) {
      displayColumns = localStorageUtils.getJSONValue(LSKEY_DISPLAYCOLUMNS, this.defaultDisplayColumns);
      displayColumns = sanitizeUtils.sanitizeDisplayColumns(displayColumns, this.allDisplayColumns);
      this.props.dispatch(clientPostActions.setClientPostList2Displayolumns(displayColumns));
    }

    this.state = {
      list: []
      , totalCount: 0
      , isProcessing: 0
      , isSelectAllChecked: false
      , selectedRows: {}
      , checkboxes: {}
      , filterClientId : -1
      , isSelectDisplayColumnModalOpen : false
      , selectedDisplayColumns: displayColumns
    };

    this._bind(
      'fetchList'
      , 'getDefaultFilterNames'
      , 'getClientList'
      , 'refreshList'
      , 'getFilterCriteria'
      , 'getClientFilterCriteria'
      , 'onClientFilterChange'
      , 'onDisplayColumnChange'
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
      , 'getClientPostLink'
      );
  }

  componentDidMount() {
    //console.log('here in ClientPostList2.componentDidMount');
    
    const { dispatch, match, clientPostStore, socket, loggedInUser } = this.props;
    const { filter, filterNames } = clientPostStore;

    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));

    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));

    let newFilterNames;
    let newFilter = {};
    if(!filterNames.clientFilter) {
      newFilterNames = this.getDefaultFilterNames();
      newFilter = {
        firmId: this.props.match.params.firmId
        , orderBy: ATTRIBUTE_CREATEDDATETIME
        , sortOrderAscending: true
        , pageSize: DEFAULT_PAGE_SIZE
        , pageNumber: 1
        , includeCount: true
        , includeReplyCount: true
        , group: this.getFilterCriteria(newFilterNames)
      };
    }
    else {
      newFilterNames = filterNames;
      newFilter = filter;
    }

    // incrementing isProcessing in state for requestlist list call made in
    // this.getClientList()
    this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
      this.getClientList();
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
    //console.log('here in ClientPostList2.componentDidUpdate');
  }

  getClientList() {
    let criteriaObj = {
      distinct: true
      , includeReplyCount: false
      , columns: [ATTRIBUTE_CLIENTID, ATTRIBUTE_CLIENTNAME]
      , operator: searchConstants.OPERATOR_AND
      , firmId: this.props.match.params.firmId
      , orderBy: ATTRIBUTE_CLIENTNAME
      , sortOrderAscending: true
      , includeCount: false
      , ignoreLimit: true
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
            this.setState({
              ...this.state
              , isProcessing: (this.state.isProcessing - 1)
            });
            console.log('response: ');
            console.log(json);
            if(json.success) {
              this.feedbackMessage.current.showSuccess('The selected client message' + (selectedIds.length > 1 ? 's' : '') + ' deleted successfully.');
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
                feedbackMessageStr = 'Could not delete ' + errorCount + ' of the selected ' + selectedIds.length + ' client message' + (selectedIds.length > 1 ? 's' : '');
              }
              else if(errorCount === selectedIds.length) {
                feedbackMessageStr = 'Could not delete the selected client message' + (selectedIds.length > 1 ? 's' : '');
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
    const { clientPostStore } = this.props;
    const { filter, filterNames } = clientPostStore;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { clientPostStore } = this.props;
    const { filter, filterNames } = clientPostStore;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { clientPostStore } = this.props;
    const { filter, filterNames } = clientPostStore;
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
    const { clientPostStore } = this.props;
    const { filter, filterNames } = clientPostStore;
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

  getFilterCriteria(filterNames) {
    if(!filterNames) {
      return null;
    }

    let groups = [];

    let clientCriteria = this.getClientFilterCriteria(filterNames.clientFilter);
    if(!!clientCriteria) {
      groups.push(clientCriteria);
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
      Client_All: null,
      Client_Specific: {
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

  refreshList() {
    //console.log('About to refresh list');
    const {clientPostStore} = this.props;
    const {filter, filterNames} = clientPostStore;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    let filterData = {
      clientId: (this.state.filterClientId ? this.state.filterClientId : -1)
    };

    //console.log('Filter: ', filter);
    //console.log('FilterNames: ', filterNames);
    const { dispatch } = this.props;
    this.setState({isProcessing: (this.state.isProcessing + 1)}, () => {
      dispatch(clientPostActions.setClientPostList2Filter(filterNames, filter, filterData));
      //console.log('State: ');
      //console.log(this.state);
      apiUtils.callAPI(API_SEARCH, 'POST', filter).then(
        json => {
          //console.log('response: ');
          //console.log(json);
          let checkboxes = {};
          let isCheckboxVisible = this.showCheckbox;
          _.forEach(json.results, function(clientPost) {
            if(isCheckboxVisible(clientPost) === true) {
              checkboxes[clientPost[ATTRIBUTE_ID]] = false;
            }
          });
          this.setState({
            ...this.state
            , list: json.results
            , totalCount: json.totalCount
            , isProcessing: (this.state.isProcessing - 1)
            , checkboxes: checkboxes
          });
        }
      )
    });
  }

  showCheckbox(clientPost) {
    return !clientPost[ATTRIBUTE_REPLYCOUNT] || clientPost[ATTRIBUTE_REPLYCOUNT] < 1
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
    dispatch(clientPostActions.setClientPostList2Displayolumns(displayColumns));
  }

  downloadCSVFile() {
    const { clientPostStore } = this.props;
    const { filter } = clientPostStore;

    apiUtils.downloadFile(API_SEARCH, 'POST', filter).then(blob => {
      saveAs(blob, 'Client Messages.csv');
    });
  }
  
  showSelectDisplayColumnModal() {
    this.setState({isSelectDisplayColumnModalOpen: true});
  }
  
  getClientCellValue(attributeValue, clientPost, params) {
    return links.getClientPostsLink(clientPost[ATTRIBUTE_CLIENTID], clientPost[ATTRIBUTE_CLIENTNAME], params.firmId);
  }

  getClientPostLink(attributeValue, clientPost, params) {
    return links.getClientPostLink(clientPost[ATTRIBUTE_ID], clientPost[ATTRIBUTE_CLIENTID], attributeValue, params.firmId);
  }

  render() {
    const {
      list
      , checkboxes
      , isSelectDisplayColumnModalOpen
      , selectedDisplayColumns
      , isProcessing
    } = this.state;

    const { 
      location
      , match
      , clientPostStore
      , socket
    } = this.props;

    //console.log(new Date().getTime(), '- In ClientPostList2.render - isProcessing:', isProcessing);

    const { filter } = clientPostStore;

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const isEmpty = !list || list.length < 1;

    const filterNames = clientPostStore.filterNames.clientFilter ? clientPostStore.filterNames : this.getDefaultFilterNames();

    const errors = list.filter(item => {
      return !!item.errorMessage;
    });
    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = errors && errors.length > 0;
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = true;
    columnVisibility[ATTRIBUTE_CLIENTNAME] = (filterNames.clientFilter === FILTER_CLIENT_ALL);
    columnVisibility[ATTRIBUTE_SUBJECT] = true;
    columnVisibility[ATTRIBUTE_MESSAGE] = true;
    columnVisibility[ATTRIBUTE_CREATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_UPDATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_CREATEDBYNAME] = true;
    columnVisibility[ATTRIBUTE_REPLYCOUNT] = true;

    let singleObjectActions = [
      //{label: 'Delete', eventHandler: this.onDelete}
    ];

    let selectedClientPostCount = 0;
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedClientPostCount++;
      }
    });
    return  (
      <PracticeLayout >
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isProcessing > 0} />
        <Helmet>
          <title>Client Messages</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>Client Messages</h1>
        </div>
        <div className="-practice-content">
          <div className="yt-container fluid">
            <div className="yt-toolbar -mobile-yt-hide">
                <div className="yt-tools space-between">
                  <div className="-filters -left">
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
                  </div>
                </div>
              </div>
              <hr className="-mobile-yt-hide" />
              <div>
              <div className="table-wrapper -practice-table-wrapper" style={{ opacity: (isProcessing > 0) ? 0.5 : 1 }}>
                <div className="table-actions">
                  <ButtonList
                      label='Actions'
                      select={this.onActionSelected}
                      displayKey="label"
                      items={bulkActions}
                      valueKey="value"
                      name="_bulkActions"
                      selectedRowCount={selectedClientPostCount}
                      isEnabled={selectedClientPostCount > 0}
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
                  itemName="client messages"
                />
                <DataTable
                  displayColumns={selectedDisplayColumns}
                  columnVisibility={columnVisibility}
                  data={list}
                  onSort={this.onOrderByChange}
                  currentSortOrderAttribute={orderBy}
                  isCurrentSortOrderAscending={sortOrderAscending}
                  checkboxesState={checkboxes}
                  checkboxNamePrefix="clientPost2"
                  onSelectAllCheckboxStateChange={this.onSelectAllCheckedChange}
                  onCheckboxStateChange={this.onSingleCheckboxChange}
                  isSelectAllChecked={this.state.isSelectAllChecked}
                  checkboxDisplayCriteriaFunction={this.showCheckbox}
                  rowActions={singleObjectActions}
                  animate={true}
                  emptyTableMessage='No client messages found'
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
                itemName="client messages"
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

ClientPostList2.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , clientPostStore: store.clientPost
    , socket: store.user.socket
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientPostList2)
);
