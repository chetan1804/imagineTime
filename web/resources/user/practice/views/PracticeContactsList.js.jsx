/**
 * View for route /firm/:firmId/contacts
 *
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import third-party libraries
import { DateTime } from 'luxon';
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms';

// import utilities
import { filterUtils, permissions, routeUtils } from '../../../../global/utils';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';

// import resource components 
import PracticeContactListItem from '../components/PracticeContactListItem.js.jsx';
import ContactQuickView from './ContactQuickView.js.jsx';

// import actions
import * as addressActions from '../../../address/addressActions'; 
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../userActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions'; 
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as clientActions from '../../../client/clientActions';

class PracticeContactsList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      page: 1
      , per: 50
      , queryText: ''
      , sortBy: 'name'
      , listArgsObj: {}
      , query: ''
      , selectedUserIds: []
      , submitResendInvite: false
    };
    this._bind(
      '_handleSetPagination'
      , '_setPerPage'
      , '_handleFilter'
      , '_handleQuery'
      , '_handleSelectUser'
      , '_handleToggleSelectAll'
      , '_clearSelectedUserIds'
      , '_handleBulkResendInvite'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match, staffStore, location } = this.props;
    const query = new URLSearchParams(location.search);
    const page = query.get('page')
    const perPage = query.get('per') 
    // get stuff for global nav 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 

    if (loggedInUser.admin) {
      dispatch(phoneNumberActions.fetchListIfNeeded('_firm', match.params.firmId)); 
      dispatch(addressActions.fetchListIfNeeded('_firm', match.params.firmId));
      dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId));
      dispatch(userActions.setFilter({query: '', sortBy: 'contact'}, '_firm', match.params.firmId));
      dispatch(userActions.setPagination({page: 1, per: 50}, '_firm', match.params.firmId));
    } else {
      dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId)).then(staffRes => {
        if(staffRes.success) {
          this.setState({ listArgsObj: { _staff: staffRes.item._id } });
          dispatch(phoneNumberActions.fetchListIfNeeded('_staff', staffRes.item._id)); 
          dispatch(addressActions.fetchListIfNeeded('_staff', staffRes.item._id));
          dispatch(userActions.fetchListIfNeeded('_staff', staffRes.item._id));
          dispatch(userActions.setFilter({query: '', sortBy: 'contact'}, "_staff", staffRes.item._id));
          dispatch(userActions.setPagination({page: 1, per: 50}, '_staff', staffRes.item._id));
        }
      })
    }

    // get stuff for this view 
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId))
    // dispatch(staffClientActions.fetchListIfNeeded('_firm', match.params.firmId, '_user', loggedInUser._id));

    // dispatch(userActions.setQuery('', '_firm', match.params.firmId));
    // dispatch(userActions.setFilter('', '_firm', match.params.firmId));
    if (page) {
      setTimeout(() => {
        this._handleSetPagination({page: page, per: perPage});
      }, 500)
    } else {
      this._handleSetPagination({page: 1, per: 50});
    }
  }

  _setPerPage(per) {
    const { dispatch } = this.props;    
    let newPagination = this.props.userList.pagination;
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(userActions.setPagination(newPagination));
  }

  _handleFilter(sortBy) {
    const { dispatch, match, userList } = this.props; 
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId)).then(staffRes => {
      let newFilter = userList.filter;
      if(userList && userList.filter && userList.filter.sortBy && userList.filter.sortBy.indexOf("-") < 0) {
        sortBy = "-" + sortBy;
      } else {
        sortBy = sortBy.substring(0)
      }
      newFilter.sortBy = sortBy;
      dispatch(userActions.setFilter(newFilter, "_staff", staffRes.item._id));
      dispatch(userActions.setPagination({page: 1, per: 50}, '_staff', staffRes.item._id));
    }); 
  }

  _handleQuery(e) {
    const { dispatch } = this.props;
    // always defaulting the page to page 1 so we can see our results
    // let pagination = {};
    // pagination.page = 1;
    // pagination.per = this.state.per;
    // this._handleSetPagination(pagination);
    // continue query logic
    dispatch(userActions.setQuery(e.target.value.toLowerCase(), ...routeUtils.listArgsFromObject(this.state.listArgsObj)));
    this.setState({query: e.target.value.toLowerCase()});
  }

  _handleSelectUser(userId) {
    let newUserIds = _.cloneDeep(this.state.selectedUserIds);
    if(newUserIds.indexOf(userId) === -1) {
      newUserIds.push(userId)
    } else {
      newUserIds.splice(newUserIds.indexOf(userId), 1);
    }
    this.setState({
      selectedUserIds: newUserIds
    });
  }

  _handleToggleSelectAll(paginatedList, allUserSelected) {
    const { selectedUserIds } = this.state; 
    if(selectedUserIds.length > 0 && allUserSelected) {
      this._clearSelectedUserIds(); 
    } else if(paginatedList) {
      let newSelectedUserIds = _.cloneDeep(selectedUserIds); 
      paginatedList.map(item => newSelectedUserIds.indexOf(item._id) < 0 ? newSelectedUserIds.push(item._id) : null);
      this.setState({ selectedUserIds: newSelectedUserIds }); 
    } else null; 
  }

  _clearSelectedUserIds() {
    this.setState({
      selectedUserIds: []
    })
  }

  _handleBulkResendInvite() {
    const { dispatch, match, userMap } = this.props;
    const { selectedUserIds } = this.state;
  
    this.setState({ submitResendInvite: true });

    const firmId = match.params.firmId;

    const getInvitation = (cb) => {
      if (selectedUserIds && selectedUserIds.length) {
        const result = selectedUserIds.map(val => userMap[val]);
        cb(result)
      } else {
        cb(false);
      }
    };

    getInvitation(invitations => {
      if (invitations) {
        const sendData = {
          invitations: invitations
          , firmId
        }
        dispatch(clientUserActions.sendResendInviteClientUsers(sendData)).then(clientUserRes => {
          if(clientUserRes.success) {
            this.setState({ submitResendInvite: false, selectedUserIds: [] });
          } else {
            this.setState({ submitResendInvite: false });
            alert("ERROR - Check logs");
          }
        });
      } else {
        this.setState({ submitResendInvite: false });
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { 
      location
      , loggedInUser
      , match
      , paginatedList
      , phoneNumberStore
      , addressStore
      , staffStore
      , userList
      , contacts
    } = this.props;

    const {
      selectedUserIds
      , submitResendInvite
    } = this.state;

    const isEmpty = (
      !paginatedList
      || !userList
    );

    const isFetching = (
      !paginatedList
      || !userList
      || userList.isFetching
    )

    const ownerPermissions = permissions.isStaffOwner(staffStore, loggedInUser, match.params.firmId);

    const filter = userList && userList.filter && userList.filter.sortBy; 

    const allUsersSelected = selectedUserIds.length ? paginatedList.every(item => selectedUserIds.includes(item._id)) : false;
    //paginatedList = paginatedList.sort((a,b) => a.firstName < b.firstName ? -1 : 1);
    return  (
      <PracticeLayout isSidebarOpen={true}>
        <Helmet>
          <title>Contact List </title>
        </Helmet>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>{ ownerPermissions ? 'All ' : 'My '} Client Contacts</h1>
        </div>
        <div className="-practice-content">
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div> 
            : 
            <div className="hero -empty-hero">
              <div className="u-centerText">
                <p>Looks like you don't have any contacts yet. </p>
                <p>Let's add some.</p>
              </div>
            </div>
          )
          :
          <div className="yt-container fluid" style={{ opacity: isFetching ? 0.5 : 1, height: '200vh' }}>
            <div className="yt-toolbar -mobile-yt-hide">
              <div className="yt-tools space-between">
                <div className="-filters -left"></div>
                <div className="-options -right">
                  <button 
                      style={{ marginLeft: '0px' }}
                      className="yt-btn x-small link info" 
                      disabled={!selectedUserIds.length || submitResendInvite}
                      onClick={this._handleBulkResendInvite}
                  >
                    Resend Invite
                    { selectedUserIds.length ? <span> — {selectedUserIds.length}</span> : null } 
                  </button>             
                </div>
              </div>
          </div>
          <hr className="-mobile-yt-hide" />
            <div className="table-wrapper -practice-table-wrapper" style={{ marginTop: 0 }}>
              <table className="yt-table user-table-list">
                <caption>
                  <PageTabber
                    totalItems={contacts.length}
                    totalPages={Math.ceil(contacts.length / userList.pagination.per)}
                    pagination={userList.pagination}
                    setPagination={this._handleSetPagination}
                    setPerPage={this._setPerPage}
                    viewingAs="top"
                    itemName="contacts"
                    handleQuery={this._handleQuery}
                    query={this.state.query}
                    firmId={match.params.firmId}
                  />
                </caption>
                <thead>
                  <tr>
                    <th>
                      <CheckboxInput
                        name="user"
                        value={allUsersSelected}
                        change={() => this._handleToggleSelectAll(paginatedList, allUsersSelected)}
                        checked={allUsersSelected}
                      />
                    </th>
                    <th className="-title sortable _40" onClick={() => this._handleFilter('contact')}>Contact
                      {filter && filter == 'contact' ? 
                        <i className="fad fa-sort-down"></i>
                      : filter && filter == '-contact' ?
                        <i className="fad fa-sort-up"></i>
                      : 
                        <i className="fad fa-sort"></i>
                      }
                    </th>
                    <th className="-title sortable _30" onClick={() => this._handleFilter('email')}>Email
                      {filter && filter == 'email' ? 
                        <i className="fad fa-sort-down"></i>
                      : filter && filter == '-email' ?
                        <i className="fad fa-sort-up"></i>
                      : 
                        <i className="fad fa-sort"></i>
                      }
                    </th>
                    <th className="_30">Phone</th>
                    <th className="_30">Address</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="-table-header-mobile-layout" style={{ display: "none" }}>
                    <th>
                      <CheckboxInput
                        name="user"
                        value={false}
                        change={() => console.log("hello world")}
                        checked={false}
                      />
                    </th>
                    <th className="-title sortable _40" onClick={() => this._handleFilter('contact')}>Contact
                      {filter && filter == 'contact' ? 
                        <i className="fad fa-sort-down"></i>
                      : filter && filter == '-contact' ?
                        <i className="fad fa-sort-up"></i>
                      : 
                        <i className="fad fa-sort"></i>
                      }
                    </th>
                    <th className="-title sortable _30" onClick={() => this._handleFilter('email')}>Email
                      {filter && filter == 'email' ? 
                        <i className="fad fa-sort-down"></i>
                      : filter && filter == '-email' ?
                        <i className="fad fa-sort-up"></i>
                      : 
                        <i className="fad fa-sort"></i>
                      }
                    </th>
                    <th className="_30">Phone</th>
                    <th className="_30">Address</th>
                  </tr>
                  {paginatedList.map((user, i) =>
                    <PracticeContactListItem 
                      key={user._id + '' + i} 
                      user={user}
                      phoneNumber={phoneNumberStore.byId[user._primaryPhone]}
                      address={addressStore.byId[user._primaryAddress]}
                      handleSelectUser={this._handleSelectUser}
                      checked={selectedUserIds.includes(user._id)}
                    />
                  )}
                </tbody>
              </table>
            </div>
            <PageTabber
              totalItems={contacts.length}
              totalPages={Math.ceil(contacts.length / userList.pagination.per)}
              pagination={userList.pagination}
              setPagination={this._handleSetPagination}
              setPerPage={this._setPerPage}
              viewingAs="bottom"
              itemName="contacts"
              handleQuery={this._handleQuery}
              query={this.state.query}
              firmId={match.params.firmId}
            />
            <TransitionGroup>
              <CSSTransition
                key={location.key}
                classNames="slide-from-right"
                timeout={300}
              >
                <Switch location={location}>
                  <YTRoute
                    breadcrumbs={[{display: 'Contacts', path: `/firm/${match.params.firmId}/contacts` }, {display: 'Details', path: null }]}
                    exact
                    path="/firm/:firmId/contacts/quick-view/:userId"
                    staff={true}
                    component={ContactQuickView}
                  />
                  <Route render={() => <div/>} />
                </Switch>
              </CSSTransition>
            </TransitionGroup>
            {/* <YTRoute path="/firm/:firmId/contacts/quick-view/:userId" login={true} render={() => <h3>modal</h3>}/> */}
          </div>
        }
        </div>
      </PracticeLayout>
    )
  }
}


