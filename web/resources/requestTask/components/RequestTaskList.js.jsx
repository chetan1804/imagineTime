/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';

import * as requestTaskActions from '../requestTaskActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import { CheckboxInput } from '../../../global/components/forms';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';

import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

// import components
import RequestTaskTableListItem from './RequestTaskTableListItem.js.jsx';

class RequestTaskList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
        showMobileActionOption: false
    }
    this._bind(
        '_handleFilter'
        , '_handleCloseMobileOption'
    )
  }

  _handleFilter(sortBy) {
    const { requestTaskList, dispatch, listArgs } = this.props; 
    let newFilter = requestTaskList.filter;
    if(requestTaskList.filter.sortBy && requestTaskList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(requestTaskActions.setFilter(newFilter, listArgs));
  }


  componentDidMount() {

  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const {
        match
        , isFiltered
        , requestTaskList
        , sortedAndFilteredList
        , orderedList
        , paginatedList
        , setPerPage
        , requestStatus = {}
        , handleToggleSelectAll
        , selectedTaskIds = []
        , clearSelectedTaskIds
        , handleSetPagination
        , handleSelectRequestTask
        , handleUpdateRequestTask
        , userMap
        , handleRequestTaskShowModal
        , handleTaskBulkEdit
        , isViewing
    } = this.props;

    const {
        showMobileActionOption
    } = this.state;

    const filter = requestTaskList && requestTaskList.filter && requestTaskList.filter.sortBy;
    const allTaskIdsSelected = selectedTaskIds.length ? paginatedList.every(p => selectedTaskIds.includes(p._id)) : false; 
    const taskStatusUrl = match.params.firmId ? `/firm/${match.params.firmId}/workspaces/${match.params.clientId}/request-list` : `/portal/${match.params.clientId}/request`;

    return (
        <div className="file-list-wrapper">
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
                    viewingAs="request-task-list"
                    handleRequestTaskShowModal={handleRequestTaskShowModal}
                    handleTaskBulkEdit={handleTaskBulkEdit}
                    selectedTaskIds={selectedTaskIds}
                    taskStatusUrl={taskStatusUrl}
                    requestStatus={requestStatus}
                    isViewing={isViewing}
                />
                </div>
            </div>
            <div className="yt-toolbar">
                <div className="yt-tools space-between">
                    <div className="-options -left">
                        <div className="tab-bar-nav" style={{ marginTop: 0 }}>
                            <ul className="navigation">
                                <li>
                                    <span></span>
                                    <NavLink className={`${match.params.requestTaskStatus === "completed" ? "active" : ""} -link-border-none`} exact to={`${taskStatusUrl}/${match.params.requestId}/completed`}>
                                        <div className="-status-count">
                                            <span>{requestStatus.completed.length}</span>
                                        </div>
                                        Completed Tasks
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink className={`${match.params.requestTaskStatus === "published" ? "active" : ""} -link-border-none`} exact to={`${taskStatusUrl}/${match.params.requestId}/published`}>
                                        <div className="-status-count">
                                            <span>{requestStatus.published.length}</span>
                                        </div>
                                        Published Tasks
                                    </NavLink>
                                </li>
                                {isViewing === "portal" ? null :
                                <li>
                                    <NavLink className={`${match.params.requestTaskStatus === "unpublished" ? "active" : ""} -link-border-none`} exact to={`${taskStatusUrl}/${match.params.requestId}/unpublished`}>
                                        <div className="-status-count">
                                            <span>{requestStatus.unpublished.length}</span>
                                        </div>
                                        Unpublished Tasks
                                    </NavLink>
                                </li>
                                }
                            </ul>
                        </div>
                    </div>
                    {
                        isViewing === "portal" ? <div className="-options -right"></div>
                        : 
                        <div className="-options -right">
                            <button className="yt-btn x-small info" onClick={handleTaskBulkEdit} disabled={selectedTaskIds && selectedTaskIds.length === 0}>Bulk Edit</button>
                            <button className="yt-btn x-small info" onClick={handleRequestTaskShowModal}>New Task</button>
                        </div>
                    }
                </div>
            </div>
            <hr className="-mobile-yt-hide" />
            <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table -request-list-table">
                <div className="table-caption">
                    <PageTabber
                        totalItems={isFiltered && requestTaskList.pagination ? orderedList.length : orderedList.length}
                        totalPages={Math.ceil(isFiltered && requestTaskList.pagination ? orderedList.length / requestTaskList.pagination.per : orderedList.length / 50)}
                        pagination={requestTaskList.pagination}
                        setPagination={handleSetPagination}
                        setPerPage={this.props.setPerPage}
                        viewingAs="top"
                        itemName="tasks"
                        searchText="Search..."
                    />
                </div>
                <div className="-table-horizontal-scrolling">
                    <div className="table-head" >
                        {
                            isViewing === "portal" ? null :
                            <div className="table-cell">
                                { handleToggleSelectAll ? 
                                    <CheckboxInput
                                        name="file"
                                        value={allTaskIdsSelected}
                                        change={() => handleToggleSelectAll(paginatedList, allTaskIdsSelected)}
                                        checked={allTaskIdsSelected}
                                        clearSelectedRequestIds={clearSelectedTaskIds}
                                    />
                                :
                                null
                                }
                            </div>
                        }
                        <div className="table-cell"></div>
                        <div className="table-cell -category _40">Category</div>
                        <div className="table-cell sortable" onClick={() => this._handleFilter('dueDate')}>DueDate
                            {
                                filter && filter == 'dueDate' ?  <i className="fad fa-sort-down"></i>
                                : filter && filter == '-dueDate' ? <i className="fad fa-sort-up"></i>
                                : <i className="fad fa-sort"></i>
                            }
                        </div>
                        <div className="table-cell -description _30">Description</div>
                        <div className="table-cell _30">Assignee</div>
                        <div className="table-cell _30">Assignee Uploads</div>
                    </div>
                    {
                        paginatedList && paginatedList.length > 0 ? 
                        paginatedList.map((requestTask, i) => 
                            <RequestTaskTableListItem  
                                key={i}
                                requestTask={requestTask}
                                checked={selectedTaskIds.includes(requestTask._id)}
                                handleSelectRequestTask={handleSelectRequestTask}
                                userMap={userMap}
                                handleUpdateRequestTask={handleUpdateRequestTask}
                                isViewing={isViewing}
                            />
                        )
                        :
                        <div className="table-head empty-state">
                            <div className="table-cell" colSpan="6">
                                <em>No Request List</em>
                            </div>
                        </div>
                    }
                </div>
            </div>
            <PageTabber
                totalItems={isFiltered && requestTaskList.pagination ? orderedList.length : orderedList.length}
                totalPages={Math.ceil(isFiltered && requestTaskList.pagination ? orderedList.length / requestTaskList.pagination.per : orderedList.length / 50)}
                pagination={requestTaskList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="bottom"
                itemName="tasks"
                searchText="Search..."
            />
        </div>
    )
  }
}

RequestTaskList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

RequestTaskList.defaultProps = {

}

const mapStoreToProps = (store, props) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    let { requestTaskList, sortedAndFilteredList, match } = props;
    /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
    let paginatedList = [];
    let orderedList = []; 
    const filter = requestTaskList.filter 
    const query = filter ? filter.query : '';
    const sortBy = filter ? filter.sortBy : 'date'; 

    console.log("sortedAndFilteredList", sortedAndFilteredList)

    if (sortedAndFilteredList) {
        sortedAndFilteredList = sortedAndFilteredList.filter(item => item.status === match.params.requestTaskStatus);
    }

    if(sortedAndFilteredList) {
        // TODO: in future, separate filtering and sorting 
        // SORT THE LIST
        switch(sortBy) {
            // case 'name': 
            //     orderedList = _.orderBy(sortedAndFilteredList, [item => item.name.toLowerCase()], ['asc']); 
            // break;
            // case '-name':
            //     orderedList = _.orderBy(sortedAndFilteredList, [item => item.name.toLowerCase()], ['desc']); 
            // break;
            case 'dueDate':
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.dueDate], ['asc']);
            break;
            case '-dueDate':
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.dueDate], ['desc']);
            break;
            default:
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at.toLowerCase()], ['desc']);
        }
    }


    // APPLY PAGINATION
    const pagination = requestTaskList.pagination || {page: 1, per: 50};
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;    
    paginatedList = _.slice(orderedList, start, end);

    return {
        loggedInUser: store.user.loggedIn.user 
        , paginatedList
        , orderedList
    }
}

export default withRouter(
        connect(
        mapStoreToProps
    )(RequestTaskList)
);
