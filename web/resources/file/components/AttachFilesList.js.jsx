/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries

// import actions 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'

// import resource components
import FileTableListItem from './FileTableListItem.js.jsx';

class AttachFilesList extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_handleSelectedTagsChange'
    )
  }

  _handleSelectedTagsChange(e) {
    console.log("handleSelectedTagsChange", e)
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }


  render() {
    const {
      allTags
      , fileList
      , handleSetPagination
      , handleToggleSelectAll 
      , paginatedList
      , selectedTagIds
      , showActions
      , sortedAndFilteredList // Use this list for total file count.
      , totalListInfo
      , selectedFileIds
      , isConfigScreenView
    } = this.props;

    const isFiltered = (
      totalListInfo
      && fileList
      && totalListInfo.items
      && totalListInfo.items.length > fileList.items.length
    )
    // console.log(this.props.selectedFileIds)
    let allFilesSelected = paginatedList.every(p => selectedFileIds.includes(p._id));

    const filenameLinkScreenStyle = {
      "width": "30%"
    }

    const dateAddedLinkScreenStyle = {
      "textAlign": "left"
    }

    return (
      <div className="file-list-wrapper">
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left">
              <strong>Filter files by: </strong>
              <FilterBy
                applyFilter={this._handleSelectedTagsChange}
                displayKey="name"
                items={allTags || []}
                label="Tags"
                name="_tags"
                selected={selectedTagIds}
                valueKey="_id"
              />
            </div>
            { showActions ?
              <div className="-options -right">
                <button className="yt-btn x-small link info" onClick={this.props.handleOpenShareModal}>Share files { this.props.selectedFileIds && this.props.selectedFileIds.length > 0 ? <span> &mdash; {this.props.selectedFileIds.length}</span> : null} </button>
                <button className="yt-btn x-small info" onClick={this.props.handleOpenUploadModal}>Upload new files</button>
              </div>
              :
              null 
            }
          </div>
        </div>
        <hr className="-mobile-yt-hide" />
        <table className="yt-table firm-table -workspace-table truncate-cells">
          <caption>
            { isFiltered ?
              // this list is currently not filterable. If we add filters we'll have to fix the Matching Files count.
              // See FileList for an example of how it will have to work.
              <small>Matching Files &mdash; {fileList.items.length}</small>
              :
              <small>All Files &mdash; {sortedAndFilteredList && sortedAndFilteredList.length}</small>
            }
            <div className="per-page-select u-pullRight">
              <label>Show per page: </label>
              <select
                name="numPerPage"
                onChange={(e) => this.props.setPerPage(e.target.value)}
                value={fileList && fileList.pagination ? fileList.pagination.per : 50}
              >
                <option value={25}> 25 </option>
                <option value={50}> 50 </option>
                <option value={100}> 100 </option>
              </select>
            </div>
          </caption>
          <thead>
            <tr>
              <th>
                { handleToggleSelectAll ? 
                  <CheckboxInput
                    name="file"
                    value={allFilesSelected}
                    change={handleToggleSelectAll}
                    checked={allFilesSelected}
                  />
                  :
                  null 
                }
              </th>
              <th className="-title sortable" style={isConfigScreenView ? filenameLinkScreenStyle : null} onClick={null}>Filename</th>
              <th className=" sortable">Size</th>

              {/* {!isConfigScreenView && <th className=" sortable">Folders</th> }
              {!isConfigScreenView && <th className=" sortable">Files</th>}
              {!isConfigScreenView && <th className="_20">Tags</th>} */}
              {/* <th className="-date sortable" onClick={null}>Year</th> */}
              { this.props.viewingAs == 'client' ? 
                null 
              : 
                <th className=" sortable">Client Visibility</th> 
              }
              <th className="-date sortable" style={isConfigScreenView ? dateAddedLinkScreenStyle : null} onClick={null}>Date Added</th>
            </tr>
          </thead>
          <tbody>
            { paginatedList.length > 0 ? 
              paginatedList.map((file, i) => 
                <FileTableListItem 
                  key={'file_' + file._id + '_' + i} 
                  file={file}
                  checked={this.props.selectedFileIds.includes(file._id)}
                  handleSelectFile={this.props.handleSelectFile}
                  viewingAs={this.props.viewingAs}
                  isConfigScreenView={true}
                />
              )
              : 
              <tr className="empty-state">
                <td colSpan="5">
                  <em>No files</em>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <PageTabber
          totalItems={sortedAndFilteredList ? sortedAndFilteredList.length : 0}
          totalPages={fileList && fileList.pagination && sortedAndFilteredList ? Math.ceil(sortedAndFilteredList.length / fileList.pagination.per) : 1}
          pagination={fileList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
        />
      </div>
    )
  }
}

AttachFilesList.propTypes = {
  // allFilesSelected: PropTypes.bool 
  dispatch: PropTypes.func.isRequired
  , fileList: PropTypes.object.isRequired
  , allTags: PropTypes.array
  , handleFilter: PropTypes.func.isRequired
  , handleQuery: PropTypes.func.isRequired 
  , handleSelectFile: PropTypes.func.isRequired
  , handleSetPagination: PropTypes.func.isRequired
  , handleToggleSelectAll: PropTypes.func
  , handleSort: PropTypes.func.isRequired 
  , selectedFileIds: PropTypes.array
  , selectedTagIds: PropTypes.array
  , showActions: PropTypes.bool 
  , sortedAndFilteredList: PropTypes.array 
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff', 'default']) 
  , isConfigScreenView: PropTypes.bool
}

AttachFilesList.defaultProps = {
  // allFilesSelected: false 
  handleToggleSelectAll: null
  , selectedFileIds: []
  , selectedTagIds: []
  , showActions: true 
  , sortedAndFilteredList: []
  , allTags: []
  , isConfigScreenView: false
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
   const { fileList, sortedAndFilteredList } = props;
   let paginatedList = [];
   if(sortedAndFilteredList) {
     const pagination = fileList.pagination || {page: 1, per: 50};
 
     // APPLY PAGINATION
     const start = (pagination.page - 1) * pagination.per;
     const end = start + pagination.per;
     paginatedList = _.slice(sortedAndFilteredList, start, end);      
   }
 
  
  return {
    paginatedList: paginatedList
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(AttachFilesList)
);
