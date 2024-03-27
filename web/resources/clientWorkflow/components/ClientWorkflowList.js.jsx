/**
 * View component for /firm/:firmId/workspaces/:clientId/client-workflows 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries

// import actions 
import * as clientWorkflowActions from '../clientWorkflowActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import DisplayAsButtons from '../../../global/components/helpers/DisplayAsButtons.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';

// import resource components
import ClientWorkflowGridListItem from './ClientWorkflowGridListItem.js.jsx';
import ClientWorkflowTableListItem from './ClientWorkflowTableListItem.js.jsx';

class ClientWorkflowList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs 
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleFilter'
    )
  }

  _handleSelectedTagsChange(e) {
    console.log("handleSelectedTagsChange", e)
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }

  _handleFilter(sortBy) {
    const { clientWorkflowList, dispatch, clientWorkflowListArgs } = this.props; 
    let newFilter = clientWorkflowList.filter;
    if(clientWorkflowList.filter.sortBy && clientWorkflowList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(clientWorkflowActions.setFilter(newFilter, ...clientWorkflowListArgs));
  }

  render() {
    const {
      allTags
      , handleSetPagination
      , paginatedList
      , selectedTagIds
      , totalListInfo
      , clientWorkflowList
    } = this.props;

    const isFiltered = (
      totalListInfo
      && clientWorkflowList
      && totalListInfo.items.length > clientWorkflowList.items.length
    )

    const filter = clientWorkflowList && clientWorkflowList.filter && clientWorkflowList.filter.sortBy; 
    
    return (
      <div className="-client-workflow-list-wrapper">
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left">
              {/* <strong>Filter requests by: </strong>
              <FilterBy
                applyFilter={this._handleSelectedTagsChange}
                displayKey="name"
                items={allTags || []}
                label="Tags"
                name="_tags"
                selected={selectedTagIds}
                valueKey="_id"
              /> */}
            </div>
            <div className="-options -right">
              <DisplayAsButtons
                displayAs={this.state.viewingAs}
                displayGrid={() => this.setState({viewingAs: 'grid'})}
                displayTable={() => this.setState({viewingAs: 'table'})}
              />
              {/* { match.params.firmId ?
                <button className="yt-btn x-small rounded info" onClick={this.props.handleOpenUploadModal}><i className="fas fa-plus"/></button>
                : 
                null 
              } */}
            </div>
          </div>
        </div>
        <hr/>
        { this.state.viewingAs === 'grid' ? 
          <div className="clientWorkflow-grid" >
            <strong className="u-muted">
            { isFiltered ?
              <small>Matching ClientWorkflows &mdash; {clientWorkflowList.items.length}</small>
              :
              <small>All ClientWorkflows &mdash; {clientWorkflowList.items.length}</small>
            }
            </strong>
            { paginatedList.length > 0 ?
              <div className="yt-row">
              { paginatedList.map((clientWorkflow, i) => 
                <ClientWorkflowGridListItem key={clientWorkflow._id + '_' + i} clientWorkflow={clientWorkflow} />
              )}
              </div>
              :
              <div className="empty-state">
                <em>No clientWorkflows</em>
              </div>
            }
          </div>
          : 
          <table className="yt-table firm-table -workspace-table truncate-cells">
            <caption>
              { isFiltered ?
                <small>Matching ClientWorkflows &mdash; {clientWorkflowList.items.length}</small>
                :
                <small>All ClientWorkflows &mdash; {clientWorkflowList.items.length}</small>
              }
              <div className="per-page-select u-pullRight">
                <label>Show per page: </label>
                <select
                  name="numPerPage"
                  onChange={(e) => this.props.setPerPage(e.target.value)}
                  value={clientWorkflowList.pagination.per}
                >
                  <option value={25}> 25 </option>
                  <option value={50}> 50 </option>
                  <option value={100}> 100 </option>
                </select>
              </div>
            </caption>
            <thead>
              <tr>
                <th className="-title sortable" onClick={() => this._handleFilter('title')}>Title
                  {filter && filter == 'title' ? 
                    <i class="fad fa-sort-down"></i>
                  : filter && filter == '-title' ?
                    <i class="fad fa-sort-up"></i>
                  : 
                  <i class="fad fa-sort"></i>
                  }
                </th>
                {/* <th className="_20">Tags</th> */}
                <th className="-date" onClick={null}>Due Date</th>
                <th className="sortable" onClick={() => this._handleFilter('published')}>Status</th>
                <th className="-comments"/>
              </tr>
            </thead>
            <tbody>
              { paginatedList.length > 0 ? 
                paginatedList.map((clientWorkflow, i) => 
                  <ClientWorkflowTableListItem key={clientWorkflow._id + '_' + i} clientWorkflow={clientWorkflow}/>
                )
                :
                <tr className="empty-state">
                  <td colSpan="5">
                    <em>No clientWorkflows</em>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
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

ClientWorkflowList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , allTags: PropTypes.array.isRequired
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

ClientWorkflowList.defaultProps = {
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
   let orderedList = []; 
   if(sortedAndFilteredList) {

    const filter = clientWorkflowList ? clientWorkflowList.filter : null; 
    const sortBy = filter && filter.sortBy ? filter.sortBy : 'title'; 

    // SORT THE LIST
    switch(sortBy) {
      case 'title':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.title.toLowerCase()], ['asc']);
        break;
      case '-title':
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.title.toLowerCase()], ['desc']);
        break;
      case 'published':
        orderedList = sortedAndFilteredList.filter(item => item.status == "published");
        break;
      case '-published':
        orderedList = sortedAndFilteredList.filter(item => item.status == "draft");
        break;
      default: 
        orderedList = _.orderBy(sortedAndFilteredList, [item => item.created_at], ['asc']);
    }

    const pagination = clientWorkflowList.pagination || {page: 1, per: 50};
 
    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);      
  }
 
  
  return {
    paginatedList: paginatedList
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ClientWorkflowList)
);
