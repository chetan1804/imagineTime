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

import * as requestFolderActions from '../requestFolderActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import routeUtils from '../../../global/utils/routeUtils';
import { CheckboxInput } from '../../../global/components/forms';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../global/components/helpers/CloseWrapper.js.jsx';

// import components
import RequestFolderTableListItem from './RequestFolderTableListItem.js.jsx';


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
    const { requestFolderList, dispatch, listArgs } = this.props; 
    let newFilter = requestFolderList.filter;
    if(requestFolderList.filter.sortBy && requestFolderList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(requestFolderActions.setFilter(newFilter, listArgs));
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {

    const { 
        handleRequestFolderShowModal
        , handleToggleSelectAll
        , requestFolderList
        , sortedAndFilteredList
        , orderedList
        , paginatedList
        , handleSelectRequest
        , selectedRequestsFolderIds
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
    const filter = requestFolderList && requestFolderList.filter && requestFolderList.filter.sortBy;
    const allRequestIdsSelected = selectedRequestsFolderIds.length ? paginatedList.every(p => selectedRequestsFolderIds.includes(p._id)) : false; 
    
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
                        viewingAs="request-folder"
                        handleRequestFolderShowModal={handleRequestFolderShowModal}
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
                            <button className="yt-btn x-small info" onClick={handleRequestFolderShowModal}>New Folder</button>
                            {/* <button className="yt-btn x-small info" disabled={true}>New Folder</button> */}
                        </div>
                    </div>
                </div>
            }
            <hr/>
            <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table -request-list-table">
                <div className="table-caption">
                    <PageTabber
                        totalItems={isFiltered && requestFolderList.pagination ? orderedList.length : sortedAndFilteredList.length}
                        totalPages={Math.ceil(
                            isFiltered && requestFolderList.pagination ? orderedList.length / requestFolderList.pagination.per 
                            : requestFolderList.pagination ? sortedAndFilteredList.length / (requestFolderList.pagination.per || 50)
                            : sortedAndFilteredList.length / 50)}
                        pagination={requestFolderList.pagination}
                        setPagination={handleSetPagination}
                        setPerPage={this.props.setPerPage}
                        viewingAs="top"
                        itemName="request"
                        searchText="Search..."
                    />
                </div>
                <div className="-table-horizontal-scrolling">
                    <div className="table-head" >
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
                        <div className="table-cell -tags _30">Requests</div>
                        <div className="table-cell -tags">Tasks</div>
                        <div className="table-cell -tags">Uploaded files</div>                        
                        <div className="table-cell -date sortable" onClick={() => this._handleFilter('date')}>Last Updated
                            {
                                filter && filter == 'date' ? <i className="fad fa-sort-up"></i>
                                : filter && filter == '-date' ? <i className="fad fa-sort-down"></i>
                                : <i className="fad fa-sort"></i>
                            }
                        </div>
                    </div>
                    { paginatedList && paginatedList.length > 0 ? 
                        paginatedList.map((requestFolder, i) => 
                            <RequestFolderTableListItem  
                                key={i}
                                requestFolder={requestFolder}
                                checked={selectedRequestsFolderIds.includes(requestFolder._id)}
                                handleSelectRequest={handleSelectRequest}
                                userMap={userMap}
                                handleUpdateRequest={handleUpdateRequest}
                                isViewing={isViewing}
                            />
                        )
                    :
                    <div className="table-head empty-state">
                        <div className="table-cell" colSpan="6">
                            <em>No Folder</em>
                        </div>
                    </div>
                    }
                </div>
            </div>
            <PageTabber
                totalItems={isFiltered && requestFolderList.pagination ? orderedList.length : sortedAndFilteredList.length}
                totalPages={Math.ceil(
                    isFiltered && requestFolderList.pagination ? orderedList.length / requestFolderList.pagination.per 
                    : requestFolderList.pagination ? sortedAndFilteredList.length / (requestFolderList.pagination.per || 50)
                    : sortedAndFilteredList.length / 50)}
                pagination={requestFolderList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="bottom"
                itemName="request"
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
    const { requestFolderList, sortedAndFilteredList } = props;
    console.log("requestFolderList", requestFolderList)
    /**
   * REGARDING PAGINATION: Pagination would normally be handled on the parent component WorkspaceFiles.
   * The listArgs in WorkspaceFiles.state are not accessible from that component's mapStoreToProps
   * function. We have to paginate the list here instead since it is passed to this component as a prop
   * with no need to be aware of the listArgs.
   */
    let paginatedList = [];
    let orderedList = []; 
    const filter = requestFolderList.filter;
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
    const pagination = requestFolderList.pagination || {page: 1, per: 50};
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