PracticeContactsList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const loggedInUser = store.user.loggedIn.user;
  const userMap = store.user.byId;
  const loggedInStaff = store.staff.loggedInByFirm[props.match.params.firmId] ? store.staff.loggedInByFirm[props.match.params.firmId].staff : null;
  let userListArgsObj;

  if (loggedInUser && loggedInUser.admin) {
    userListArgsObj = {_firm: props.match.params.firmId}
  } else if (loggedInStaff) {
    userListArgsObj = {_staff: loggedInStaff._id}
  }

  const userListArgs = userListArgsObj ? routeUtils.listArgsFromObject(userListArgsObj) : null;
  const userListItems = userListArgs ? store.user.util.getList(...userListArgs) : null;
  const userList = userListItems ? userListArgs.reduce((obj, nextKey) => obj[nextKey], store.user.lists) : null;

  const filter = userList ? userList.filter : null; 
  const sortBy = filter ? filter.sortBy : 'contact'; 

  let listItems = [];
  let paginatedList = [];
  let filteredByQuery = [];
  let orderedList = []; 
  if (userList) {

    // const filter = userList.filter;
    const pagination = userList.pagination || {page: 1, per: 50};
    const query = userList.query || '';

    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    filteredByQuery = userList.items ? userList.items.filter((userId) => {
      return userMap[userId].username ? userMap[userId].username.match(/hideme.ricblyz/g) ? null : filterUtils.filterUser(queryTestString, userMap[userId]) : null;
    }) : [];
    
    // POPULATE THE LIST
    listItems = filteredByQuery.map((item) => {
      const newItem = userMap[item];
      return newItem;
    });
    
    if(listItems) {
      // SORT THE LIST
      switch(sortBy) {
        case 'contact':
          orderedList = _.orderBy(listItems, [item => item.firstname.toLowerCase()], ['asc']);
          break; 
        case '-contact':
          orderedList = _.orderBy(listItems, [item => item.firstname.toLowerCase()], ['desc']); 
          break;
        case 'email':
          orderedList = _.orderBy(listItems, [item => item.username.toLowerCase()], ['asc']); 
          break;
        case '-email':
          orderedList = _.orderBy(listItems, [item => item.username.toLowerCase()], ['desc']);
          break; 
        default: 
         orderedList = _.orderBy(listItems, [item => item.firstname.toLowerCase()], ['asc']);
      }
    }

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);      
  }
  return {
    userList
    , paginatedList
    , phoneNumberStore: store.phoneNumber
    , addressStore: store.address
    , loggedInUser
    , staffStore: store.staff
    , contacts: listItems
    , userMap: store.user.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeContactsList)
);
