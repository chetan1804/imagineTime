/**
 * view component for /firm/:firmId/workspaces
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';

// import third-party libraries
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import { permissions, routeUtils, filterUtils } from '../../../../global/utils';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';

// import resource components 
import WorkspaceListItem from '../components/WorkspaceListItem.js.jsx';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../clientActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as firmActions from '../../../firm/firmActions';

class WorkspaceList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      listArgsObj: {
        _firm: props.match.params.firmId
        , status: 'visible'
      }
      , page: 1
      , per: 50
      , queryText: ''
      , sortBy: 'name'
      , query: ''
      , clientIdsArgs: {
        _clientIds: null
      }
    };
    this._bind(
      '_handleFilter'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_handleQuery'
      , '_handleFetchList'
    );
  }

  componentDidMount() {
    const { dispatch, match, paginatedList, loggedInUser } = this.props;
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    this._handleFetchList();
  }

  componentWillUnmount() {
    const dispatch = this.props.dispatch;
    const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
    dispatch(clientActions.setQuery("", ...listArgsObj));
    this.setState({query: ""});
  }

  _handleFetchList() {
    const { dispatch, match, location } = this.props;
    const listArgsObj = _.cloneDeep(this.state.listArgsObj);
    const query = new URLSearchParams(location.search);
    const page = query.get('page')
    const perPage = query.get('per')

    dispatch(clientActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(listArgsObj))).then(json => {
      dispatch(clientActions.setFilter({query: '', sortBy: 'name'}, ...listArgsObj));
      if (page) {
        setTimeout(() => {
          this._handleSetPagination({page: page, per: perPage});
        }, 500)
      } else {
        this._handleSetPagination({page: 1, per: 50});
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { dispatch } = this.props;
    const paginatedList = _.cloneDeep(this.props.paginatedList);
  }

  _setPerPage(per) {
    let newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
    this.setState({per: newPagination.per});
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
    dispatch(clientActions.setPagination(newPagination, ...listArgsObj));
  }

  _handleFilter(sortBy) {
    const { utilClientStore, dispatch } = this.props; 
    const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
    let newFilter = utilClientStore.filter;
    if(utilClientStore.filter.sortBy && utilClientStore.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(clientActions.setFilter(newFilter, ...listArgsObj));
  }

  _handleQuery(e) {
    const { dispatch } = this.props;
    const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
    dispatch(clientActions.setQuery(e.target.value.toLowerCase(), ...listArgsObj));
    this.setState({query: e.target.value.toLowerCase()});
  }

  render() {
    const { 
      location
      , staffStore
      , loggedInUser
      , match
      , clientStore
      , phoneNumberStore
      , addressStore
      , userStore
      , utilClientStore
      , clientListItems
      , paginatedList
      , sortBy
    } = this.props;
    
    const {
      listArgsObj
    } = this.state;
  
    const ownerPermissions = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);
    const isEmpty = (
      staffStore.selected.didInvalidate
      || clientStore.selected.didInvalidate
      || !utilClientStore
      || utilClientStore.didInvalidate
      || utilClientStore.isFetching
      || !paginatedList
      || !clientListItems
    );

    const isFetching = (
      staffStore.selected.isFetching
      || clientStore.selected.isFetching
      || !utilClientStore
      || utilClientStore.isFetching
      || !paginatedList
      || !clientListItems
    );

    return  (
      <PracticeLayout >
        <Helmet>
          <title>Client Workspaces</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>{ ownerPermissions ? 'All ' : 'My '} Client Workspaces</h1>
        </div>
        <div className="-practice-content">
          { isEmpty ?
            (isFetching ? 
              <div className="-loading-hero">
                <div className="u-centerText">
                  <div className="loading"></div>
                </div>
              </div> 
              : 
              <div className="hero -empty-hero">
                <div className="u-centerText">
                  <h2>No workspaces yet</h2>
                </div>
              </div>
            )
            :
            <div className="yt-container fluid" style={{ opacity: isFetching ? 0.5 : 1 }}>
              
              <div className="table-wrapper -practice-table-wrapper">
                <table className="yt-table  truncate-cells">
                  <caption>
                    <PageTabber
                      totalItems={utilClientStore.items.length}
                      totalPages={Math.ceil(utilClientStore.items.length / utilClientStore.pagination.per)}
                      pagination={utilClientStore.pagination}
                      setPagination={this._handleSetPagination}
                      setPerPage={this._setPerPage}
                      viewingAs="top"
                      itemName="workspaces"
                      handleQuery={this._handleQuery}
                      query={this.state.query}
                      searchText="Search client name..."
                      firmId={match.params.firmId}
                      isChanged={true}
                      enableSearch={true}
                    />
                  </caption>
                  <thead>
                    <tr>
                      <th className="_30">Client Id</th>
                      <th className="_40 -title sortable" onClick={() => this._handleFilter('name')}>Client Name
                        { sortBy && sortBy == 'name' ? 
                          <i className="fad fa-sort-down"></i>
                        : sortBy && sortBy == '-name' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                        <i className="fad fa-sort"></i>
                        }
                      </th>
                      <th className="_30">Primary Contact</th>
                      <th className="_30">Email</th>
                      <th className="_30">Phone Number</th>
                      <th className="_30">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="-table-header-mobile-layout" style={{ display: "none" }}>
                      <th className="_40 -title sortable" onClick={() => this._handleFilter('name')}>Client Name
                        { sortBy && sortBy == 'name' ? 
                          <i className="fad fa-sort-down"></i>
                        : sortBy && sortBy == '-name' ?
                          <i className="fad fa-sort-up"></i>
                        : 
                        <i className="fad fa-sort"></i>
                        }
                      </th>
                      <th className="_30">Primary Contact</th>
                      <th className="_30">Email</th>
                      <th className="_30">Phone Number</th>
                      <th className="_30">Address</th>
                    </tr>
                    { paginatedList.map((client, i) => 
                      <WorkspaceListItem
                        key={'client_' + client._id + '_' + i}
                        client={client}
                        phoneNumber={client.phonenumber}
                        address={client.objaddress}
                        primaryContact={userStore.byId[client._primaryContact]}
                      />
                    )}
                  </tbody>
                </table>
              </div>
              <PageTabber
                totalItems={utilClientStore.items.length}
                totalPages={Math.ceil(utilClientStore.items.length / utilClientStore.pagination.per)}
                pagination={utilClientStore.pagination}
                setPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                viewingAs="bottom"
                itemName="workspaces"
                handleQuery={this._handleQuery}
                query={this.state.query}
                searchText="Search client name..."
                firmId={match.params.firmId}
                isChanged={true}
              />
            </div>
          }
        </div>
      </PracticeLayout>
    )
  }
}


WorkspaceList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const clientStore = store.client;
  const listArgsObj = routeUtils.listArgsFromObject({
    _firm: props.match.params.firmId
    , status: 'visible'
  });

  const utilClientStore = clientStore.util.getSelectedStore(...listArgsObj);
  let clientListItems = clientStore.util.getList(...listArgsObj);
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  if(clientListItems) {   
    const pagination = utilClientStore.pagination || {page: 1, per: 50};
    const query = utilClientStore.query || '';
    sortBy = utilClientStore.filter ? utilClientStore.filter.sortBy : 'name'; 

    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    if (queryTestString) {
      clientListItems = clientListItems.filter(client => client.status === "visible" && filterUtils.filterClient(queryTestString, client));
    }

    // SORT THE LIST
    switch(sortBy) {
        case 'name':
            orderedList = _.orderBy(clientListItems, [item => item.name.toLowerCase()], ['asc']);
            break; 
        case '-name':
            orderedList = _.orderBy(clientListItems, [item => item.name.toLowerCase()], ['desc']); 
            break;
        case 'email':
            orderedList = _.orderBy(clientListItems, [item => item.username.toLowerCase()], ['asc']); 
            break;
        case '-email':
            orderedList = _.orderBy(clientListItems, [item => item.username.toLowerCase()], ['desc']);
            break; 
        default: 
            orderedList = _.orderBy(clientListItems, [item => item.name.toLowerCase()], ['asc']);
    }

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);
  }
  
  return {
    loggedInUser: store.user.loggedIn.user
    , staffStore: store.staff
    , clientStore: store.client
    , phoneNumberStore: store.phoneNumber
    , addressStore: store.address
    , userStore: store.user
    , utilClientStore
    , clientListItems
    , paginatedList
    , sortBy
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(WorkspaceList)
);
