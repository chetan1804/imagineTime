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
import FilterBy from '../../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';

// import utilities
import { filterUtils, permissions, routeUtils } from '../../../../global/utils';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';

// import resource components 
import WorkspacesGeneralListItem from '../components/WorkspacesGeneralListItem.js.jsx';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions'; 
import * as userActions from '../../../user/userActions';
import * as fileActions from '../../fileActions';


class WorkspacesGeneral extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientListArgsObj: {
        '_firm': props.match.params.firmId
      }
      , page: 1
      , per: 50
      , queryText: ''
      , sortBy: 'name'
      , listArgsObj: {
        _firm: props.match.params.firmId
        , status: 'visible'
      }
      , fileListArgsObj: {
        '~firm': props.match.params.firmId
        , _client: 'null'
        , status: 'not-archived'
      }
      , clientIdsArgs: {
        _clientIds: null
      }
    };
    this._bind(
      '_handleFilter'
      , '_handleSetPagination'
      , '_setPerPage'
    );
  }

  componentDidMount() {
    const { dispatch, match, paginatedList, loggedInUser } = this.props;
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff

    // files
    // const fileListArgsObj = _.cloneDeep(this.state.fileListArgsObj);
    // dispatch(fileActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(fileListArgsObj)));
    this._handleFetchList();
    if (paginatedList && paginatedList.length) {
      const clientIdsArgs = _.cloneDeep(this.state.clientIdsArgs);
      const clientIds = paginatedList.flatMap(item => isNaN(item._id) ? [] : [item._id]);
      const joinClientIds = clientIds.sort().join('');
      if (clientIdsArgs && clientIdsArgs._clientIds !== joinClientIds) {
        const totalPublicAndPersonal = {};
        if (clientIdsArgs && clientIdsArgs._clientIds) {
          const totalByClientIds = fileStore.util.getTotalByClientIds(...routeUtils.listArgsFromObject(clientIdsArgs));
          if (totalByClientIds && totalByClientIds['public']) {
            totalPublicAndPersonal['public'] = totalByClientIds['public'];
          }
          if (totalByClientIds && totalByClientIds['personal']) {
            totalPublicAndPersonal['personal'] = totalByClientIds['personal'];
          }
        }
        clientIdsArgs._clientIds = joinClientIds;
        this.setState({ clientIdsArgs }, () => {
          dispatch(fileActions.fetchTotalByClientIdsIfNeeded(routeUtils.listArgsFromObject(clientIdsArgs), clientIds, match.params.firmId, totalPublicAndPersonal));
        });
      }
    }
  }
  
  _handleFetchList() {
    const { dispatch, match, location } = this.props;
    const listArgsObj = _.cloneDeep(this.state.listArgsObj);
    const query = new URLSearchParams(location.search);
    const page = query.get('page')
    const perPage = query.get('per')
    dispatch(clientActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(listArgsObj))).then(json => {
      dispatch(clientActions.setFilter({query: '', sortBy: 'name'}, ...listArgsObj));
      dispatch(staffActions.setFilter({query: '', sortBy: 'name'}, ...routeUtils.listArgsFromObject({ _firm: match.params.firmId })));
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
    const { dispatch, match, fileStore } = this.props;
    const paginatedList = _.cloneDeep(this.props.paginatedList);
    const clientIdsArgs = _.cloneDeep(this.state.clientIdsArgs);
    // const fileListArgsObj = _.cloneDeep(this.state.fileListArgsObj);
    if (prevProps.paginatedList && paginatedList && !_.isEqual(prevProps.paginatedList, paginatedList) && !match.params.personal) {
      console.log("prevState", prevState)
      const clientIds = paginatedList.flatMap(item => isNaN(item._id) ? [] : [item._id]);
      const joinClientIds = clientIds.sort().join('');
      if (clientIdsArgs && clientIdsArgs._clientIds !== joinClientIds) {

        const totalPublicAndPersonal = {};
        if (prevState && prevState.clientIdsArgs && prevState.clientIdsArgs._clientIds) {
          const totalByClientIds = fileStore.util.getTotalByClientIds(...routeUtils.listArgsFromObject(prevState.clientIdsArgs));
          if (totalByClientIds && totalByClientIds['public']) {
            totalPublicAndPersonal['public'] = totalByClientIds['public'];
          }
          if (totalByClientIds && totalByClientIds['personal']) {
            totalPublicAndPersonal['personal'] = totalByClientIds['personal'];
          }
        }

        clientIdsArgs._clientIds = joinClientIds;
        this.setState({ clientIdsArgs }, () => {
          dispatch(fileActions.fetchTotalByClientIdsIfNeeded(routeUtils.listArgsFromObject(clientIdsArgs), clientIds, match.params.firmId, totalPublicAndPersonal ));
        });
      }
    } else {
      if (clientIdsArgs && !clientIdsArgs._clientIds) {
        clientIdsArgs._clientIds = 'totalPublicAndPersonalOnly';
        this.setState({ clientIdsArgs }, () => {
          dispatch(fileActions.fetchTotalByClientIdsIfNeeded(routeUtils.listArgsFromObject(clientIdsArgs), [], match.params.firmId, {} ));
        });
      }
    }

    if ((!prevProps.match.params.personal && match.params.personal) || (prevProps.match.params.personal && !match.params.personal)) {
      this._handleSetPagination({page: 1, per: 50});
    }
  }

  _setPerPage(per) {
    let newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination);
    this.setState({per: newPagination.per});
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
    if (match.params.personal && match.params.personal === "personal") {
      dispatch(staffActions.setPagination(newPagination, ...routeUtils.listArgsFromObject({ _firm: match.params.firmId })));
    } else {
      dispatch(clientActions.setPagination(newPagination, ...listArgsObj));
    }
  }

  _handleFilter(sortBy) {
    const { utilStore, dispatch, match } = this.props; 
    const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
    let newFilter = utilStore.filter;
    if(utilStore.filter.sortBy && utilStore.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;

    if (match.params.personal && match.params.personal === "personal") {
      dispatch(staffActions.setFilter(newFilter, ...routeUtils.listArgsFromObject({ _firm: match.params.firmId })))
    } else {
      dispatch(clientActions.setFilter(newFilter, ...listArgsObj));
    }
  }

  render() {
    const {
      location
      , match
      , clientStore
      , staffStore
      , loggedInUser
      , utilStore
      , paginatedList
      , sortBy
      , staffListItems
      , ownerPermissions
      , utilClientStore
      , fileStore
    } = this.props;

    const fileListArgsObj = _.cloneDeep(this.state.fileListArgsObj);
    const clientIdsArgs = _.cloneDeep(this.state.clientIdsArgs);
    const totalByClientIds = fileStore.util.getTotalByClientIds(...routeUtils.listArgsFromObject(clientIdsArgs));
    console.log("totalByClientIds", totalByClientIds)

    const isEmpty = (
      staffStore.selected.didInvalidate
      || clientStore.selected.didInvalidate
      || !utilStore
      || !utilStore.items
      || utilStore.didInvalidate
      || utilStore.isFetching
      || !paginatedList
      || !staffListItems
      || utilClientStore.didInvalidate
      || utilClientStore.isFetching
    );

    const isFetching = (
      staffStore.selected.isFetching
      || clientStore.selected.isFetching
      || !utilStore
      || !utilStore.items
      || utilStore.isFetching
      || !paginatedList
      || !staffListItems
      || utilClientStore.isFetching
    );

    if (paginatedList && !match.params.personal && !paginatedList.some(item => item._id === "public" || item._id === "personal")) {
      paginatedList.unshift({
        _id: "public"
        , name: "General Files"
        , created_at: "None"
        , _firm: match.params.firmId
      });
      if (paginatedList && ownerPermissions) {
        paginatedList.splice(1, 0, {
          _id: "personal"
          , name: "Staff Files"
          , _firm: match.params.firmId
          , root: true
        });
      } else if (!ownerPermissions && paginatedList && loggedInUser) {
        paginatedList.splice(1, 0, {
          _id: "personal"
          , name: "Your Staff Files"
          , _firm: match.params.firmId
          , _user: loggedInUser._id
          , root: false
        });
      }
    }

    return  (
      <PracticeLayout >
        <Helmet>
          <title>All Files</title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>{ ownerPermissions ? 'All ' : 'My '} Folders</h1>
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
                <div className="yt-table table firm-table -workspace-table truncate-cells -yt-edit-table">
                    <div className="table-caption">
                        <PageTabber
                          totalItems={utilStore.items.length}
                          totalPages={Math.ceil(utilStore.items.length / utilStore.pagination.per)}
                          pagination={utilStore.pagination}
                          setPagination={this._handleSetPagination}
                          setPerPage={this._setPerPage}
                          viewingAs="top"
                          itemName="folders"
                          searchText="Search..."
                          firmId={match.params.firmId}
                          isChanged={true}
                        />
                    </div>
                    <div className="-table-horizontal-scrolling">
                      <div className="table-head" >
                        <div className="table-cell -title sortable _50" onClick={() => this._handleFilter('name')}>Name
                          { sortBy && sortBy == 'name' ? 
                            <i className="fad fa-sort-down"></i>
                          : sortBy && sortBy == '-name' ?
                            <i className="fad fa-sort-up"></i>
                          : 
                          <i className="fad fa-sort"></i>
                          }
                        </div>
                        <div className="table-cell _40">Folders</div>
                        <div className="table-cell _40">Files</div>
                      </div>
                      { paginatedList && paginatedList.length ?
                          paginatedList.map((item, i) => 
                            <WorkspacesGeneralListItem
                              key={i}
                              item={item}
                              totalByClientIds={totalByClientIds && totalByClientIds[item._id] ? totalByClientIds[item._id] : null}
                            />
                          ) : 
                          <div className="table-head empty-state">
                              <div className="table-cell" colSpan="5">
                                  <em>No files</em>
                              </div>
                          </div>
                      }
                    </div>
                </div>
                <PageTabber
                  totalItems={utilStore.items.length}
                  totalPages={Math.ceil(utilStore.items.length / utilStore.pagination.per)}
                  pagination={utilStore.pagination}
                  setPagination={this._handleSetPagination}
                  setPerPage={this._setPerPage}
                  viewingAs="bottom"
                  itemName="folders"
                  searchText="Search..."
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


WorkspacesGeneral.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const clientStore = store.client;
  const listArgsObj = routeUtils.listArgsFromObject({
    _firm: props.match.params.firmId
    , status: 'visible'
  });
  
  const firmId = props.match.params.firmId;
  const personal = props.match.params.personal;
  const loggedInUser = store.user.loggedIn.user;
  const userMap = store.user.byId;
  const staffStore = store.staff;
  const ownerPermissions = permissions.isStaffOwner(store.staff, loggedInUser, firmId);
  const staffListItems = staffStore.util.getList('_firm', firmId);
  const utilClientStore = clientStore.util.getSelectedStore(...listArgsObj);

  let utilStore = _.cloneDeep(utilClientStore);
  let listItems = [];
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  if (personal  && personal === "personal") {
    if (ownerPermissions && staffListItems && userMap) {
      utilStore = staffStore.util.getSelectedStore('_firm', firmId);
      const pagination = utilStore.pagination || {page: 1, per: 50};
      const query = utilStore.query || '';
      sortBy = utilStore.filter ? utilStore.filter.sortBy : 'name'; 
      staffListItems.map((staff) => {
        if (userMap[staff._user]) {
          const displayName = `${userMap[staff._user].firstname}${userMap[staff._user].firstname ? " " : ""}${userMap[staff._user].lastname}` || `${userMap[staff._user].username}`;
          listItems.unshift({
            _id: personal
            , name: displayName
            , _firm: firmId
            , _user: staff._user
            , root: false
          });
        }
        return staff
      });
      // SORT THE LIST
      switch(sortBy) {
        case 'name':
            orderedList = _.orderBy(listItems, [item => item.name.toLowerCase()], ['asc']);
            break; 
        case '-name':
            orderedList = _.orderBy(listItems, [item => item.name.toLowerCase()], ['desc']); 
            break;
        default: 
            orderedList = _.orderBy(listItems, [item => item.name.toLowerCase()], ['asc']);
      }
      const start = (pagination.page - 1) * pagination.per;
      const end = start + pagination.per;
      paginatedList = _.slice(orderedList, start, end); 
    }
  } else {
    listItems = clientStore.util.getList(...listArgsObj);
    utilStore = _.cloneDeep(utilClientStore);
    if(listItems) {   
      const pagination = utilStore.pagination || {page: 1, per: 50};
      const query = utilStore.query || '';
      sortBy = utilStore.filter ? utilStore.filter.sortBy : 'name'; 
  
      // FILTER BY QUERY
      let queryTestString = ("" + query).toLowerCase().trim();
      queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
      if (queryTestString) {
        listItems = listItems.filter(client => client.status === "visible" && filterUtils.filterClient(queryTestString, client));
      }
  
      // SORT THE LIST
      switch(sortBy) {
          case 'name':
              orderedList = _.orderBy(listItems, [item => item.name.toLowerCase()], ['asc']);
              break; 
          case '-name':
              orderedList = _.orderBy(listItems, [item => item.name.toLowerCase()], ['desc']); 
              break;
          case 'email':
              orderedList = _.orderBy(listItems, [item => item.username.toLowerCase()], ['asc']); 
              break;
          case '-email':
              orderedList = _.orderBy(listItems, [item => item.username.toLowerCase()], ['desc']);
              break; 
          default: 
              orderedList = _.orderBy(listItems, [item => item.name.toLowerCase()], ['asc']);
      }
  
      // APPLY PAGINATION
      const start = (pagination.page - 1) * pagination.per;
      const end = start + pagination.per;
      paginatedList = _.slice(orderedList, start, end);
    }
  }

  return {
    loggedInUser
    , clientStore: store.client
    , utilStore
    , paginatedList
    , sortBy
    , staffListItems
    , ownerPermissions
    , staffStore
    , utilClientStore
    , fileStore: store.file
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(WorkspacesGeneral)
);
