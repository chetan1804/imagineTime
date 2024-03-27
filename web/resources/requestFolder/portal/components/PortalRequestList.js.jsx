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

import * as requestActions from '../../requestFolderActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import { CheckboxInput } from '../../../../global/components/forms';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';

// import components
import RequestTableListItem from '../../components/RequestFolderTableListItem.js.jsx';

class PortalRequestList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
    this._bind(
        '_handleFilter'
    )
  }

  componentDidMount() {

  }

  _handleFilter(sortBy) {
    const { RequestList, dispatch, listArgs } = this.props; 
    let newFilter = RequestList.filter;
    if(RequestList.filter.sortBy && RequestList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(requestActions.setFilter(newFilter, listArgs));
  }

  render() {

    const { 
        handleRequestListShowModal
        , handleToggleSelectAll
        , RequestList
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
    } = this.props;

    const isFiltered = (
        sortedAndFilteredList
        && orderedList
        && sortedAndFilteredList.length !== orderedList.length
      )
    const filter = RequestList && RequestList.filter && RequestList.filter.sortBy;
    const allRequestIdsSelected = selectedRequestIds.length ? paginatedList.every(p => selectedRequestIds.includes(p._id)) : false; 

    return (
        <div className="file-list-wrapper">
            <hr/>
            <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table -request-list-table">
                <div className="table-caption">
                    <PageTabber
                        totalItems={isFiltered && RequestList.pagination ? orderedList.length : sortedAndFilteredList.length}
                        totalPages={Math.ceil(isFiltered && RequestList.pagination ? orderedList.length / RequestList.pagination.per : sortedAndFilteredList.length / 50)}
                        pagination={RequestList.pagination}
                        setPagination={handleSetPagination}
                        setPerPage={this.props.setPerPage}
                        viewingAs="top"
                        itemName="requests"
                    />
                </div>
                <div className="table-head" >
                    <div className="table-cell">
                        { handleToggleSelectAll ? 
                            <CheckboxInput
                                name="file"
                                value={allRequestIdsSelected}
                                change={() => handleToggleSelectAll(paginatedList, allRequestIdsSelected)}
                                checked={allRequestIdsSelected}
                                clearSelectedRequestIds={clearSelectedRequestIds}
                            />
                        :
                        null
                        }
                    </div>
                    <div className="table-cell"></div>
                    <div className="table-cell -title sortable" onClick={() => this._handleFilter('name')}>Name
                        {
                            filter && filter == 'name' ?  <i className="fad fa-sort-down"></i>
                            : filter && filter == '-name' ? <i className="fad fa-sort-up"></i>
                            : <i className="fad fa-sort"></i>
                        }
                    </div>
                    <div className="table-cell _20">Delegated Admin</div>              
                    <div className="table-cell _20">Tasks</div>
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
            <PageTabber
                totalItems={isFiltered && RequestList.pagination ? orderedList.length : sortedAndFilteredList.length}
                totalPages={Math.ceil(isFiltered && RequestList.pagination ? orderedList.length / RequestList.pagination.per : sortedAndFilteredList.length / 50)}
                pagination={RequestList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="bottom"
                itemName="requests"
            />
        </div>
    )
  }
}

PortalRequestList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

PortalRequestList.defaultProps = {

}

const mapStoreToProps = (store, props) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    const { RequestList, sortedAndFilteredList } = props;
    /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
    console.log("sortedAndFilteredList", sortedAndFilteredList)
    let paginatedList = [];
    let orderedList = []; 
    const filter = RequestList.filter;
    const query = filter ? filter.query : '';
    const sortBy = filter ? filter.sortBy : 'date'; 

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
    const pagination = RequestList.pagination || {page: 1, per: 50};
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
    )(PortalRequestList)
);
