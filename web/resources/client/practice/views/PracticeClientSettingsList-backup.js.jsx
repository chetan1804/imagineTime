/**
 * view component for /firm/:firmId/clients
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';

import { DateTime } from 'luxon';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import FilterBy from '../../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';

// import utilities
import filterUtils from '../../../../global/utils/filterUtils';

// import resource components 
import PracticeClientSettingsListItem from '../components/PracticeClientSettingsListItem.js.jsx';
import NewClientOptionsMenu from '../../components/NewClientOptionsMenu.js.jsx';
import CreateStaffClientModal from '../../../staffClient/components/CreateStaffClientModal.js.jsx';

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as staffClientActions from '../../../staffClient/staffClientActions'; 

class PracticeClientSettingsList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      clientOptionsOpen: false
      , page: 1
      , per: 50
      , queryText: ''
      , sortBy: 'name'
      , selectedClientId: []
      , isAddStaffModalOpen: false
      , newStaffClient: null
    };
    this._bind(
      '_handleSetPagination'
      , '_setPerPage'
      , '_handleFilter'
      , '_handleSelectedClient'
      , '_handleNewStaffClient'
    );
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props; 
    // get stuff for global nav ??
    dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));

    dispatch(staffClientActions.fetchListIfNeeded('_firm', match.params.firmId, '~staff.status', 'active'));

    // get stuff for this view 
    dispatch(clientActions.fetchListIfNeeded('_firm', match.params.firmId)).then(clientRes => {
      if(clientRes.success) {
        clientRes.list.forEach(client => {
          if(client._primaryAddress) {
            dispatch(addressActions.fetchSingleIfNeeded(client._primaryAddress));
          }
          if(client._primaryPhone) {
            dispatch(phoneNumberActions.fetchSingleIfNeeded(client._primaryPhone));
          }
        })
      }
    });
    this._handleSetPagination({page: 1, per: 50});
    dispatch(clientActions.setFilter({query: '', sortBy: 'name'}, '_firm', match.params.firmId));
    dispatch(clientUserActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
  }

  _setPerPage(per) {
    let newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;    
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  _handleSetPagination(newPagination) {
    const { dispatch, match } = this.props;
    dispatch(clientActions.setPagination(newPagination, '_firm', match.params.firmId));
  }

  _handleFilter(sortBy) {
    const { dispatch, match, clientList } = this.props; 
    let newFilter = clientList.filter;
    if(clientList && clientList.filter && clientList.filter.sortBy && clientList.filter.sortBy.indexOf("-") < 0) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0)
    }
    newFilter.sortBy = sortBy;
    dispatch(clientActions.setFilter(newFilter, '_firm', match.params.firmId));
  }

  _handleSelectedClient(clientId) {
    let newclientIds = _.cloneDeep(this.state.selectedClientId);
    if(newclientIds.indexOf(clientId) === -1) {
      newclientIds.push(clientId)
    } else {
      newclientIds.splice(newclientIds.indexOf(clientId), 1);
    }
    this.setState({
      selectedClientId: newclientIds
    });
  }

  _handleNewStaffClient(staffclient) {
    this.setState({ newStaffClient: staffclient });
  }

  componentDidUpdate(prevProps, prevState) {
    const { dispatch, match } = this.props;
    if (prevState.newStaffClient !== this.state.newStaffClient) {
      this.setState({ selectedClientId: [], isAddStaffModalOpen: false });
      dispatch(staffClientActions.fetchList('_firm', match.params.firmId, '~staff.status', 'active')).then(json => {
        this.setState({ newStaffClient: null });
      });
    }
  }

  componentWillUnmount() {
    this.setState({ newStaffClient: null });
  }

  render() {
    const { 
      addressStore
      , clientStore
      , clientUserStore
      , firmStore
      , location
      , loggedInUser
      , match
      , paginatedList
      , phoneNumberStore
      , staffClientStore
      , staffStore
      , userStore
    } = this.props;

    const { selectedClientId, isAddStaffModalOpen, newStaffClient } = this.state;

    const selectedFirm = firmStore.selected.getItem();

    const clientList = clientStore.lists && clientStore.lists._firm ? clientStore.lists._firm[match.params.firmId] : null;
    const clientListItems = clientStore.util.getList('_firm', match.params.firmId);

    const staffClientList = staffClientStore.util.getList('_firm', match.params.firmId, '~staff.status', 'active'); 

    const staffList = staffStore.lists && staffStore.lists._firm ? staffStore.lists._firm[match.params.firmId] : null;
    const staffListItems = staffStore.util.getList('_firm', match.params.firmId);

    // let staff = !staffListItems ? [] : staffListItems.map(s => {
    //   let item = s;
    //   item.displayName = 
    //     userStore.byId[s._user] 
    //     && userStore.byId[s._user].firstname 
    //     && userStore.byId[s._user].lastname 
    //     ? 
    //     userStore.byId[s._user].firstname + " " + userStore.byId[s._user].lastname 
    //     : userStore.byId[s._user] ? 
    //     userStore.byId[s._user].username 
    //     : 
    //     '';
    //   return item;
    // })

    const isEmpty = (
      !clientListItems
      || !clientList
      || !staffClientList
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
      || !staffList
      || !staffListItems
    );

    const isFetching = (
      !clientListItems
      || !clientList
      || clientList.isFetching
      || firmStore.selected.isFetching
      || !staffClientList
      || !staffList 
      || staffList.isFetching 
    )

    const filter = clientList && clientList.filter && clientList.filter.sortBy; 

    const availableStaff = !staffListItems ? [] : staffListItems.filter(staff => {
      if (staff.status === 'active') {
        let item = staff;
        let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
        let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
        item.displayName = `${fullName} | ${userName}`;
        return item;
      }
    });

    return  (
      <PracticeLayout isSidebarOpen={true}>
        <CloseWrapper
          isOpen={(this.state.clientOptionsOpen )}
          closeAction={() => this.setState({clientOptionsOpen: false})}
        />
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
              <button className="yt-btn x-small" onClick={() => this.setState({clientOptionsOpen: true})}>
                New Client
                <i style={{marginLeft: ".5em"}}className="fas fa-caret-down"/>
              </button>
            </div>
            <div className="dropdown">
              <NewClientOptionsMenu
                firmId={parseInt(match.params.firmId)}
                isOpen={this.state.clientOptionsOpen}
              />
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
          <h1>All Firm Clients</h1>
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
              <h2>No client found.</h2>
              )
              :
              <div className="yt-container fluid" style={{ opacity: isFetching ? 0.5 : 1, height: '200vh' }}>
              
              <CreateStaffClientModal
                close={() => this.setState({isAddStaffModalOpen:false})}
                handleNewStaffClient={this._handleNewStaffClient}
                isOpen={isAddStaffModalOpen}
                firmId={match.params.firmId}
                staffListItems={availableStaff}
                selectedClientId={selectedClientId}
                multipleAdd={true}
              />
              <div className="yt-toolbar">
                <div className="yt-tools space-between">
                  <div className="-filters -left"></div>
                  <div className="-options -right">
                    <button 
                      className="yt-btn x-small link info" 
                      disabled={!selectedClientId.length}
                      onClick={() => this.setState({isAddStaffModalOpen:true})}>
                      Assign Staff member 
                      { selectedClientId ? <span> — {selectedClientId.length}</span> : null } 
                    </button>
                  </div>
                </div>
              </div>
              <hr />
              <div className="table-wrapper -practice-table-wrapper">
                <table className="yt-table truncate-cells">
                  <caption>
                    { clientList.filter && clientList.filter.queryText && clientList.filter.queryText.length > 0 ?
                        <span>Filtered Clients &mdash; {clientList.items.length} of {clientList.pagination.total}</span>
                      :
                        <span>All Clients &mdash; {clientList ? clientList.items.length : 0}</span>
                    }
                    <div className="per-page-select u-pullRight">
                      <label>Show per page: </label>
                      <select
                        name="numPerPage"
                        onChange={(e) => this._setPerPage(e.target.value)}
                        value={this.state.per}
                      >
                        <option value={25}> 25 </option>
                        <option value={50}> 50 </option>
                        <option value={100}> 100 </option>
                      </select>
                    </div>
                    <PageTabber
                      totalItems={clientListItems.length}
                      totalPages={Math.ceil(clientListItems.length / clientList.pagination.per)}
                      pagination={clientList.pagination}
                      setPagination={this._handleSetPagination}
                      setPerPage={this._setPerPage}
                      viewingAs="top"
                      isFiltered={clientList.filter && clientList.filter.queryText && clientList.filter.queryText.length > 0}
                    />
                  </caption>
                  <thead>
                    <tr>
                      <th></th>
                      <th className="-title sortable" onClick={() => this._handleFilter('name')}>Client Name
                        {filter && filter == 'name' ? 
                          <i class="fas fa-sort-down"></i>
                        : filter && filter == '-name' ?
                          <i class="fas fa-sort-up"></i>
                        : null
                        }
                      </th>
                      <th>Assigned Staff</th>
                      <th>Primary Contact</th>
                      <th>Email</th>
                      <th>Phone Number</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                  {paginatedList.map((client, i) => {
                    return (
                      <PracticeClientSettingsListItem 
                        address={addressStore.byId[client._primaryAddress]}
                        key={'client_' + client._id  + '_' + i}
                        client={client}
                        phoneNumber={phoneNumberStore.byId[client._primaryPhone]}
                        primaryContact={client._primaryContact ? userStore.byId[client._primaryContact] : null}
                        staffClientList={staffClientList}
                        staffListItems={staffListItems}
                        handleSelectedClient={this._handleSelectedClient}
                        checked={selectedClientId.includes(client._id)}
                        newStaffClient={newStaffClient}
                      />
                    )
                  })
                  }
                  </tbody>
                </table>
              </div>
              <PageTabber
                totalItems={clientListItems.length}
                totalPages={Math.ceil(clientListItems.length / clientList.pagination.per)}
                pagination={clientList.pagination}
                setPagination={this._handleSetPagination}
                setPerPage={this._setPerPage}
                viewingAs="bottom"
              />
            </div>
          }
        </div>
      </PracticeLayout>
    )
  }
}


PracticeClientSettingsList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const firmId = props.match.params.firmId;

  const clientMap = store.client.byId;
  const clientList = store.client.lists && store.client.lists._firm ? store.client.lists._firm[firmId] : null;

  let listItems = [];
  let paginatedList = [];
  let filteredByQuery = [];
  let orderedList = []; 

  const filter = clientList ? clientList.filter : null; 
  const sortBy = filter ? filter.sortBy : 'name'; 

  if(clientList) {
    const filter = clientList.filter;
    const pagination = clientList.pagination || {page: 1, per: 50};
    const query = clientList.query || '';
    
    // FILTER BY QUERY
    let queryTestString = ("" + query).toLowerCase().trim();
    queryTestString = queryTestString.replace(/[^a-zA-Z0-9]/g,''); // replace all non-characters and numbers
    filteredByQuery = clientList && clientList.items ? clientList.items.filter((clientId) => {
      return filterUtils.filterClient(queryTestString, clientMap[clientId]);
    }) : [];


    // POPULATE THE LIST
    listItems = filteredByQuery.map((item) => {
      const newItem = clientMap[item];
      return newItem;
    });

    if(listItems) {
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
    }

    // APPLY PAGINATION    
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end); 
  }
  

  return {
    addressStore: store.address
    , clientStore: store.client 
    , clientUserStore: store.clientUser 
    , clientList: clientList
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , paginatedList: paginatedList
    , phoneNumberStore: store.phoneNumber
    , staffClientStore: store.staffClient
    , staffStore: store.staff
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeClientSettingsList)
);