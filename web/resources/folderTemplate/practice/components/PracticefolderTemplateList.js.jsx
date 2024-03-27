
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import filterUtils from '../../../../global/utils/filterUtils';

// import resource components
import PracticeFolderTemplateTableListItem from './PracticeFolderTemplateTableListItem.js.jsx';

class PracticefolderTemplateList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs 
    }
    // this._bind(
    // )
  }

  render() {
    const {
      handleSetPagination
      , paginatedList
      , sortedAndFilteredList
      , folderTemplateListItems
      , folderTemplateList
      , userMap
      , match
      , setPagination
      , dispatch
    } = this.props;
    

    const isFiltered = folderTemplateList && folderTemplateList.query && folderTemplateList.query.length > 0;

    return (
      <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
        <div className="table-caption">
          <PageTabber
            totalItems={folderTemplateList.items.length}
            totalPages={Math.ceil(folderTemplateList.items.length / folderTemplateList.pagination.per)}
            pagination={folderTemplateList.pagination}
            setPagination={setPagination}
            setPerPage={this.props.setPerPage}
            viewingAs="top"
            itemName="templates"
            searchText="Search..."
          />
        </div>
        <div className="-table-horizontal-scrolling">
          <div className="table-head" >
            <div className="table-cell"></div>
            <div className="table-cell -folder-title _30">Name</div>
            <div className="table-cell _30">Description</div>
            <div className="table-cell">Active Folders</div>
            <div className="table-cell">Deleted Folders</div>
            <div className="table-cell _20">Created By</div>
            <div className="table-cell -date">Last Updated</div>
          </div>
          {
            paginatedList && paginatedList.length ? 
            paginatedList.map((folderTemplate, i) => 
                <PracticeFolderTemplateTableListItem
                  key={i}
                  folderTemplate={folderTemplate}
                  userMap={userMap}
                  match={match}
                  dispatch={dispatch}
                />
            )
            :
            <div className="table-head empty-state">
              <div className="table-cell" colSpan="6">
                <em>No files</em>
              </div>
            </div>
          }
        </div>
      </div>
    )
  }
}

PracticefolderTemplateList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleFilter: PropTypes.func
  , handleQuery: PropTypes.func 
  , paginatedList: PropTypes.array.isRequired
  , sortedAndFilteredList: PropTypes.array
  , folderTemplateList: PropTypes.object
  , viewingAs: PropTypes.string 
}

PracticefolderTemplateList.defaultProps = {
  allFolderTemplates: null 
  , handleFilter: null
  , handleQuery: null 
  , handleSort: null 
  , sortedAndFilteredList: []
  , viewingAs: 'table'
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  const { folderTemplateList, folderTemplateListItems } = props;
  let paginatedList = [];
  let sortedAndFilteredList = [];

  if(folderTemplateListItems) {
    const folderTemplateMap = store.folderTemplate.byId;

    const query = folderTemplateList.query;

    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    let filteredByQuery = folderTemplateListItems ? folderTemplateListItems.filter((data) => {
      return filterUtils.filterTag(queryTestString, folderTemplateMap[data._id]);
    }) : [];
    
    // POPULATE THE LIST
    sortedAndFilteredList = filteredByQuery.map((item) => {
      const newItem = folderTemplateMap[item._id];
      return newItem;
    });

    if (sortedAndFilteredList) {
      sortedAndFilteredList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
    }

    const pagination = folderTemplateList.pagination || {page: 1, per: 50};

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(sortedAndFilteredList, start, end);      
  }

  return {
    paginatedList: paginatedList
    , sortedAndFilteredList: sortedAndFilteredList
    , userMap: store.user.byId
  }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticefolderTemplateList)
);