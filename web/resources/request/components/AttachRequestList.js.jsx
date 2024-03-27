/**
 * Resuable component for an actionable file list used by both /admin and /firm users 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { DateTime } from 'luxon';

// import actions 

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import { CheckboxInput } from '../../../global/components/forms'

// import resource components
import RequestTableListItem from './RequestTableListItem.js.jsx';

class AttachRequestList extends Binder {
  constructor(props) {
    super(props);
    this._bind(
      '_handleSelectedTagsChange'
    )
  }

  _handleSelectedTagsChange(e) {
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }


  render() {
    const {
        requestList
      , handleSetPagination
      , handleToggleSelectAll 
      , paginatedList
      , showActions
      , sortedAndFilteredList // Use this list for total file count.
      , totalListInfo
      , selectedRequestId
      , userStore
      , match 
      , handleSelectRequest
    } = this.props;

    const isFiltered = (
      totalListInfo
      && requestList
      && totalListInfo.items
      && totalListInfo.items.length > requestList.items.length
    )
    // console.log(this.props.selectedTemplateIds)
    // let allTemplateSelected = paginatedList.every(p => selectedTemplateIds.includes(p._id));

    return (
      <div className="file-list-wrapper">
        <table className="yt-table firm-table -workspace-table truncate-cells">
          <caption>
            <small>All Files &mdash; {sortedAndFilteredList && sortedAndFilteredList.length}</small>
            <div className="per-page-select u-pullRight">
              <label>Show per page: </label>
              <select
                name="numPerPage"
                onChange={(e) => this.props.setPerPage(e.target.value)}
                value={requestList && requestList.pagination ? requestList.pagination.per : 50}
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
              </th>
              <th className="table-cell -folder-title">Name</th>
              <th className="_20">Tasks</th>
              <th className="_20">Created By</th>
              <th className="_20">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            { paginatedList.length > 0 ? 
              paginatedList.map((request, i) => 
                    <div className="table-row -file-item -request-list-table">
                        <div className="table-cell">
                            <input
                                type="radio"
                                value={request._id}
                                name="template"
                                onChange={() => handleSelectRequest(request._id)}
                                checked={request._id === selectedRequestId}
                            />
                        </div>
                        <div className="table-cell -title">
                            {request.name}
                        </div>
                        <div className="table-cell ">
                            {request.tasks}
                        </div>
                        <div className="table-cell">
                            {
                                request._createdBy && userStore && userStore.byId && userStore.byId[request._createdBy] ?
                                <span>{userStore.byId[request._createdBy].firstname} {userStore.byId[request._createdBy].lastname}</span>: null 
                            }
                        </div>
                        <div className="table-cell">
                            {DateTime.fromISO(request.updated_at).toLocaleString(DateTime.DATE_SHORT)}
                        </div>
                    </div>
              )
              : 
              <tr className="empty-state">
                <td colSpan="7">
                  <em>No Request</em>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <PageTabber
          totalItems={sortedAndFilteredList ? sortedAndFilteredList.length : 0}
          totalPages={requestList && requestList.pagination && sortedAndFilteredList ? Math.ceil(sortedAndFilteredList.length / requestList.pagination.per) : 1}
          pagination={requestList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
        />
      </div>
    )
  }
}

AttachRequestList.propTypes = {
  // allTemplateSelected: PropTypes.bool 
  dispatch: PropTypes.func.isRequired
  , requestList: PropTypes.object.isRequired
  , handleSetPagination: PropTypes.func.isRequired
  , handleToggleSelectAll: PropTypes.func
  , handleSort: PropTypes.func.isRequired 
  , selectedTagIds: PropTypes.array
  , showActions: PropTypes.bool 
  , sortedAndFilteredList: PropTypes.array 
  , viewingAs: PropTypes.oneOf(['workspace', 'general', 'admin', 'client', 'staff']) 
}

AttachRequestList.defaultProps = {
  // allTemplateSelected: false 
  handleToggleSelectAll: null
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
    const { requestList, sortedAndFilteredList } = props;
    console.log("requestList", requestList)
    console.log("sortedAndFilteredList", sortedAndFilteredList)
    let paginatedList = [];

    if(sortedAndFilteredList) {
        const pagination = requestList.pagination || {page: 1, per: 50};
    
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
  )(AttachRequestList)
);
