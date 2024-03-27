/**
 * View component for /admin/firms/:firmId/contacts
 * 
 * Displays all of a firms client contacts.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import utils
import { filterUtils, routeUtils } from '../../../../global/utils'

// import actions
import * as clientActions from '../../../client/clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as userActions from '../../userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import { SearchInput } from  '../../../../global/components/forms';

// import resource components
import AdminClientLayout from '../../../client/admin/components/AdminClientLayout.js.jsx';
import AdminClientContactListItem from '../components/AdminClientContactListItem.js.jsx';

class AdminFirmContactList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: '1'
      , per: '50'
      , queryText: ''
      , sortBy: 'name'
    };
    this._bind(
      '_handleSetPagination'
      , '_setPerPage'
      , '_handleFilter'
      , '_handleQuery'
    )
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(clientUserActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts 
  }

  componentDidUpdate(prevProps) {
    const { dispatch, match } = this.props;
    if(match.params.firmId != prevProps.match.params.firmId) {
      dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId));
      dispatch(clientUserActions.fetchListIfNeeded('_firm', match.params.firmId));
      dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
      dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches clientUser/contacts
    } 
  }

  _setPerPage(per) {
    let newPagination = this.props.clientUserList.pagination;
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(clientUserActions.setPagination(newPagination, '_firm', match.params.firmId));
  }

  _handleFilter(sortBy) {
    const { dispatch, match, clientUserList } = this.props; 
    let newFilter = clientUserList.filter;
    if(clientUserList && clientUserList.filter && clientUserList.filter.sortBy && clientUserList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(clientUserActions.setFilter(newFilter, '_firm', match.params.firmId));
    dispatch(clientUserActions.setPagination({page: 1, per: 50}, '_firm', match.params.firmId));
  }

  _handleQuery(e) {
    const { dispatch, match } = this.props;
    // always defaulting the page to page 1 so we can see our results
    var pagination = {};
    pagination.page = 1;
    pagination.per = this.props.clientUserList.pagination.per;
    this._handleSetPagination(pagination);
    // continue query logic
    dispatch(clientUserActions.setQuery(e.target.value.toLowerCase(), '_firm', match.params.firmId));
    this.setState({queryText: e.target.value.toLowerCase()});
  }

  render() {
    const { 
      firmStore 
      , location
      , paginatedList
      , clientUserList 
    } = this.props;

    const selectedFirm = firmStore.selected.getItem();
    const filter = clientUserList && clientUserList.filter && clientUserList.filter.sortBy ? clientUserList.filter.sortBy : null

    const isEmpty = (
      !paginatedList
      || !clientUserList
      || !clientUserList.items
      || clientUserList.items.length === 0
      || !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
    );

    const isFetching = (
      !paginatedList
      || !clientUserList
      || clientUserList.isFetching
      || firmStore.selected.isFetching
    )
    
    return (
      <AdminClientLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> {selectedFirm.name} </h1>
            <div className="content-container">
              <div className="yt-row space-between">
                <p><strong>Client Contact list</strong></p>
              </div>
              <hr/>
              <div className="admin-table-wrapper">
                <div className="yt-toolbar">
                  <div className="yt-tools right">
                    <div className="search">
                      <SearchInput
                        name="query"
                        value={this.state.queryText}
                        change={this._handleQuery}
                        placeholder="Search..."
                        required={false}
                      />
                    </div>
                  </div>
                </div>
                <table className="yt-table striped">
                  <caption>
                    <PageTabber
                      totalItems={clientUserList.items.length}
                      totalPages={Math.ceil(clientUserList.items.length / clientUserList.pagination.per) || 1}
                      pagination={clientUserList.pagination}
                      setPagination={this._handleSetPagination}
                      setPerPage={this._setPerPage}
                      viewingAs="top"
                      itemName="contacts"
                    />
                  </caption>
                  <thead>
                    <tr>
                      <th className="-title sortable" onClick={() => this._handleFilter('contact')}>Name
                        {filter && filter == 'contact' ? 
                          <i className="fad fa-sort-down"></i>
                        : filter && filter == '-contact' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                          <i className="fad fa-sort"></i>
                        }
                      </th>
                      <th className="-title sortable" onClick={() => this._handleFilter('email')}>Email
                        {filter && filter == 'email' ? 
                          <i className="fad fa-sort-down"></i>
                        : filter && filter == '-email' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                          <i className="fad fa-sort"></i>
                        }
                      </th>
                      <th className="-title sortable" onClick={() => this._handleFilter('client')}>Client
                        {filter && filter == 'client' ? 
                          <i className="fad fa-sort-down"></i>
                        : filter && filter == '-client' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                          <i className="fad fa-sort"></i>
                        }
                      </th>
                      <th className="-title sortable" onClick={() => this._handleFilter('status')}>Status
                        {filter && filter == 'status' ? 
                          <i className="fad fa-sort-down"></i>
                        : filter && filter == '-status' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                          <i className="fad fa-sort"></i>
                        }
                      </th>
                      <th className="-title sortable" onClick={() => this._handleFilter('updated')}>Last Modified
                        {filter && filter == 'updated' ? 
                          <i className="fad fa-sort-down"></i>
                        : filter && filter == '-updated' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                          <i className="fad fa-sort"></i>
                        }
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map((contact, i) =>
                      <AdminClientContactListItem key={contact._id + '_' + i} contact={contact} />
                    )}
                  </tbody>
                </table>
                <PageTabber
                  totalItems={clientUserList.items.length}
                  totalPages={Math.ceil(clientUserList.items.length / clientUserList.pagination.per) || 1}
                  pagination={clientUserList.pagination}
                  setPagination={this._handleSetPagination}
                  setPerPage={this._setPerPage}
                  viewingAs="bottom"
                  itemName="contacts"
                />
              </div>
            </div>
          </div>
        }
      </AdminClientLayout>
    )
  }
}

AdminFirmContactList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const userListArgsObj = {_firm: props.match.params.firmId}

  const userListArgs = userListArgsObj ? routeUtils.listArgsFromObject(userListArgsObj) : null;
  const userListItems = userListArgs ? store.user.util.getList(...userListArgs) : null;

  const clientUserListItems = userListArgs ? store.clientUser.util.getList(...userListArgs) : null;
  const clientUserList = userListArgs ? store.clientUser.util.getListInfo(...userListArgs) : null;

  const clientListItems = userListArgs ? store.client.util.getList(...userListArgs) : null;

  let contactListItems = [];
  
  // Build the list of contact items. We're just adding the client name and clientUser status to the user list items.
  if(clientUserListItems && userListItems && clientListItems) {
    for(const clientUser of clientUserListItems) {
      let contactItem = store.user.byId[clientUser._user]
      let client = store.client.byId[clientUser._client]
      if(contactItem && client) {
        contactItem.clientName = client.name
        contactItem.status = clientUser.status
        contactListItems.push(contactItem);
      }
    }
  }

  const filter = clientUserList ? clientUserList.filter : null; 
  const sortBy = filter ? filter.sortBy : 'contact'; 

  let listItems = [];
  let paginatedList = [];
  let orderedList = []; 
  if(clientUserList) {
    const pagination = clientUserList.pagination && clientUserList.pagination.page && clientUserList.pagination.per ? clientUserList.pagination : {page: 1, per: 50};
    const query = clientUserList.query || '';

    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    listItems = contactListItems ? contactListItems.filter((contact) => {
      return filterUtils.filterClientContact(queryTestString, contact);
    }) : [];

    if(listItems) {
      // SORT THE LIST
      switch(sortBy) {
        case 'client':
          orderedList = _.orderBy(listItems, [item => item.clientName.toLowerCase()], ['asc']); 
          break;
        case '-client':
          orderedList = _.orderBy(listItems, [item => item.clientName.toLowerCase()], ['desc']);
          break; 
        case 'contact':
          orderedList = _.orderBy(listItems, [item => item.lastname.toLowerCase()], ['asc']);
          break; 
        case '-contact':
          orderedList = _.orderBy(listItems, [item => item.lastname.toLowerCase()], ['desc']); 
          break;
        case 'email':
          orderedList = _.orderBy(listItems, [item => item.username.toLowerCase()], ['asc']); 
          break;
        case '-email':
          orderedList = _.orderBy(listItems, [item => item.username.toLowerCase()], ['desc']);
          break;
        case 'status':
          orderedList = _.orderBy(listItems, [item => item.status.toLowerCase()], ['asc']); 
          break;
        case '-status':
          orderedList = _.orderBy(listItems, [item => item.status.toLowerCase()], ['desc']);
          break;
        case 'updated':
          orderedList = _.orderBy(listItems, [item => item.updated_at], ['asc']);
          break;
        case '-updated':
          orderedList = _.orderBy(listItems, [item => item.updated_at], ['desc']); 
          break;
        default:
          orderedList = _.orderBy(listItems, [item => item.lastname.toLowerCase()], ['asc']);
      }
    }

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);

  }
  return {
    clientUserList
    , firmStore: store.firm
    , loggedInUser: store.user.loggedIn.user
    , paginatedList
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminFirmContactList)
);
