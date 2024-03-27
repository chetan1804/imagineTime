/**
 * View component for /portal/:clientId/client-workflows 
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
import DisplayAsButtons from '../../../../global/components/helpers/DisplayAsButtons.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';

// import resource components
import RequestTaskGridListItem from '../../components/RequestTaskGridListItem.js.jsx';

class PortalRequestTaskList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
    this._bind(
    )
  }

  render() {
    const {
      requestTaskList
      , handleSetPagination
      , paginatedList
    } = this.props;
    
    return (
      <div className="-quick-task-list-wrapper">
        <div className="quick-task-grid" >
        { paginatedList.length > 0 ?
          paginatedList.map((requestTask, i) => 
            <RequestTaskGridListItem
              key={requestTask._id + '_' + i}
              requestTask={requestTask} 
            />
          )
          :
          <div className="empty-state">
            <em>No tasks</em>
          </div>
        }
        </div>
        <PageTabber
          totalItems={requestTaskList.items.length}
          totalPages={Math.ceil(requestTaskList.items.length / requestTaskList.pagination.per)}
          pagination={requestTaskList.pagination}
          setPagination={handleSetPagination}
          viewingAs="bottom"
          itemName="tasks"
        />
      </div>
    )
  }
}

PortalRequestTaskList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , selectedTagIds: PropTypes.array
  // , handleFilter: PropTypes.func.isRequired
  , handleQuery: PropTypes.func.isRequired 
  , handleSetPagination: PropTypes.func.isRequired
  , handleSort: PropTypes.func.isRequired 
  , sortedAndFilteredList: PropTypes.array 
  , requestTaskList: PropTypes.object.isRequired
}

PortalRequestTaskList.defaultProps = {
  sortedAndFilteredList: []
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   const { requestTaskList, sortedAndFilteredList } = props;
   let paginatedList = [];
   if(sortedAndFilteredList) {
     const pagination = requestTaskList && requestTaskList.pagination && requestTaskList.pagination.page && requestTaskList.pagination.per ? requestTaskList.pagination : {page: 1, per: 50 };
 
     // APPLY PAGINATION
     const start = (pagination.page - 1) * pagination.per;
     const end = start + pagination.per;
     paginatedList = _.slice(sortedAndFilteredList, start, end);
   }

  return {
    paginatedList: paginatedList
    , loggedInUser: store.user.loggedIn.user
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PortalRequestTaskList)
);
