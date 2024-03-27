
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import filterUtils from '../../../global/utils/filterUtils';
import displayUtils from '../../../global/utils/displayUtils';

// import actions
import * as fileActions from '../fileActions';

// import resource components
import RecycleBinTableListItem from './RecycleBinTableListItem.js.jsx';

class RecycleBinList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs
      , submitting: false
      , showMobileActionOption: false
    }
    this._bind(
      '_handleBulkRestoreFiles'
      , '_handleCloseMobileOption'
    );
  }

  _handleBulkRestoreFiles() {
    const { dispatch, selectedFileIds, match, clearSelectedFileIds } = this.props; 
    
    const sendData = {
      fileIds: selectedFileIds
      , _firm: match.params.firmId
    }
    this.setState({ submitting: true });
    dispatch(fileActions.sendBulkRestoreFiles(sendData)).then(response => {
      if (response && !response.success) {
        alert(response.message);
      }
      this.setState({ submitting: false }, () => {
        clearSelectedFileIds();
      });
    });
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const {
      handleSetPagination
      , paginatedList
      , sortedAndFilteredList
      , fileList
      , userMap
      , match
      , setPerPage
      , handleSelectFile
      , fileMap
      , dispatch
      , selectedFileIds
      , handleToggleSelectAll
      , setPagination
    } = this.props;
    
    const {
      submitting
      , showMobileActionOption
    } = this.state;

    const isFiltered = fileList && fileList.query && fileList.query.length > 0;
    const allFilesSelected = selectedFileIds.length ? paginatedList.every(p => selectedFileIds.includes(p._id)) : false; 

    return (
      <div className="file-list-wrapper" style={submitting ? { opacity: 0.5 } : {}}>
          <div className={`-options -mobile-layout yt-toolbar`} onClick={() => this.setState({ showMobileActionOption: !showMobileActionOption })}>
            <div>
            <CloseWrapper
                isOpen={showMobileActionOption}
                closeAction={this._handleCloseMobileOption}
            />
            <i className="far fa-ellipsis-h"></i>
            <MobileActionsOption
                isOpen={showMobileActionOption}
                closeAction={() => this.setState({showMobileActionOption: false})}
                viewingAs="recycle-bin-list"
                selectedFileIds={selectedFileIds}
                handleBulkRestoreFiles={this._handleBulkRestoreFiles}
            />
            </div>
        </div>
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left"></div>      
            <div className="-options -right">
              <button className="yt-btn x-small link info" onClick={this._handleBulkRestoreFiles} disabled={submitting}>
                Restore {selectedFileIds && selectedFileIds.length ? <span> &mdash; {selectedFileIds.length}</span> : null}
              </button>
            </div>
          </div>
        </div>
        <hr/>
        <div className="yt-row">
          <div className="yt-col _80">
            <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
              <div className="table-caption">
                <PageTabber
                  totalItems={fileList && fileList.items ? fileList.items.length : 0}
                  totalPages={fileList && fileList.items && fileList.pagination ? Math.ceil(fileList.items.length / fileList.pagination.per) : 0}
                  pagination={fileList && fileList.pagination ? fileList.pagination : 0}
                  setPagination={setPagination}
                  setPerPage={setPerPage}
                  viewingAs="top"
                  itemName="recycle files"
                  searchText="Search..."
              />
              </div>
              <div className="-table-horizontal-scrolling">
                <div className="table-head" >
                  <div className="table-cell">
                    { handleToggleSelectAll ? 
                      <CheckboxInput
                        name="file"
                        value={allFilesSelected}
                        change={() => handleToggleSelectAll(paginatedList, allFilesSelected)}
                        checked={allFilesSelected}
                      />
                      :
                      null
                    }
                  </div>
                  <div className="table-cell"></div>
                  <div className="table-cell -folder-title _50">Name</div>
                  <div className="table-cell _20">Original Location</div>
                  <div className="table-cell -date">Date Deleted</div>
                </div>
                {
                    paginatedList && paginatedList.length ?
                    paginatedList.map((file, i) => 
                        <RecycleBinTableListItem 
                            key={i}
                            file={file}
                            userMap={userMap}
                            match={match}
                            handleSelectFile={handleSelectFile}
                            originalLocation={displayUtils.getLocationByString(fileMap, file._id)}
                            dispatch={dispatch}
                            checked={selectedFileIds.includes(file._id)}
                        />
                    )
                    :
                    <div className="table-head empty-state">
                        <div className="table-cell" colSpan="5">
                            <em>No files</em>
                        </div>
                    </div>
                }
              </div>
            </div>      
          </div>
          <div className="yt-col _20 -mobile-yt-hide">
              <div className="practice-aside">
                <span><small>Note: folders restored from the workspace are no longer associated with the template.</small></span>
              </div>
          </div>
        </div>
      </div>
    )
  }
}

RecycleBinList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleFilter: PropTypes.func
  , handleQuery: PropTypes.func 
  , paginatedList: PropTypes.array.isRequired
  , sortedAndFilteredList: PropTypes.array
  , fileList: PropTypes.object
  , viewingAs: PropTypes.string 
}

RecycleBinList.defaultProps = {
  allFolderTemplates: null 
  , handleFilter: null
  , handleQuery: null 
  , handleSort: null 
  , sortedAndFilteredList: []
  , viewingAs: 'table'
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
   const { fileList, sortedAndFilteredList } = props;
   let paginatedList = [];
   let orderedList = []; 
   const filter = fileList.filter 
   const query = filter ? filter.query : '';
   const sortBy = filter ? filter.sortBy : 'date'; 

   if(sortedAndFilteredList) {

        // TODO: in future, separate filtering and sorting 


        // SORT THE LIST
        switch(sortBy) {
        case 'filename': 
            orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['asc']); 
            break;
        case '-filename':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['desc']); 
            break;
        case 'user':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item._user], ['asc']); 
            break;
        case '-user':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item._user], ['desc']); 
            break; 
        case 'date':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['asc']);
            break;
        case '-date':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
            break;
        case 'visible':
            orderedList = sortedAndFilteredList.filter(file => file.status == "visible");
            break;
        case '-visible':
            orderedList = sortedAndFilteredList.filter(file => file.status == "hidden");
            break;
        case 'client':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item._client], ['asc']);
            break;
        case '-client':
            orderedList = _.orderBy(sortedAndFilteredList, [item => item._client], ['desc']);
            break;
        default:
            orderedList = _.orderBy(sortedAndFilteredList, [item => item.filename.toLowerCase()], ['asc']);
        }

        if (orderedList) {
        const folderList = orderedList.filter(file => file.category === "folder").sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
        const nonFolderList = orderedList.filter(file => file.category !== "folder").sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
        orderedList = folderList.concat(nonFolderList);
        }

        // APPLY PAGINATION
        const pagination = fileList.pagination || {page: 1, per: 50};
        const start = (pagination.page - 1) * pagination.per;
        const end = start + pagination.per;    
        paginatedList = _.slice(orderedList, start, end);
    }

  return {
    paginatedList: paginatedList
    , sortedAndFilteredList: sortedAndFilteredList
    , userMap: store.user.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(RecycleBinList)
);