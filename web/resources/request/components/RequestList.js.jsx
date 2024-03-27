/**
 * View component for /firm/:firmId/workspaces/:clientId/files 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries
import { Helmet } from 'react-helmet';

import * as requestActions from '../requestActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';
import { CheckboxInput } from '../../../global/components/forms';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

// import components
import RequestTableListItem from './RequestTableListItem.js.jsx';


class RequestList extends Binder {
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

  componentDidMount() {

  }

  _handleFilter(sortBy) {
    const { requestList, dispatch, listArgs } = this.props; 
    let newFilter = requestList.filter;
    if(requestList.filter.sortBy && requestList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(requestActions.setFilter(newFilter, listArgs));
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {

    const { 
        handleRequestListShowModal
        , handleToggleSelectAll
        , requestList
        , sortedAndFilteredList
        , orderedList
        , paginatedList
        , handleSelectRequest
        , selectedRequestIds
        , clearSelectedRequestIds
        , handleSetPagination
        , setPerPage
        , userMap
        , handleUpdateRequest
        , isViewing
    } = this.props;

    const {
        showMobileActionOption
    } = this.state;

    const isFiltered = (
        sortedAndFilteredList
        && orderedList
        && sortedAndFilteredList.length !== orderedList.length
      )
    const filter = requestList && requestList.filter && requestList.filter.sortBy;
    const allRequestIdsSelected = selectedRequestIds && selectedRequestIds.length ? paginatedList.every(p => selectedRequestIds.includes(p._id)) : false; 

    return (
        <div className="file-list-wrapper">
            {
                isViewing === "portal" ? null :
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
                        viewingAs="request-list"
                        handleRequestListShowModal={handleRequestListShowModal}
                    />
                    </div>
                </div>
            }
            {
                isViewing === "portal" ? null :
                <div className="yt-toolbar">
                    <div className="yt-tools space-between">
                        <div className="-options -left"></div>
                        <div className="-options -right">
                            <button className="yt-btn x-small info" onClick={handleRequestListShowModal}>New Request List</button>
                            {/* <button className="yt-btn x-small info" disabled={true}>New Folder</button> */}
                        </div>
                    </div>
                </div>
            }
            <hr className="-mobile-yt-hide" />
            <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table -request-list-table">
                <div className="table-caption">
                    <PageTabber
                        totalItems={isFiltered && requestList.pagination ? orderedList.length : sortedAndFilteredList.length}
                        totalPages={Math.ceil(isFiltered && requestList.pagination ? orderedList.length / requestList.pagination.per : sortedAndFilteredList.length / 50)}
                        pagination={requestList.pagination}
                        setPagination={handleSetPagination}
                        setPerPage={this.props.setPerPage}
                        viewingAs="top"
                        itemName="request list"
                        searchText="Search..."
                    />
                </div>
                <div className="-table-horizontal-scrolling">
                    <div className="table-head" >
                        {/* {
                            isViewing === "portal" ? null :
                            <div className="table-cell">
                                { handleToggleSelectAll ? 
                                    <CheckboxInput
                                        name="file"
                                        value={allRequestIdsSelected}
                                        change={() => handleToggleSelectAll(paginatedList, allRequestIdsSelected)}
                                        checked={allRequestIdsSelected}
                                        // clearSelectedRequestIds={clearSelectedRequestIds}
                                    />
                                :
                                null
                                }
                            </div>
                        } */}
                        {
                            isViewing === "portal" ? null : <div className="table-cell"></div>
                        }
                        <div className="table-cell -title sortable _40" onClick={() => this._handleFilter('name')}>Name
                            {
                                filter && filter == 'name' ?  <i className="fad fa-sort-down"></i>
                                : filter && filter == '-name' ? <i className="fad fa-sort-up"></i>
                                : <i className="fad fa-sort"></i>
                            }
                        </div>
                        <div className="table-cell _30">Delegated Admin</div>              
                        <div className="table-cell _15">Tasks</div>
                        <div className="table-cell _15">Uploaded files</div>
                        <div className="table-cell _30">Created By</div>
                        <div className="table-cell -date sortable" onClick={() => this._handleFilter('date')}>Last Updated
                            {
                                filter && filter == 'date' ? <i className="fad fa-sort-up"></i>
                                : filter && filter == '-date' ? <i className="fad fa-sort-down"></i>
                                : <i className="fad fa-sort"></i>
                            }
                        </div>
                    </div>
                    { paginatedList && paginatedList.length > 0 ? 
                        paginatedList.map((request, i) => 
                            <RequestTableListItem  
                                key={i}
                                request={request}
                                checked={selectedRequestIds.includes(request._id)}
                                handleSelectRequest={handleSelectRequest}
                                userMap={userMap}
                                handleUpdateRequest={handleUpdateRequest}
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
                totalItems={isFiltered && requestList.pagination ? orderedList.length : sortedAndFilteredList.length}
                totalPages={Math.ceil(isFiltered && requestList.pagination ? orderedList.length / requestList.pagination.per : sortedAndFilteredList.length / 50)}
                pagination={requestList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="bottom"
                itemName="request list"
                searchText="Search..."
            />
        </div>
    )
  }
}

RequestList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

RequestList.defaultProps = {

}

const mapStoreToProps = (store, props) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    const { requestList, sortedAndFilteredList } = props;
    /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
    let paginatedList = [];
    let orderedList = []; 
    const filter = requestList.filter 
    const query = filter ? filter.query : '';
    const sortBy = filter ? filter.sortBy : 'date'; 

    console.log("sortedAndFilteredList", sortedAndFilteredList)
    if(sortedAndFilteredList) {
        // TODO: in future, separate filtering and sorting 
        // SORT THE LIST
        switch(sortBy) {
            case 'name': 
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.name.toLowerCase()], ['asc']); 
            break;
            case '-name':
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.name.toLowerCase()], ['desc']); 
            break;
            case 'date':
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['asc']);
            break;
            case '-date':
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
            break;
            default:
                orderedList = _.orderBy(sortedAndFilteredList, [item => item.name.toLowerCase()], ['asc']);
        }
    }


    // APPLY PAGINATION
    const pagination = requestList.pagination || {page: 1, per: 50};
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;    
    paginatedList = _.slice(orderedList, start, end);

    return {
        loggedInUser: store.user.loggedIn.user
        , orderedList
        , paginatedList
    }
}

export default withRouter(
        connect(
        mapStoreToProps
    )(RequestList)
);
