
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import FilterBy from '../../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import DisplayAsButtons from '../../../../global/components/helpers/DisplayAsButtons.js.jsx';
import { SearchInput } from  '../../../../global/components/forms';
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';

// import utilities
import filterUtils from '../../../../global/utils/filterUtils';

// import resource components
import PracticeTagTableListItem from './PracticeTagTableListItem.js.jsx';

class PracticeTagList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs 
      , showMobileActionOption: false
    }
    this._bind(
      '_handleCloseMobileOption'
    )
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  render() {
    const {
      handleSetPagination
      , handleQuery
      , paginatedList
      , query
      , sortedAndFilteredList
      , tagList
      , userMap
      , handleShowNewTagModal
    } = this.props;
    

    const {
      showMobileActionOption
    } = this.state

    return (
      <div className="tag-list-wrapper -list-wrapper-80-yt-col">
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
              viewingAs="tag-list"
              handleShowNewTagModal={handleShowNewTagModal}
          />
          </div>
        </div>
        <div className="yt-toolbar">
          <div className="yt-tools right">
            <div className="search">
              <SearchInput
                name="query"
                value={query}
                change={handleQuery}
                placeholder="Search..."
                required={false}
              />
            </div>
          </div>
        </div>
        { this.state.viewingAs === 'grid' ? 
          <div className="file-grid" >
            {/*
              * TODO: Create a PracticeTagGridListItem
              */}
          </div>
          : 
          <table className="yt-table firm-table -workspace-table truncate-cells">
            <caption>
              <PageTabber
                totalItems={tagList.items.length}
                totalPages={Math.ceil(tagList.items.length / tagList.pagination.per)}
                pagination={tagList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="top"
                itemName="tags"
                searchText="Search..."
              />
            </caption>
            <thead>
              <tr>
                <th className="_40">Name</th>
                <th className="_20">Type</th>
                <th className="_40">Created By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="-table-header-mobile-layout" style={{ display: "none" }}>
                <th className="_40">Name</th>
                <th className="_20">Type</th>
                <th className="_40">Created By</th>
                <th></th>
              </tr>
              { paginatedList.length > 0 ? 
                paginatedList.map((tag, i) => {
                  return (
                    <PracticeTagTableListItem
                      key={"tag_" + tag._id + "_" + i}
                      tag={tag}
                      user={userMap[tag._createdBy] ? userMap[tag._createdBy] : {}}
                    />
                  )
                })
                : 
                <tr className="empty-state">
                  <td colSpan="4">
                    <em>No tags</em>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
        <PageTabber
          totalItems={tagList.items.length}
          totalPages={Math.ceil(tagList.items.length / tagList.pagination.per)}
          pagination={tagList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
          itemName="tags"
          searchText="Search..."
        />
      </div>
    )
  }
}

PracticeTagList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , handleFilter: PropTypes.func
  , handleQuery: PropTypes.func 
  , handleSetPagination: PropTypes.func.isRequired
  , paginatedList: PropTypes.array.isRequired
  , sortedAndFilteredList: PropTypes.array
  , tagList: PropTypes.object
  , viewingAs: PropTypes.string 
}

PracticeTagList.defaultProps = {
  allTags: null 
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
  const { tagList, tagListItems } = props;
  let paginatedList = [];
  let sortedAndFilteredList = [];

  if(tagListItems) {
    const tagMap = store.tag.byId;

    const query = tagList.query;

    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    let filteredByQuery = tagList.items ? tagList.items.filter((tagId) => {
      return filterUtils.filterTag(queryTestString, tagMap[tagId]);
    }) : [];
    // POPULATE THE LIST
    sortedAndFilteredList = filteredByQuery.map((item) => {
      const newItem = tagMap[item];
      return newItem;
    });

    const pagination = tagList.pagination || {page: 1, per: 50};

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
  )(PracticeTagList)
);
