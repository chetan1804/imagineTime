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
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms/';

// import utilities
import { permissions, filterUtils, routeUtils, displayUtils } from '../../../../global/utils';

// import components 
import PracticeClientSettingsListItem from '../components/PracticeClientSettingsListItem.js.jsx';
import NewClientOptionsMenu from '../../components/NewClientOptionsMenu.js.jsx';
import CreateStaffClientModal from '../../../staffClient/components/CreateStaffClientModal.js.jsx';
import SingleClientOptions from '../components/SingleClientOptions.js.jsx'; 

// import actions
import * as addressActions from '../../../address/addressActions';
import * as clientActions from '../../clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as firmActions from '../../../firm/firmActions';
import * as phoneNumberActions from '../../../phoneNumber/phoneNumberActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import client from '../../clientReducers.js';

class PracticeClientSettingsListAchive extends Binder {
    constructor(props) {
        super(props);
        this.state = {
          listArgsObj: {
            _firm: props.match.params.firmId
            , status: 'archived'
          }
          , clientOptionsOpen: false
          // , pagination: {
              ,page: 1
              , per: 50
          // }
          , queryText: ''
          , sortBy: 'name'
          , selectedClientId: []
          , newStaffClient: null
          , viewToggleDropDown: false
          , checked: false
          , archiveProcess: false
          , showAlertModal: false
          , existingClients: []
          , reinstateWarning: false
          , showMobileActionOption: false
          , clientIdsArgs: {
            _clientIds: null
          }
        };
        this._bind(
            '_handleSetPagination'
            , '_setPerPage'
            , '_handleFilter'
            , '_handleSelectedClient'
            , '_handleNewStaffClient'
            , '_handleCloseViewArchive'
            , '_handleSelectedAllClient'
            , '_handleBulkAction'
            , '_toggleAlertModal'
            , '_toggleWarningModal'
            , '_handleCloseMobileOption'
            , '_handleFetchList'
        );
    }

    componentDidMount() {
      const { dispatch, match, paginatedList, loggedInUser } = this.props;
      dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
      dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
      dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
      dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
      dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
      dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
      this._handleFetchList();

      if (paginatedList && paginatedList.length) {
        const clientIdsArgs = _.cloneDeep(this.state.clientIdsArgs);
        const clientIds = paginatedList.map(client => client._id);
        const joinClientIds = clientIds.sort().join('');
        if (clientIdsArgs && clientIdsArgs._clientIds !== joinClientIds) {
          const clientIdsArgs = _.cloneDeep(this.state.clientIdsArgs);
          const clientIds = paginatedList.map(client => client._id);
          const joinClientIds = clientIds.sort().join('');
          if (clientIdsArgs && clientIdsArgs._clientIds !== joinClientIds) {
            clientIdsArgs._clientIds = joinClientIds;
            const clientIdsArgsObj = routeUtils.listArgsFromObject(clientIdsArgs)
            this.setState({ clientIdsArgs }, () => {
              dispatch(staffClientActions.fetchListByClientIdsIfNeeded(clientIdsArgsObj, clientIds));
              dispatch(addressActions.fetchListByClientIdsIfNeeded(clientIdsArgsObj, clientIds));
              dispatch(phoneNumberActions.fetchListByClientIdsIfNeeded(clientIdsArgsObj, clientIds));
            });
          }
        }
      }
    }

