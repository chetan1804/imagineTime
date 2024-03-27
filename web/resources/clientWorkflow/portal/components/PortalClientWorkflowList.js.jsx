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
import ClientWorkflowGridListItem from '../../components/ClientWorkflowGridListItem.js.jsx';

class PortalClientWorkflowList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs 
    }
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
      , clientWorkflowList
      , handleSetPagination
      , paginatedList
      , selectedTagIds
      , totalListInfo
    } = this.props;

    const isFiltered = (
      totalListInfo
      && clientWorkflowList
      && totalListInfo.items.length > clientWorkflowList.items.length
    )
    
    return (
      <div className="-client-workflow-list-wrapper">
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
        
        <div className="clientWorkflow-grid" >
          {/* <strong className="u-muted">
          { isFiltered ?
            <small>Matching ClientWorkflows &mdash; {clientWorkflowList.items.length}</small>
            :
            <small>All ClientWorkflows &mdash; {clientWorkflowList.items.length}</small>
          }
          </strong> */}
          { paginatedList.length > 0 ?
            paginatedList.map((clientWorkflow, i) => 
              <ClientWorkflowGridListItem 
                key={clientWorkflow._id + '_' + i} 
                clientWorkflow={clientWorkflow} 
              />
            )
            :
            <div className="empty-state">
              <em>No clientWorkflows</em>
            </div>
          }
        </div>
          
      
        <PageTabber
          totalItems={clientWorkflowList.items.length}
          totalPages={Math.ceil(clientWorkflowList.items.length / clientWorkflowList.pagination.per)}
          pagination={clientWorkflowList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
        />
      </div>
    )
  }
}

PortalClientWorkflowList.propTypes = {
  dispatch: PropTypes.func.isRequired
  // , allTags: PropTypes.array.isRequired
  , selectedTagIds: PropTypes.array
  , handleFilter: PropTypes.func.isRequired
  , handleOpenUploadModal: PropTypes.func 
  , handleQuery: PropTypes.func.isRequired 
  , handleSetPagination: PropTypes.func.isRequired
  , handleSort: PropTypes.func.isRequired 
  , sortedAndFilteredList: PropTypes.array 
  , clientWorkflowList: PropTypes.object.isRequired
  , viewingAs: PropTypes.string 
}

PortalClientWorkflowList.defaultProps = {
  handleOpenUploadModal: null 
  , sortedAndFilteredList: []
  , viewingAs: 'table'
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

   /**
    * REGARDING PAGINATION: Ideally pagination would be handled by the parent component WorkspaceClientWorkflows.
    * Unfortunately, the listArgs in WorkspaceClientWorkflows.state are not accessible from that component's mapStoreToProps
    * function. This means that we have to paginate the list here instead since it is passed to this component as a prop
    * with no need to be aware of the listArgs.
    */
   const { clientWorkflowList, sortedAndFilteredList } = props;
   let paginatedList = [];
   if(sortedAndFilteredList) {
     const pagination = clientWorkflowList.pagination || {page: 1, per: 50};
 
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
  )(PortalClientWorkflowList)
);
