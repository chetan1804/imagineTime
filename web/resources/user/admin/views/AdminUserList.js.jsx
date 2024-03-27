/**
 * View component for /admin/users
 *
 * Displays a paginated list of all users in the system.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as userActions from '../../userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import { SearchInput } from  '../../../../global/components/forms';

// import utilities
import filterUtils from '../../../../global/utils/filterUtils';
import routeUtils from '../../../../global/utils/routeUtils';

// import user components
import AdminUserLayout from '../components/AdminUserLayout.js.jsx';
import AdminUserListItem from '../components/AdminUserListItem.js.jsx';

class AdminUserList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      queryText: this.props.query || ''
      , perPage: 50
      , searchQuery: {
        searchPerPage: 25
        , searchPageNumber: 1
        , searchSortName: 'updated_at'
        , searchSortAsc: 'desc'
        , searchText: "" 
      }
    };
    this._bind(
      '_handleQuery'
      , '_setPerPage'
      , '_handleSetPagination'
      , '_handleDispatch'
      , '_handleSort'
      , '_handleSearch'
      , '_handleKeyDown'
    );

    this.current = null;
  }

  componentWillReceiveProps(nextProps) {
    const nextSearch = nextProps.location.search;
    const currentSearch = this.props.location.search;
    if (!nextSearch && currentSearch) {
      const searchQuery = {
        searchPerPage: 25
        , searchPageNumber: 1
        , searchSortName: 'updated_at'
        , searchSortAsc: 'desc'
        , searchText: "" 
      }
      this._handleDispatch(searchQuery);
    }
  }

  componentDidMount() {
    const { location } = this.props;
    const query = new URLSearchParams(location.search);
    const page = query.get('page') || 1;
    const perPage = query.get('per') || 50;
    const searchQuery = _.cloneDeep(this.state.searchQuery);
    searchQuery.searchPageNumber = page;
    searchQuery.searchPerPage = perPage;
    this._handleDispatch(searchQuery);
  }

  _handleDispatch(searchQuery) {
    const { dispatch } = this.props;

    this.setState({
      searchQuery
    }, () => {
      dispatch(userActions.fetchListIfNeededV2(searchQuery, ...routeUtils.listArgsFromObject(searchQuery)));
    })
  }

  _setPerPage(per) {
    this.props.history.push({
      search: `?page=1&per=${per}`
    });
    const searchQuery = _.cloneDeep(this.state.searchQuery);
    searchQuery.searchPageNumber = 1;
    searchQuery.searchPerPage = per;
    this._handleDispatch(searchQuery);
  }

  _handleSetPagination(newPagination) {
    const searchQuery = _.cloneDeep(this.state.searchQuery);
    searchQuery.searchPageNumber = newPagination.page;
    searchQuery.searchPerPage = newPagination.per;
    this._handleDispatch(searchQuery);
  }

  _handleQuery(e) {
    const { dispatch } = this.props;
    this.setState({ queryText: e.target.value.toLowerCase() });
  }

  _handleFilter(sortBy) {

  }

  _handleSort(sortBy) {
    const searchQuery = _.cloneDeep(this.state.searchQuery);
    if (sortBy === searchQuery.searchSortName) {
      searchQuery.searchSortAsc = searchQuery.searchSortAsc === 'asc' ? 'desc' : 'asc';
    } else {
      searchQuery.searchSortAsc = 'desc';
      searchQuery.searchSortName = sortBy;
    }
    this._handleDispatch(searchQuery);
  }

  _handleSearch() {
    this.props.history.push({
      search: `?page=1&per=50`
    });
    const searchQuery = _.cloneDeep(this.state.searchQuery);
    const queryText = _.cloneDeep(this.state.queryText);
    searchQuery.searchText = queryText;
    searchQuery.searchPageNumber = 1;
    searchQuery.searchPerPage = 50;
    this._handleDispatch(searchQuery);
  }

  _handleKeyDown(e) {
    console.log('e.key', e.key);
    if (e.key === 'Enter') {
      console.log('do validate');
      console.log('keydown press');
      this._handleSearch();
    }
  }

  render() {
    const { userStore } = this.props;
    const { queryText } = this.state;
    /**
     * NOTE: Regarding isEmpty, when the app loads, all "product lists"
     * are null objects. They exist only after we create them.
     */

    const searchQuery = _.cloneDeep(this.state.searchQuery);
    const argsSearchQuery = routeUtils.listArgsFromObject(searchQuery);
    let utilFileStore = userStore.util.getSelectedStore(...argsSearchQuery);
    let sortedAndFilteredList = userStore.util.getList(...argsSearchQuery) || [];

    const isFetching = utilFileStore.isFetching;
    const isEmpty = sortedAndFilteredList && sortedAndFilteredList.length === 0;

    if (isEmpty && isFetching && this.current) {
      utilFileStore = this.current.utilFileStore;
      sortedAndFilteredList = this.current.sortedAndFilteredList;
    } else if (!isEmpty && !isFetching) {
      this.current = {
        utilFileStore
        , sortedAndFilteredList
      };
    }
    
    return (
      <AdminUserLayout>
        <Helmet><title>Admin User List</title></Helmet>
        <h3> All Registered Users</h3>
        <hr/>
        <p className="large">Here you can create, edit, and add permissions to users</p>
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          <div className="yt-toolbar">
            <div className="yt-tools right">
              <div className="search" style={{ display: 'inline-flex', marginRight: '10px' }}>
                <SearchInput
                  name="query"
                  value={queryText}
                  change={this._handleQuery}
                  placeholder="..."
                  required={false}
                  keydown={this._handleKeyDown}
                />
                <button className="yt-btn x-small rounded info" style={{ marginLeft: "10px" }} onClick={this._handleSearch}>Apply Filter</button>
              </div>
              <Link class="yt-btn small u-pullRight" to="/admin/users/new"> NEW USER </Link>
            </div>
          </div>
          <table className="yt-table striped">
            <caption>
              <PageTabber
                totalItems={utilFileStore && utilFileStore.pager && utilFileStore.pager.totalItems || 0}
                totalPages={utilFileStore && utilFileStore.pager && utilFileStore.pager.totalPages || 0}
                pagination={utilFileStore && utilFileStore.pager && utilFileStore.pager || {}}
                setPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                viewingAs="top"
                itemName="adminUser"
                isChanged={true}
              />
            </caption>
            <thead>
              <tr>
                <th className="-title sortable" onClick={this._handleSort.bind(this, 'name')}>Name
                  {
                    searchQuery.searchSortName === 'name' ?
                      searchQuery.searchSortAsc === 'asc' ? <i class="fad fa-sort-up"></i> : <i class="fad fa-sort-down"></i>
                    : <i class="fad fa-sort"></i>
                  }
                </th>
                <th className="-title sortable" onClick={this._handleSort.bind(this, 'username')}>Email
                  {
                    searchQuery.searchSortName === 'username' ?
                      searchQuery.searchSortAsc === 'asc' ? <i class="fad fa-sort-up"></i> : <i class="fad fa-sort-down"></i>
                    : <i class="fad fa-sort"></i>
                  }
                </th>
                <th className="-title sortable">Roles</th>
                <th className="-title sortable" onClick={this._handleSort.bind(this, 'enable_2fa')}>2FA
                  {
                    searchQuery.searchSortName === 'enable_2fa' ?
                      searchQuery.searchSortAsc === 'asc' ? <i class="fad fa-sort-up"></i> : <i class="fad fa-sort-down"></i>
                    : <i class="fad fa-sort"></i>
                  }
                </th>
                <th className="numbers sortable" onClick={this._handleSort.bind(this, 'updated_at')}>Last Modified
                  {
                    searchQuery.searchSortName === 'updated_at' ?
                      searchQuery.searchSortAsc === 'asc' ? <i class="fad fa-sort-up"></i> : <i class="fad fa-sort-down"></i>
                    : <i class="fad fa-sort"></i>
                  }
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredList.map((user, i) =>
                <AdminUserListItem
                  key={i}
                  user={user}
                  />
                )
              }
            </tbody>
          </table>
          <PageTabber
            totalItems={utilFileStore && utilFileStore.pager && utilFileStore.pager.totalItems}
            totalPages={utilFileStore && utilFileStore.pager && utilFileStore.pager.totalPages}
            pagination={utilFileStore && utilFileStore.pager && utilFileStore.pager}
            setPagination={this._handleSetPagination}
            setPerPage={this._setPerPage}
            viewingAs="bottom"
            itemName="adminUser"
            isChanged={true}
          />
        </div>
      </AdminUserLayout>
    )
  }
}

AdminUserList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  
  return {

    userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUserList)
);