    _handleFetchList() {
      const { dispatch, location } = this.props;
      const query = new URLSearchParams(location.search);
      const page = query.get('page')
      const perPage = query.get('per')
      const listArgsObj = _.cloneDeep(this.state.listArgsObj);
      dispatch(clientActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(listArgsObj))).then(json => {
        dispatch(clientActions.setFilter({query: '', sortBy: 'name'}, ...listArgsObj));
        // this._handleSetPagination({page: 1, per: 50});
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
      if (prevProps.paginatedList && paginatedList && !_.isEqual(prevProps.paginatedList, paginatedList)) {
        const clientIdsArgs = _.cloneDeep(this.state.clientIdsArgs);
        const clientIds = paginatedList.map(client => client._id);
        const joinClientIds = clientIds.sort().join('');
        if (clientIdsArgs && clientIdsArgs._clientIds !== joinClientIds) {
          clientIdsArgs._clientIds = joinClientIds;
          const clientIdsArgsObj = routeUtils.listArgsFromObject(clientIdsArgs)
          this.setState({ clientIdsArgs }, () => {
            dispatch(staffClientActions.fetchListByClientIdsIfNeeded(clientIdsArgsObj, clientIds));
            dispatch(addressActions.fetchListByClientIdsIfNeeded(clientIdsArgsObj, clientIds));
            dispatch(phoneNumberActions.fetchListByClientIdsIfNeeded(clientIdsArgsObj, clientIds));
          });
        }
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

    _handleSelectedClient(clientId) {
      const paginatedList = _.cloneDeep(this.props.paginatedList);
      let newclientIds = _.cloneDeep(this.state.selectedClientId);
      let checked = false;
      if(newclientIds.indexOf(clientId) === -1) {
          newclientIds.push(clientId);
          checked = paginatedList.length === newclientIds.length;
      } else {
          newclientIds.splice(newclientIds.indexOf(clientId), 1);
      }      
      this.setState({
          selectedClientId: newclientIds
          , checked   
      });
    }

    _handleNewStaffClient(staffclient) {
      this.setState({ newStaffClient: staffclient });
    }

    _handleCloseViewArchive(e) {
        e.stopPropagation();
        this.setState({ viewToggleDropDown: false });    
    }

    _handleSelectedAllClient() {
      const paginatedList = _.cloneDeep(this.props.paginatedList);
      if (!this.state.checked) {
        const clientIds = paginatedList.map(client => client._id);
        this.setState({ selectedClientId: clientIds, checked: true });
      } else {
        this.setState({ selectedClientId: [], checked: false });
      }
    } 

    _handleBulkAction(action) {
      const { dispatch, match, clientStore } = this.props;
      const { selectedClientId } = this.state;
      let sendData = { type: action, clientIds: selectedClientId }

      if (action === "visible") {
        let newSelectedClientId = [];
        let existingClients = [];
        let clients = clientStore ? clientStore.byId ? Object.keys(clientStore.byId) : [] : [];
        clients = clients.map(clientId => clientStore.byId[clientId]);

        selectedClientId.map(id => {
          if (clientStore && clientStore.byId) {
            let selectedClient = clientStore.byId[id].name;
            const tmp = clients.filter(client => client.name === selectedClient && client.status === "visible");
            if (tmp && tmp.length) {
              existingClients.push(tmp[0]);
            } else {
              newSelectedClientId.push(id);
            }
          }
        });

        if (existingClients.length) {
          this.setState({ selectedClientId: newSelectedClientId, existingClients: existingClients, reinstateWarning: existingClients.length > 0 });
        } else {
          this.setState({ archiveProcess: action });
          dispatch(clientActions.sendBulkUpdateClient(sendData)).then(json => {
              this.setState({ archiveProcess: false, selectedClientId: [], checked: false, showAlertModal: false }, () => {
                if (json.success && json.list) {
                  const listArgsObj = _.cloneDeep(this.state.listArgsObj); ; 
                  listArgsObj.status = action;
                  dispatch(clientActions.returnClientListPromise(...routeUtils.listArgsFromObject(listArgsObj))).then(result => {
                      json.list.forEach(client => {
                          dispatch(clientActions.removeClientFromList(client._id, ...routeUtils.listArgsFromObject(this.state.listArgsObj)));
                          if (result.success && result.list) {
                              dispatch(clientActions.addClientToList(client, ...routeUtils.listArgsFromObject(listArgsObj)));
                          }    
                      });
                  });
                }
              });
          });
        }
      } else if (action === "forced") {
        this.setState({ archiveProcess: "visible" });
        sendData.type = "visible";
        dispatch(clientActions.sendBulkUpdateClient(sendData)).then(json => {
          this.setState({ archiveProcess: false, selectedClientId: [], checked: false, existingClients: [], reinstateWarning: false }, () => {
            if (json.success && json.list) {
              const listArgsObj = _.cloneDeep(this.state.listArgsObj); ; 
              listArgsObj.status = action;
              dispatch(clientActions.returnClientListPromise(...routeUtils.listArgsFromObject(listArgsObj))).then(result => {
                  json.list.forEach(client => {
                      dispatch(clientActions.removeClientFromList(client._id, ...routeUtils.listArgsFromObject(this.state.listArgsObj)));
                      if (result.success && result.list) {
                          dispatch(clientActions.addClientToList(client, ...routeUtils.listArgsFromObject(listArgsObj)));
                      }    
                  });
              });
            }
          });
        });
      } else {
        this.setState({ archiveProcess: action });
        dispatch(clientActions.sendBulkUpdateClient(sendData)).then(json => {
          this.setState({ archiveProcess: false, selectedClientId: [], checked: false, showAlertModal: false }, () => {
            if (json.success && json.list) {
              const listArgsObj = _.cloneDeep(this.state.listArgsObj); ; 
              listArgsObj.status = action;
              dispatch(clientActions.returnClientListPromise(...routeUtils.listArgsFromObject(listArgsObj))).then(result => {
                  json.list.forEach(client => {
                      dispatch(clientActions.removeClientFromList(client._id, ...routeUtils.listArgsFromObject(this.state.listArgsObj)));
                      if (result.success && result.list) {
                          dispatch(clientActions.addClientToList(client, ...routeUtils.listArgsFromObject(listArgsObj)));
                      }    
                  });
              });
            }
          });
        });
      }
    }

    _toggleAlertModal() {
      this.setState({ showAlertModal: !this.state.showAlertModal }); 
    }

    _toggleWarningModal() {
      this.setState({ reinstateWarning: false, existingClients: [], selectedClientId: [], checked: false }); 
    }

    _handleCloseMobileOption(e) {
      e.stopPropagation();
      this.setState({ showMobileActionOption: false });
    }

    render() {
      const { 
        match
        , location
        , firmStore
        , clientStore
        , staffStore
        , loggedInUser
        , addressStore
        , phoneNumberStore
        , userStore
        , staffClientStore
        , utilClientStore
        , clientListItems
        , paginatedList
        , sortBy
      } = this.props;

      const { 
        selectedClientId
        , newStaffClient
        , viewToggleDropDown
        , checked
        , archiveProcess
        , clientOptionsOpen
        , pagination
        , showAlertModal
        , reinstateWarning
        , existingClients
        , showMobileActionOption
        , listArgsObj
        , clientIdsArgs
      } = this.state;

      const selectedFirm = firmStore.selected.getItem();
      const listArgs = routeUtils.listArgsFromObject(this.state.listArgsObj);
      const utilStaffClientStore = staffClientStore.util.getSelectedStore(...routeUtils.listArgsFromObject(clientIdsArgs));
      const staffClientList = staffClientStore.util.getList(...routeUtils.listArgsFromObject(clientIdsArgs));

      const isEmpty = (
        clientStore.selected.didInvalidate
        || !clientListItems
        || utilClientStore.didInvalidate
        || utilClientStore.isFetching
        || firmStore.selected.didInvalidate
        || !selectedFirm
        || !paginatedList
        || utilStaffClientStore.didInvalidate
        || utilStaffClientStore.isFetching
        || !staffClientList
      );

      const isFetching = (
        clientStore.selected.isFetching
        || !clientListItems
        || utilClientStore.isFetching
        || !selectedFirm
        || !paginatedList
        || utilStaffClientStore.isFetching
        // || !staffClientList
      );

      console.log(
        'isEmpty',
        clientStore.selected.didInvalidate
        , !clientListItems
        , utilClientStore.didInvalidate
        , utilClientStore.isFetching
        , firmStore.selected.didInvalidate
        , !selectedFirm
        , !paginatedList
        , utilStaffClientStore.didInvalidate
        , utilStaffClientStore.isFetching
        , !staffClientList
      );

      console.log(
        'isFetching',
        clientStore.selected.isFetching
        , !clientListItems
        , utilClientStore.isFetching
        , !selectedFirm
        , !paginatedList
        , utilStaffClientStore.isFetching
        , !staffClientList
      )

      let reinstateWarningMessage = "";
      if (reinstateWarning) {
        if (selectedClientId.length && existingClients.length) {
          reinstateWarningMessage = `${existingClients.length} ${existingClients.length > 1 ? "clients " : "client"}
          clients cannot be reinstated because active clients with the same names already exist.`;
        } else if (existingClients.length) {
          reinstateWarningMessage = `All clients cannot be reinstated because active clients with the same names already exist.`;
        }
      }

      // archiveProcess is a string type cannot pass to other component as string because they assumed that this is a boolean type

      return  (
        <PracticeLayout isSidebarOpen={true}>
          <CloseWrapper
            isOpen={(clientOptionsOpen || (archiveProcess ? true : false)) || reinstateWarning}
            closeAction={() => (archiveProcess ? true : false) ? null : this.setState({clientOptionsOpen: false})}
          />
          <div className="-practice-subnav">
            <div className="yt-container fluid">
              <div className="yt-row center-vert space-between">
                <Breadcrumbs links={location.state.breadcrumbs} />
                <button className="yt-btn x-small -mobile-yt-hide" onClick={() => this.setState({clientOptionsOpen: true})}>
                  New Client
                  <i style={{marginLeft: ".5em"}}className="fas fa-caret-down"/>
                </button>
              </div>
              <div className="dropdown">
                <NewClientOptionsMenu
                  firmId={parseInt(match.params.firmId)}
                  isOpen={clientOptionsOpen}
                  disabled={true}
                />
              </div>
            </div>
          </div>
          <div className="yt-container fluid">
            <h1>Archived Clients</h1>
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
                        viewingAs="client-list-archived"
                        selectedClientId={selectedClientId}
                        handleBulkAction={this._handleBulkAction}
                        handleShowDeleteClientModal={() => this.setState({ showAlertModal: true })}
                    />
                    </div>
                </div>
                <div className="yt-toolbar -mobile-yt-hide">
                  <div className="yt-tools space-between">
                    <div className="-filters -left"></div>
                    <div className="-options -right">
                      <button 
                        className="yt-btn x-small link info" 
                        disabled={!selectedClientId.length}
                        onClick={() => this._handleBulkAction("visible")}
                        style={{ display: 'inline-flex' }}
                      >
                        { archiveProcess === "visible" ?  (<p className="-archive-saving">Reinstate<span>.</span><span>.</span><span>.</span></p>) : "Reinstate Clients " }                   
                        { archiveProcess === "visible" ? null : selectedClientId.length ? <span> — {selectedClientId.length}</span> : null } 
                      </button>
                      <button 
                        className="yt-btn x-small link info" 
                        disabled={!selectedClientId.length}
                        onClick={() => this.setState({ showAlertModal: true })}
                        style={{ display: 'inline-flex' }}
                      >
                        { archiveProcess === "deleted" ?  (<p className="-archive-saving">Deleting<span>.</span><span>.</span><span>.</span></p>) : "Delete Clients" }                   
                        { archiveProcess === "deleted" ? null : selectedClientId.length ? <span> — {selectedClientId.length}</span> : null } 
                      </button>                      
                      <div className="-options -yt-edit-option" onClick={() => this.setState({ viewToggleDropDown: true })}>
                        <div style={{position: "relative", height: "100%", width: "100%"}}>
                          <CloseWrapper
                            isOpen={viewToggleDropDown}
                            closeAction={this._handleCloseViewArchive}
                          />
                          <i className="far fa-ellipsis-v"></i>
                          <SingleClientOptions
                            isOpen={viewToggleDropDown}
                            archived={true}
                            singleClient={false}
                          />
                        </div>
                      </div>                    
                    </div>
                  </div>
                </div>
                <hr className="-mobile-yt-hide" />
                <div className="yt-table table -workspace-table truncate-cells" style={{ marginTop: 0 }}>
                    <div className="table-caption" style={{ borderBottom: "1px solid #aaa" }}>
                      <PageTabber
                        totalItems={utilClientStore.items.length}
                        totalPages={Math.ceil(utilClientStore.items.length / utilClientStore.pagination.per)}
                        pagination={utilClientStore.pagination}
                        setPagination={this._handleSetPagination}
                        setPerPage={this._setPerPage}
                        viewingAs="top"
                        itemName="archived clients"
                        searchText="Search..."
                        firmId={match.params.firmId}
                        isChanged={true}
                      />
                  </div>
                  <div className="-table-horizontal-scrolling">
                    <div className="table-head">
                      <div className="table-cell">
                        <CheckboxInput 
                          name="clients"
                          value={checked}
                          checked={checked} 
                          change={() => this._handleSelectedAllClient()} />
                      </div>
                      <div className="table-cell"></div>
                      <div className="table-cell -title sortable _40" onClick={() => this._handleFilter('name')}>Client Name
                      { sortBy && sortBy == 'name' ? 
                        <i className="fad fa-sort-down"></i>
                        : sortBy && sortBy == '-name' ?
                        <i className="fad fa-sort-up"></i>
                        : 
                        <i className="fad fa-sort"></i>
                      }
                      </div>
                      <div className="table-cell _30">Assigned Staff</div>
                      <div className="table-cell _30">Primary Contact</div>
                      <div className="table-cell _30">Email</div>
                      <div className="table-cell _30">Phone Number</div>
                      <div className="table-cell _30">Address</div>
                    </div>
                    {paginatedList.map((client, i) => {
                      return (
                        <PracticeClientSettingsListItem 
                          address={addressStore.byId[client._primaryAddress]}
                          key={'client_' + client._id  + '_' + i}
                          client={client}
                          phoneNumber={phoneNumberStore.byId[client._primaryPhone]}
                          primaryContact={client._primaryContact ? userStore.byId[client._primaryContact] : null}
                          staffClientList={staffClientList || []}
                          handleSelectedClient={this._handleSelectedClient}
                          checked={selectedClientId.includes(client._id)}
                          newStaffClient={newStaffClient}
                          archived={true}
                          listArgs={listArgs}
                          handleFetchList={this._handleFetchList}
                        />
                      )
                    })
                    }
                  </div>
                </div>
                <PageTabber
                  totalItems={utilClientStore.items.length}
                  totalPages={Math.ceil(utilClientStore.items.length / utilClientStore.pagination.per)}
                  pagination={utilClientStore.pagination}
                  setPagination={this._handleSetPagination}
                  setPerPage={this._setPerPage}
                  viewingAs="bottom"
                  itemName="archived clients"
                  searchText="Search..."
                  firmId={match.params.firmId}
                  isChanged={true}
                />
              </div>
            }
          </div>
          <AlertModal
            alertMessage={"Are you sure? This cannot be undone."}
            alertTitle={`Delete this client${selectedClientId.length > 1 ? "s" : ""}`}
            closeAction={this._toggleAlertModal}
            confirmAction={() => this._handleBulkAction("deleted")}
            confirmText={"Delete"}
            declineAction={this._toggleAlertModal}
            declineText={"Cancel"}
            isOpen={showAlertModal}
            type={'danger'}
          >
          </AlertModal>
          <AlertModal
            alertMessage={reinstateWarningMessage}
            alertTitle={`Warning: Duplicate name`}
            closeAction={this._toggleWarningModal}
            confirmAction={() => selectedClientId.length > 0 ? this._handleBulkAction("forced") : this._toggleWarningModal()}
            confirmText={selectedClientId.length > 0 ? "Continue" : "Okay"}
            declineAction={selectedClientId.length > 0 ? this._toggleWarningModal : null}
            declineText={selectedClientId.length > 0 ? "Cancel" : null}
            isOpen={reinstateWarning}
            type={'danger'}
          >
          </AlertModal>          
        </PracticeLayout>
      )
    }
}


PracticeClientSettingsListAchive.propTypes = {
    dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  const clientStore = store.client;
  const listArgsObj = routeUtils.listArgsFromObject({
      _firm: props.match.params.firmId
      , status: 'archived'
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
          clientListItems = clientListItems.filter(client => filterUtils.filterClient(queryTestString, client));
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
    addressStore: store.address
    , clientStore: store.client
    , firmStore: store.firm 
    , loggedInUser: store.user.loggedIn.user
    , phoneNumberStore: store.phoneNumber
    , staffClientStore: store.staffClient
    , staffStore: store.staff
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
    )(PracticeClientSettingsListAchive)
);
