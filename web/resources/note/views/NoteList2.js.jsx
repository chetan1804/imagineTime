/**
 * view component for /firm/:firmId/lists/file-note
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
import * as noteActions from '../noteActions';
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
import { saveAs } from "file-saver";
import localStorageUtils from '../../../global/utils/localStorageUtils.js';
import sanitizeUtils from '../../../global/utils/sanitizeUtils.js';
import links from '../../../global/components/navigation/links.js.jsx';

const LSKEY_DISPLAYCOLUMNS = 'NoteList2_DisplayColumns';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

const API_SEARCH = '/api/notes/search';
//const API_DELETE = '/api/notes/';
const API_DELETE_BULK = '/api/notes/bulk-delete';

// The following FILTER_XXX constant values are hard-coded in
// getXXXFilterCriteria functions. So if you need to change one, make sure it is
// changed in the corresponding function as well.
const FILTER_ASSOCIATION_ALL = 'Association_All';
const FILTER_ASSOCIATION_CLIENTS = 'Association_Clients';
//const FILTER_ASSOCIATION_SELECTCLIENT = 'Association_SelectClients';
const FILTER_ASSOCIATION_OTHERS = 'Association_Others';

const ATTRIBUTE_ID = "id";
const ATTRIBUTE_FILEID = "fileId";
const ATTRIBUTE_FILENAME = "fileName";
const ATTRIBUTE_FILESTATUS = "fileStatus";
const ATTRIBUTE_CLIENTNAME = "clientName";
const ATTRIBUTE_NOTE = "note";
const ATTRIBUTE_CLIENTID = "clientId";
const ATTRIBUTE_CREATEDDATETIME = "createdDateTime";
const ATTRIBUTE_UPDATEDDATETIME = "updatedDateTime";
const ATTRIBUTE_USERNAME = "userName";
const ATTRIBUTE_FILEEXTENSION = 'fileExtension';
const ATTRIBUTE_FILECATEGORY = 'fileCategory';
const ATTRIBUTE_FILECONTENTTYPE = 'fileContentType';

const ATTRIBUTELABEL_FILENAME = 'File';
const ATTRIBUTELABEL_CLIENTNAME = "Client";
const ATTRIBUTELABEL_NOTE = "Note";
const ATTRIBUTELABEL_CREATEDDATETIME = "Created On";
const ATTRIBUTELABEL_UPDATEDDATETIME = "Last Updated On";
const ATTRIBUTELABEL_USERNAME = "User";

const BULK_ACTION_DELETE = "Action_Delete";

const associationFilterNames = [
  {label: 'All', name: FILTER_ASSOCIATION_ALL, value: FILTER_ASSOCIATION_ALL}
  , {label: 'Clients', name: FILTER_ASSOCIATION_CLIENTS, value: FILTER_ASSOCIATION_CLIENTS}
  , {label: 'Others', name: FILTER_ASSOCIATION_OTHERS, value: FILTER_ASSOCIATION_OTHERS}
];

const bulkActions = [
  {
    label: 'Delete'
    , name: BULK_ACTION_DELETE
    , value: BULK_ACTION_DELETE
    , showConfirmModal: true
    , confirmModalLabel: 'note'
    , confirmModalLabelPlural: 'notes'
    , confirmModalTitle: 'Delete Note?'
    , confirmModalConfirmText: 'OK'
    , confirmModalDeclineText: 'Cancel'
    , showCount: true
  }
];

class NoteList2 extends Binder {
  feedbackMessage = React.createRef();

  constructor(props) {
    super(props);
    const params = {firmId: this.props.match.params.firmId};

    this.allDisplayColumns = [
      {label: ATTRIBUTELABEL_FILENAME, key: ATTRIBUTE_FILENAME, isSortable: true, headerStyle: {minWidth: 100}, style: {whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100}, valueFunction: this.getFileNameCellValue, params: params}
      , {label: ATTRIBUTELABEL_CLIENTNAME, key: ATTRIBUTE_CLIENTNAME, isSortable: true, headerStyle:{}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100}, valueFunction: this.getClientCellValue, params: params}
      , {label: ATTRIBUTELABEL_NOTE, key: ATTRIBUTE_NOTE, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 200, maxWidth: 250} }
      , {label: ATTRIBUTELABEL_CREATEDDATETIME, key: ATTRIBUTE_CREATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_UPDATEDDATETIME, key: ATTRIBUTE_UPDATEDDATETIME, dataType: constants.DATATYPE_DATETIME, format: 'LL/dd/yyyy hh:mm:ss a', isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{maxWidth: 210} }
      , {label: ATTRIBUTELABEL_USERNAME, key: ATTRIBUTE_USERNAME, isSortable: true, headerStyle:{whiteSpace: 'nowrap'}, style:{whiteSpace: 'initial', overflowWrap: 'break-word', wordBreak: 'break-all', minWidth: 100} }
    ];
    
    this.defaultDisplayColumns = this.allDisplayColumns;
    let displayColumns = props.noteStore.displayColumns;
    if(!displayColumns) {
      displayColumns = localStorageUtils.getJSONValue(LSKEY_DISPLAYCOLUMNS, this.defaultDisplayColumns);
      displayColumns = sanitizeUtils.sanitizeDisplayColumns(displayColumns, this.allDisplayColumns);
      this.props.dispatch(noteActions.setNoteList2Displayolumns(displayColumns));
    }

    this.state = {
      list: []
      , totalCount: 0
      , isProcessing: false
      , isSelectAllChecked: false
      , selectedRows: {}
      , checkboxes: {}
      , isSelectDisplayColumnModalOpen : false
      , selectedDisplayColumns: displayColumns
    };

    this._bind(
      'fetchList'
      , 'getDefaultFilterNames'
      , 'refreshList'
      , 'getFilterCriteria'
      , 'getAssociationFilterCriteria'
      , 'onAssociationFilterChange'
      , 'onDisplayColumnChange'
      , 'onOrderByChange'
      , 'onPageNumberChange'
      , 'onPageSizeChange'
      , 'onSelectAllCheckedChange'
      , 'onSingleCheckboxChange'
      , 'onCheckboxCheckedChange'
      , 'onActionSelected'
      , 'updateListAfterDelete'
      , 'showSelectDisplayColumnModal'
      , 'downloadCSVFile'
      , 'getClientCellValue'
      , 'getFileNameCellValue'
      );
  }

  componentDidMount() {
    //console.log('here in NoteList2.componentDidMount');
    
    const { dispatch, match, noteStore, socket, loggedInUser } = this.props;
    const { filter, filterNames } = noteStore;

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
    //console.log('here in NoteList2.componentDidUpdate');
  }

  getDefaultFilterNames() {
    return {
      associationFilter: associationFilterNames[0].value
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
            this.feedbackMessage.current.showSuccess('The selected note' + (selectedIds.length > 1 ? 's' : '') + ' deleted successfully.');
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
              feedbackMessageStr = 'Could not delete ' + errorCount + ' of the selected ' + selectedIds.length + ' note' + (selectedIds.length > 1 ? 's' : '');
            }
            else if(errorCount === selectedIds.length) {
              feedbackMessageStr = 'Could not delete the selected note' + (selectedIds.length > 1 ? 's' : '');
            }
            feedbackMessageStr += '. Please hover over the error icon for the corresponding row to see the error description.';
            this.feedbackMessage.current.showError(feedbackMessageStr);
            this.updateListAfterDelete(json.data);
          }
        }
      );
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
    const { noteStore } = this.props;
    const { filter, filterNames } = noteStore;
    let newFilter = {
      ...filter
      , pageSize: (pageSize ? (pageSize > 1 && pageSize <= MAX_PAGE_SIZE ? pageSize : DEFAULT_PAGE_SIZE) : DEFAULT_PAGE_SIZE)
      , pageNumber: 1
    };
    this.fetchList(newFilter, filterNames);
  }

  onPageNumberChange(pagination) {
    const { noteStore } = this.props;
    const { filter, filterNames } = noteStore;
    let newPageNumber = pagination.page;
    let newFilter = {
      ...filter
      , pageNumber: (newPageNumber ? (newPageNumber > 0 ? newPageNumber : 1) : 1)
    };

    this.fetchList(newFilter, filterNames);
  }

  onOrderByChange(newOrderBy) {
    const { noteStore } = this.props;
    const { filter, filterNames } = noteStore;
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
    const { noteStore } = this.props;
    const { filter, filterNames } = noteStore;
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

  getFilterCriteria(filterNames) {
    if(!filterNames) {
      return null;
    }

    let groups = [];

    let associationCriteria = this.getAssociationFilterCriteria(filterNames.associationFilter);
    if(!!associationCriteria) {
      groups.push(associationCriteria);
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

  refreshList() {
    //console.log('About to refresh list');
    const {noteStore} = this.props;
    const {filter, filterNames} = noteStore;
    this.fetchList(filter, filterNames);
  }

  async fetchList(filter, filterNames) {
    //console.log('Filter: ', filter);
    //console.log('FilterNames: ', filterNames);
    const { dispatch } = this.props;
    this.setState({
      ...this.state
      , isProcessing: true
    });
    dispatch(noteActions.setNoteList2Filter(filterNames, filter));
    //console.log('State: ');
    //console.log(this.state);
    apiUtils.callAPI(API_SEARCH, 'POST', filter).then(
      json => {
        //console.log('response: ');
        //console.log(json);
        let checkboxes = {};
        _.forEach(json.results, function(note) {
            checkboxes[note.id] = false;
        });
        this.setState({
          ...this.state
          , list: json.results
          , totalCount: json.totalCount
          , isProcessing: false
          , checkboxes: checkboxes
        });
      }
    )
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
    dispatch(noteActions.setNoteList2Displayolumns(displayColumns));
  }

  downloadCSVFile() {
    const { noteStore } = this.props;
    const { filter } = noteStore;

    apiUtils.downloadFile(API_SEARCH, 'POST', filter).then(blob => {
      saveAs(blob, 'Files Notes.csv');
    });
  }
  
  showSelectDisplayColumnModal() {
    this.setState({isSelectDisplayColumnModalOpen: true});
  }
  
  getClientCellValue(attributeValue, note, params) {
    return links.getClientFilesLink(note[ATTRIBUTE_CLIENTID], note[ATTRIBUTE_CLIENTNAME], params.firmId);
  }

  getFileNameCellValue(attributeValue, note, params) {
    let isDeleted = note[ATTRIBUTE_FILESTATUS] === constants.DB_FILE_STATUS_DELETED;
    return links.getFileLinkWithIcon(note[ATTRIBUTE_FILEID], note[ATTRIBUTE_FILENAME]
      , note[ATTRIBUTE_FILEEXTENSION], note[ATTRIBUTE_FILECONTENTTYPE], note[ATTRIBUTE_FILECATEGORY]
      , isDeleted, note, note[ATTRIBUTE_CLIENTID], params.firmId);
  }

  render() {
    const {
      list
      , checkboxes
      , isSelectDisplayColumnModalOpen
      , selectedDisplayColumns
    } = this.state;

    const { 
      location
      , match
      , noteStore
      , socket
    } = this.props;

    const isFetching = this.state.isProcessing;
    console.log(new Date().getTime(), '- In NoteList2.render - isProcessing:', isFetching);

    const { filter } = noteStore;

    const { orderBy, sortOrderAscending} = filter;
    const totalCount1 = this.state.totalCount;
    const totalCount = !!totalCount1 ? totalCount1 : 0;
    let pageSize = !!filter && !!filter.pageSize ? filter.pageSize : DEFAULT_PAGE_SIZE;
    let pageNumber = !!filter && !!filter.pageNumber ? filter.pageNumber : 1;
    const isEmpty = !list || list.length < 1;

    const filterNames = noteStore.filterNames.associationFilter ? noteStore.filterNames : this.getDefaultFilterNames();

    const errors = list.filter(item => {
      return !!item.errorMessage;
    });

    let columnVisibility = {};
    columnVisibility[constants.SPECIAL_COLUMN_NOTIFICATION] = errors && errors.length > 0;
    columnVisibility[constants.SPECIAL_COLUMN_CHECKBOX] = true;
    columnVisibility[ATTRIBUTE_FILENAME] = true;
    columnVisibility[ATTRIBUTE_CLIENTNAME] = !(filterNames.associationFilter === FILTER_ASSOCIATION_OTHERS);
    columnVisibility[ATTRIBUTE_NOTE] = true;
    columnVisibility[ATTRIBUTE_CREATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_UPDATEDDATETIME] = true;
    columnVisibility[ATTRIBUTE_USERNAME] = true;

    let singleObjectActions = [
      //{label: 'Delete', eventHandler: this.onDelete}
    ];

    let selectedNoteCount = 0;
    _.forEach(this.state.checkboxes, (value, key) => {
      if(this.state.checkboxes[key]) {
        selectedNoteCount++;
      }
    });
    return  (
      <PracticeLayout >
        <FeedbackMessage ref = {this.feedbackMessage} />
        <LoadingBiscuit isVisible={isFetching} />
        <Helmet>
          <title>Files Notes</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>Files Notes</h1>
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
                </div>
              </div>
            </div>
            <hr className="-mobile-yt-hide" />
            <div>
              <div className="table-wrapper -practice-table-wrapper" style={{ opacity: isFetching ? 0.5 : 1 }}>
                <div className="table-actions">
                  <ButtonList
                      label='Actions'
                      select={this.onActionSelected}
                      displayKey="label"
                      items={bulkActions}
                      valueKey="value"
                      name="_bulkActions"
                      selectedRowCount={selectedNoteCount}
                      isEnabled={selectedNoteCount > 0}
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
                  itemName="notes"
                />
                <DataTable
                  displayColumns={selectedDisplayColumns}
                  columnVisibility={columnVisibility}
                  data={list}
                  onSort={this.onOrderByChange}
                  currentSortOrderAttribute={orderBy}
                  isCurrentSortOrderAscending={sortOrderAscending}
                  checkboxesState={checkboxes}
                  checkboxNamePrefix="fileNote2"
                  onSelectAllCheckboxStateChange={this.onSelectAllCheckedChange}
                  onCheckboxStateChange={this.onSingleCheckboxChange}
                  isSelectAllChecked={this.state.isSelectAllChecked}
                  rowActions={singleObjectActions}
                  animate={true}
                  emptyTableMessage='No notes found'
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
                itemName="notes"
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

NoteList2.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {

  return {
    loggedInUser: store.user.loggedIn.user
    , noteStore: store.note
    , socket: store.user.socket
  }
  
}

export default withRouter(
  connect(
    mapStoreToProps
  )(NoteList2)
);
