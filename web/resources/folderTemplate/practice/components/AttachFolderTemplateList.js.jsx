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
import Binder from '../../../../global/components/Binder.js.jsx';
import FilterBy from '../../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms'

// import resource components
import PracticeFolderTemplateTableListItem from './PracticeFolderTemplateTableListItem.js.jsx';

class AttachFolderTemplateList extends Binder {
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
      folderTemplateList
      , handleSetPagination
      , handleToggleSelectAll 
      , paginatedList
      , showActions
      , sortedAndFilteredList // Use this list for total file count.
      , totalListInfo
      , selectedTemplateIds
      , userStore
      , match 
      , handleSelectTemplate
    } = this.props;

    const isFiltered = (
      totalListInfo
      && folderTemplateList
      && totalListInfo.items
      && totalListInfo.items.length > folderTemplateList.items.length
    )
    // console.log(this.props.selectedTemplateIds)
    let allTemplateSelected = paginatedList.every(p => selectedTemplateIds.includes(p._id));

    console.log("paginatedList", paginatedList)

    return (
      <div className="file-list-wrapper">
        {/* <div className="yt-toolbar">
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
                <button className="yt-btn x-small link info" onClick={this.props.handleOpenShareModal}>Share files { this.props.selectedTemplateIds && this.props.selectedTemplateIds.length > 0 ? <span> &mdash; {this.props.selectedTemplateIds.length}</span> : null} </button>
                <button className="yt-btn x-small info" onClick={this.props.handleOpenUploadModal}>Upload new files</button>
              </div>
              :
              null 
            }
          </div>
        </div> 
        <hr/> */}
      
        <table className="yt-table firm-table -workspace-table truncate-cells">
          <caption>
            { isFiltered ?
              // this list is currently not filterable. If we add filters we'll have to fix the Matching Files count.
              // See FileList for an example of how it will have to work.
              <small>Matching Files &mdash; {folderTemplateList.items.length}</small>
              :
              <small>All Files &mdash; {sortedAndFilteredList && sortedAndFilteredList.length}</small>
            }
            <div className="per-page-select u-pullRight">
              <label>Show per page: </label>
              <select
                name="numPerPage"
                onChange={(e) => this.props.setPerPage(e.target.value)}
                value={folderTemplateList && folderTemplateList.pagination ? folderTemplateList.pagination.per : 50}
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
                {/* <CheckboxInput
                  name="template"
                  value={allTemplateSelected}
                  change={handleToggleSelectAll}
                  checked={allTemplateSelected}
                /> */}
              </th>
              <th className="table-cell -folder-title">Name</th>
              <th className="_20">Description</th>
              <th className="_20">Total Folders</th>
              <th className="_20">Deleted Folders</th>
              <th className="_20">Created By</th>
              <th className="_20">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            { paginatedList.length > 0 ? 
              paginatedList.map((folderTemplate, i) => 
                <PracticeFolderTemplateTableListItem
                  key={i}
                  folderTemplate={folderTemplate}
                  userMap={userStore.byId}
                  match={match}
                  checked={selectedTemplateIds.includes(folderTemplate._id)}
                  viewingAs="templateListModal"
                  handleSelectTemplate={handleSelectTemplate}
                />
              )
              : 
              <tr className="empty-state">
                <td colSpan="7">
                  <em>No Templates</em>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <PageTabber
          totalItems={sortedAndFilteredList ? sortedAndFilteredList.length : 0}
          totalPages={folderTemplateList && folderTemplateList.pagination && sortedAndFilteredList ? Math.ceil(sortedAndFilteredList.length / folderTemplateList.pagination.per) : 1}
          pagination={folderTemplateList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
        />
      </div>
    )
  }
}

AttachFolderTemplateList.propTypes = {
  // allTemplateSelected: PropTypes.bool 
  dispatch: PropTypes.func.isRequired
  , folderTemplateList: PropTypes.object.isRequired
  , handleSetPagination: PropTypes.func.isRequired
  , handleToggleSelectAll: PropTypes.func
  , handleSort: PropTypes.func.isRequired 
  , selectedTemplateIds: PropTypes.array
  , selectedTagIds: PropTypes.array
  , showActions: PropTypes.bool 
  , sortedAndFilteredList: PropTypes.array 
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff']) 
}

AttachFolderTemplateList.defaultProps = {
  // allTemplateSelected: false 
  handleToggleSelectAll: null
  , selectedTemplateIds: []
  , showActions: true 
  , sortedAndFilteredList: []
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
   const { folderTemplateList, sortedAndFilteredList } = props;
   console.log("folderTemplateList", folderTemplateList)
   console.log("sortedAndFilteredList", sortedAndFilteredList)
   let paginatedList = [];
   if(sortedAndFilteredList) {
     const pagination = folderTemplateList.pagination || {page: 1, per: 50};
 
     // APPLY PAGINATION
     const start = (pagination.page - 1) * pagination.per;
     const end = start + pagination.per;
     paginatedList = _.slice(sortedAndFilteredList, start, end);      
   }
 
  
  return {
    paginatedList: paginatedList
    , userStore: store.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(AttachFolderTemplateList)
);
