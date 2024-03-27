
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import filterUtils from '../../../global/utils/filterUtils';

// import resource components
// import PracticeFolderTemplateTableListItem from './PracticeFolderTemplateTableListItem.js.jsx';
import MergeFieldsListItem from './MergeFieldsListItem.js.jsx';

class MergeFieldsList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs 
    }
  }

  render() {
    const {
      paginatedList
      , userMap
      , match
      , setPagination
      , setPerPage
      , mergeFieldList
      , handleQuery
      , fileQuery
      , sortedAndFilteredList
    } = this.props;
    

    // const isFiltered = folderTemplateList && folderTemplateList.query && folderTemplateList.query.length > 0;

    return (
      <div className="file-list-wrapper">
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-options -left">
              <div className="tab-bar-nav" style={{ marginTop: 0 }}>
                <ul className="navigation">
                  <li>
                    <NavLink exact 
                      to={`/firm/${match.params.firmId}/settings/documents`} className="-link-border-none">
                      Templates
                    </NavLink>
                    <NavLink exact 
                      to={`/firm/${match.params.firmId}/settings/documents/merge-fields`} className="-link-border-none active">
                      Merge Fields
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <hr className="-mobile-yt-hide" style={{ margin: 0 }} />
        <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
          <div className="table-caption">
            <PageTabber
              totalItems={sortedAndFilteredList.length}
              totalPages={Math.ceil(sortedAndFilteredList.length / mergeFieldList.pagination.per)}
              pagination={mergeFieldList.pagination}
              setPagination={setPagination}
              setPerPage={setPerPage}
              viewingAs="top"
              itemName="templates"
              searchText="Search..."
              handleQuery={handleQuery}
              query={fileQuery}
              enableSearch={true}
            />
          </div>
          <div className="-table-horizontal-scrolling">
            <div className="table-head" >
              <div className="table-cell -folder-title _40" style={{ minWidth: "400px" }}>Name</div>
              <div className="table-cell _40">Value</div>
              <div className="table-cell"></div>
            </div>
            {
              paginatedList && paginatedList.length ? 
              paginatedList.map((mergeField, i) => 
                  <MergeFieldsListItem
                    key={i}
                    mergeField={mergeField}
                    userMap={userMap}
                    match={match}
                  />
              )
              :
              <div className="table-head empty-state">
                <div className="table-cell" colSpan="6">
                  <em>No merge fields</em>
                </div>
              </div>
            }
          </div>
        </div>
        <PageTabber
          totalItems={sortedAndFilteredList.length}
          totalPages={Math.ceil(sortedAndFilteredList.length / mergeFieldList.pagination.per)}
          pagination={mergeFieldList.pagination}
          setPagination={setPagination}
          setPerPage={setPerPage}
          viewingAs="bottom"
          itemName="templates"
        />
      </div>
    )
  }
}

MergeFieldsList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleFilter: PropTypes.func
  , handleQuery: PropTypes.func 
  , paginatedList: PropTypes.array.isRequired
  , sortedAndFilteredList: PropTypes.array
  , folderTemplateList: PropTypes.object
  , viewingAs: PropTypes.string 
}

MergeFieldsList.defaultProps = {
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
  const { mergeFieldList, mergeFieldListItems } = props;
  let paginatedList = [];
  let sortedAndFilteredList = [];

  if(mergeFieldListItems) {
    const mergeFieldMap = store.mergeField.byId;
    const query = mergeFieldList.query;

    // FILTER BY QUERY
    let filteredByQuery = mergeFieldList.items;
    if (query) {
      let queryTestString = ("" + query).toLowerCase().trim();
      queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and 
      filteredByQuery = mergeFieldList.items ? mergeFieldList.items.filter((id) => {
        return filterUtils.filterTag(queryTestString, mergeFieldMap[id]);
      }) : [];  
    }
    
    console.log("filteredByQuery", filteredByQuery)

    // POPULATE THE LIST
    sortedAndFilteredList = filteredByQuery.map((item) => {
      const newItem = mergeFieldMap[item];
      return newItem;
    });

    console.log("sortedAndFilteredList", sortedAndFilteredList)

    if (sortedAndFilteredList) {
      sortedAndFilteredList = _.orderBy(sortedAndFilteredList, [item => item.updated_at], ['desc']);
    }

    const pagination = mergeFieldList.pagination || {page: 1, per: 100};
    pagination.page = pagination.page || 1;
    pagination.per = pagination.per || 100;

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
  )(MergeFieldsList)
);