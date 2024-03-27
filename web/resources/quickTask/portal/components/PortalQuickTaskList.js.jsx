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
import QuickTaskGridListItem from '../../components/QuickTaskGridListItem.js.jsx';

class PortalQuickTaskList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
    }
    this._bind(
    )
  }

  render() {
    const {
      quickTaskList
      , handleSetPagination
      , paginatedList
    } = this.props;
    
    return (
      <div className="-quick-task-list-wrapper">
        {/* TODO: add back in filters and simple search bar 
        <div className="yt-toolbar"> 
          <div className="yt-tools space-between">
            <div className="-filters -left">
              <strong>Filter requests by: </strong>
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
            <div className="-find -right">

          
            </div>
          </div>
        </div>
        <hr/> */}
        
        <div className="quick-task-grid" >
        { paginatedList.length > 0 ?
          paginatedList.map((quickTask, i) => 
            <QuickTaskGridListItem
              key={quickTask._id + '_' + i}
              quickTask={quickTask} 
            />
          )
          :
          <div className="empty-state">
            <em>No quick tasks</em>
          </div>
        }
        </div>
        <PageTabber
          totalItems={quickTaskList.items.length}
          totalPages={Math.ceil(quickTaskList.items.length / quickTaskList.pagination.per)}
          pagination={quickTaskList.pagination}
          setPagination={handleSetPagination}
          viewingAs="bottom"
          itemName="tasks"
        />
      </div>
    )
  }
}

PortalQuickTaskList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , selectedTagIds: PropTypes.array
  // , handleFilter: PropTypes.func.isRequired
  , handleQuery: PropTypes.func.isRequired 
  , handleSetPagination: PropTypes.func.isRequired
  , handleSort: PropTypes.func.isRequired 
  , sortedAndFilteredList: PropTypes.array 
  , quickTaskList: PropTypes.object.isRequired
}

PortalQuickTaskList.defaultProps = {
  sortedAndFilteredList: []
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   const { quickTaskList, sortedAndFilteredList } = props;
   let paginatedList = [];
   if(sortedAndFilteredList) {
     const pagination = quickTaskList && quickTaskList.pagination && quickTaskList.pagination.page && quickTaskList.pagination.per ? quickTaskList.pagination : {page: 1, per: 50};
 
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
  )(PortalQuickTaskList)
);
