/**
 * view component for /firm/:firmId/clients
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import FilterList from '../../../../global/components/helpers/FilterList.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';
import RoleModalComponent from '../../../../global/enum/RoleModalComponent.js.jsx';
import DropdownButton from '../../../../global/components/helpers/DropdownButton.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms/';

// import utilities
import { filterUtils, routeUtils } from '../../../../global/utils';

// import components 
import PracticeClientSettingsListItem from '../components/PracticeClientSettingsListItem.js.jsx';
import NewClientOptionsMenu from '../../components/NewClientOptionsMenu.js.jsx';
import SingleClientOptions from '../components/SingleClientOptions.js.jsx'; 

// import actions
import * as clientActions from '../../clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';

// import constants
import {CLIENT_ENGAGEMENT_TYPES} from '../../../../config/constants';

const FILTER_ENGAGEMENTTYPE_ALL = '__All__';
const FILTER_ENGAGEMENTTYPE_NONE = '__None__';
const FILTER_ENGAGEMENTTYPE_SOME = '__Some__';

const templateActionListItems = [
    // {label: 'Apply document template', name: "document_template_apply", value: "document_template_apply" }, 
    {label: 'Apply folder template', name: "file_folder_template_apply", value: "file_folder_template_apply"},
    {label: 'Apply request list', name: "request_list_apply", value: "request_list_apply"}
];

const staffActionListItems = [
    {label: 'Assign staff', name: "client_new_staff_client", value: "client_new_staff_client"},
    {label: 'Unassigned staff', name: "unassigned_staff", value: "unassigned_staff" }
];

const notificationActionListItems = [
    {label: 'Client Notification', name: "client_notification", value: "client_notification"},
    {label: 'Staff Notification', name: "client_staff_notification", value: "client_staff_notification" }
];

class PracticeClientSettingsList extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            listArgsObj: {
                _firm: props.match.params.firmId
                , status: 'visible'
            }
            , clientOptionsOpen: false
            , pagination: {
                page: 1
                , per: 50
            }
            , queryText: ''
            , sortBy: 'name'
            , selectedClientId: []
            , newStaffClient: null
            , viewToggleDropDown: false
            , checked: false
            , archiveProcess: false
            , clientUpdate: false
            , showMobileActionOption: false
            , roleModal: null
            , unassignStaffModalOpen: false
            , deleteProcess: false
            , selectedStaffId: []
            , unselectedStaffId: []
            , engagementTypeFilterNames: [
                {label: '-- All --', name: 'All', value: FILTER_ENGAGEMENTTYPE_ALL}
                , {label: '-- None --', name: 'None', value: FILTER_ENGAGEMENTTYPE_NONE}
                , {label: '-- Some --', name: 'Some', value: FILTER_ENGAGEMENTTYPE_SOME}
            ]
        };
        this._bind(
            '_handleSetPagination'
            , '_setPerPage'
            , '_handleFilter'
            , '_handleSelectedClient'
            , '_handleNewStaffClient'
            , '_handleCloseViewArchive'
            , '_handleSelectedAllClient'
            , '_handleBulkArchive'
            , '_handleCloseMobileOption'
            , '_handleFetchList'
            , '_handleClientAction'
            , '_handleUnassignStaff'
            , 'onEngagementTypeFilterChange'
            , '_handleQuery'
        );
    }

    componentDidMount() {
        const { dispatch, match, paginatedList, loggedInUser, utilClientStore, clientStore } = this.props;
        const { filterNames } = clientStore;
        const engagementTypeFilterNames = _.cloneDeep(this.state.engagementTypeFilterNames);
        dispatch(clientActions.fetchListIfNeeded('engagement-types', match.params.firmId)).then(json => {
            if (json && json.engagementTypes && json.engagementTypes.length) {
                json.engagementTypes.forEach(item => {
                    engagementTypeFilterNames.push({label: item, name: item, value: item});                
                });
                this.setState({ engagementTypeFilterNames });
            }
        });
        dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
        dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
        dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
        dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
        dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
        dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
        dispatch(clientActions.fetchListIfNeeded('_user', loggedInUser._id)); // this should live on every top-level route of the portal 
        this._handleFetchList();
        if(filterNames.engagementTypeFilter == null) {
            let newFilterNames = _.cloneDeep(filterNames);
            newFilterNames.engagementTypeFilter = engagementTypeFilterNames[0].value;
            dispatch(clientActions.setSettingsScreenFilter(newFilterNames));
        }
    }

    componentWillUnmount() {
        const dispatch = this.props.dispatch;
        const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
        dispatch(clientActions.setQuery("", ...listArgsObj));
        this.setState({query: "", newStaffClient: null});
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
        const { utilClientStore, dispatch, userStore, paginatedList } = this.props; 
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
        const { staffClientStore, utilClientStore, clientStore } = this.props;
        let selectedStaffId = _.cloneDeep(this.state.selectedStaffId);
        const paginatedList = _.cloneDeep(this.props.paginatedList);
        let newclientIds = _.cloneDeep(this.state.selectedClientId);
        let checked = false;
        
        const filterStaffList = clientStore.byId && clientStore.byId[clientId] && clientStore.byId[clientId].staffclients;
        const staffListIds = filterStaffList.map(data => {
            return data && data._id;
        });
        
        if(newclientIds.indexOf(clientId) === -1) {
            newclientIds.push(clientId);
            selectedStaffId.push(staffListIds);
            checked = paginatedList.length === newclientIds.length;
        } else {
            newclientIds.splice(newclientIds.indexOf(clientId), 1);
            selectedStaffId = selectedStaffId.map(eachId => !staffListIds.includes(eachId));
        }

        this.setState({
            selectedClientId: newclientIds
            , checked
            , selectedStaffId
        });
    }

    _handleNewStaffClient(action) {
        const { dispatch, match, paginatedList, utilClientStore } = this.props;
        if (action) {
            const clientIds = paginatedList.map(client => client._id);
            const pagination = utilClientStore.pagination || {page: 1, per: 50};
            const objArgs = routeUtils.listArgsFromObject({
                _argsByPages: `page${pagination.page}-per${pagination.per}`
            });
            dispatch(staffClientActions.fetchListByClientIds(objArgs, clientIds));
            this.setState({ selectedClientId: [], roleModal: null, checked: false  });
        } else {
            this.setState({ selectedClientId: [], roleModal: null, checked: false  });
        }
    }

    _handleCloseViewArchive(e) {
        e.stopPropagation();
        this.setState({ viewToggleDropDown: false });    
    }

    _handleSelectedAllClient() {
        const checked = _.cloneDeep(this.state.checked);
        const paginatedList = _.cloneDeep(this.props.paginatedList);
        if (!checked) {
            const selectedStaffId = [];
            const clientIds = paginatedList.map(client => {
                if (client && client.staffclients && client.staffclients.length) {
                    client.staffclients.forEach(item => {
                        if (item && item._id) selectedStaffId.push(item._id);
                    });
                }
                return client._id;
            });
            this.setState({ selectedClientId: clientIds, checked: true, selectedStaffId });
        } else {
            this.setState({ selectedClientId: [], checked: false, selectedStaffId: [] });
        }
    } 

    _handleBulkArchive() {
        const { dispatch } = this.props;
        const { selectedClientId } = this.state;
        const sendData = { type: 'archived', clientIds: selectedClientId }
        
        this.setState({ archiveProcess: true });
        dispatch(clientActions.sendBulkUpdateClient(sendData)).then(json => {
            this.setState({ archiveProcess: false, selectedClientId: [], checked: false }, () => {
                if (json.success && json.list) {
                    const listArgsObj = _.cloneDeep(this.state.listArgsObj); ; 
                    listArgsObj.status = "archived";
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

    _handleCloseMobileOption(e) {
        e.stopPropagation();
        this.setState({ showMobileActionOption: false });
    }

    _handleClientAction(value) {
        console.log(value);
        const updateSelectedState = {};
        if (value === "unassigned_staff") {
            updateSelectedState.unassignStaffModalOpen = true;
        } else {
            updateSelectedState.roleModal = value;
        }
        this.setState(updateSelectedState);
    }

    _handleUnassignStaff() {
        const { dispatch, match } = this.props;
        const { selectedStaffId } = this.state;
        this.setState({ unassignStaffModalOpen: false,  deleteProcess: true})
    
        dispatch(staffClientActions.sendBulkDelete(selectedStaffId, match.params.firmId)).then(json => {
          if (json.success) {
            this.setState({ deleteProcess: false, selectedStaffId: [], checked: false })
          }
        })
    }

    onEngagementTypeFilterChange(value) {
        const { clientStore, dispatch } = this.props;
        const { filterNames } = clientStore;
            if(value === filterNames.engagementTypeFilter) {
            return;
        }
        let newFilterNames = _.cloneDeep(filterNames);
        newFilterNames.engagementTypeFilter = value;
        dispatch(clientActions.setSettingsScreenFilter(newFilterNames));
    }

    _handleQuery(e) {
        const { dispatch } = this.props;
        const listArgsObj = routeUtils.listArgsFromObject(this.state.listArgsObj);
        dispatch(clientActions.setQuery(e.target.value.toLowerCase(), ...listArgsObj));
        this.setState({query: e.target.value.toLowerCase()});
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
            , staffMap
        } = this.props;

        const { 
            selectedClientId
            , newStaffClient
            , viewToggleDropDown
            , checked
            , archiveProcess
            , clientOptionsOpen
            , showMobileActionOption
            , listArgsObj
            , roleModal
            , deleteProcess
            , unassignStaffModalOpen 
            , selectedStaffId
            , engagementTypeFilterNames
        } = this.state;
        const { filterNames } = clientStore;
        console.log('Here in render. paginatedList - length :'
            , (!!paginatedList && !!paginatedList.length ? paginatedList.length : 0)
            , ', filterNames:', filterNames
        );

        const selectedFirm = firmStore.selected.getItem();
        const listArgs = routeUtils.listArgsFromObject(this.state.listArgsObj);
        const staffListItems = staffStore.util.getList('_firm', match.params.firmId);
        const clientIds = paginatedList.map(client => client._id);
        const pagination = utilClientStore.pagination || {page: 1, per: 50};
        const objArgs = routeUtils.listArgsFromObject({
            _argsByPages: `page${pagination.page}-per${pagination.per}`
        });
        const utilStaffClientStore = staffClientStore.util.getSelectedStore(...objArgs);
        const staffClientList = staffClientStore.util.getList(...objArgs);
        const isEmpty = (
            clientStore.selected.didInvalidate
            || !clientListItems
            || utilClientStore.didInvalidate
            || utilClientStore.isFetching
            || !selectedFirm
            || !staffListItems
            || !paginatedList
        );

        const isFetching = (
            clientStore.selected.isFetching
            || !clientListItems
            || utilClientStore.isFetching
            || !selectedFirm
            || !staffListItems
            || !paginatedList
        );

        const availableStaff = isEmpty || isFetching || !staffListItems ? [] : staffListItems.flatMap(staff => {
            let item = staff;
            let fullName = userStore.byId[staff._user] ? `${userStore.byId[staff._user].firstname} ${userStore.byId[staff._user].lastname}` : '';
            let userName = userStore.byId[staff._user] ? userStore.byId[staff._user].username : '';
            item.displayName = `${fullName} | ${userName}`;
            item.fullName = fullName;
            item.userName = userName;

            return staff && staff.status === "active" ? item : [];
        });

        const ModalComponent = RoleModalComponent[roleModal];
        
        return  (
        <PracticeLayout isSidebarOpen={true}>
            <Helmet>
                <title>Client Settings</title>
            </Helmet>
            <AlertModal
                alertMessage={<div>
                    <h4>Are you sure?</h4> 
                    {`Do you want to unassign ${selectedStaffId.length > 1 ? 'these staffs' : 'this staff'} from client?`}
                    </div> }
                alertTitle="Unassign staff"
                closeAction={() => this.setState({unassignStaffModalOpen: false})}
                confirmAction={() => this._handleUnassignStaff()}
                confirmText="Yes"
                declineText="Never mind"
                isOpen={unassignStaffModalOpen}
                type="warning"
            />
            <CloseWrapper
                isOpen={(clientOptionsOpen || archiveProcess)}
                closeAction={() => archiveProcess ? null : this.setState({clientOptionsOpen: false})}
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
                <div className="yt-container fluid" style={{ opacity: isFetching ? 0.5 : 1 }}>
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
                            viewingAs="client-list"
                            selectedClientId={selectedClientId}
                            handleBulkArchive={this._handleBulkArchive}
                            handleAddStaffModalOpen={() => this.setState({ roleModal: "client_new_staff_client" })}
                            handleNotifModalOpen={() => this.setState({ roleModal: "client_notification" })}
                        />
                        </div>
                    </div>
                    <div className="yt-toolbar -mobile-yt-hide">
                        <div className="yt-tools space-between">
                            <div className="-filters -left">
                                <span>Filters </span>
                                <FilterList
                                    label='Engagement Type'
                                    select={this.onEngagementTypeFilterChange}
                                    displayKey="label"
                                    items={engagementTypeFilterNames}
                                    selected={filterNames.engagementTypeFilter}
                                    valueKey="value"
                                    name="_filterEngagementType"
                                    isEnabled={true}
                                />
                            </div>
                            <div className="-options -right">
                                <button 
                                    className="yt-btn x-small link info" 
                                    disabled={!selectedClientId.length}
                                    onClick={this._handleBulkArchive}
                                    style={{ display: 'inline-flex' }}
                                >
                                    { archiveProcess ?  (<p className="-archive-saving">Archiving<span>.</span><span>.</span><span>.</span></p>) : "Archive Clients" }
                                    { archiveProcess ? null : selectedClientId.length ? <span> — {selectedClientId.length}</span> : null } 
                                </button>
                                <DropdownButton
                                    label="Notification Setting"
                                    selectedCount={selectedClientId.length}
                                    select={this._handleClientAction}
                                    displayKey="label"
                                    items={notificationActionListItems}
                                    selected={null}
                                    valueKey="value"
                                    disabled={!selectedClientId.length}
                                />
                                <DropdownButton
                                    label="Staff Setting"
                                    selectedCount={selectedClientId.length}
                                    select={this._handleClientAction}
                                    displayKey="label"
                                    items={staffActionListItems}
                                    selected={null}
                                    valueKey="value"
                                    disabled={!selectedClientId.length}
                                />
                                <DropdownButton
                                    label="Apply Template"
                                    selectedCount={selectedClientId.length}
                                    select={this._handleClientAction}
                                    displayKey="label"
                                    items={templateActionListItems}
                                    selected={null}
                                    valueKey="value"
                                    disabled={!selectedClientId.length}
                                />
                                <div className="-options -yt-edit-option" onClick={() => this.setState({ viewToggleDropDown: true })}>
                                    <div style={{position: "relative", height: "100%", width: "100%"}}>
                                        <CloseWrapper
                                            isOpen={viewToggleDropDown}
                                            closeAction={this._handleCloseViewArchive}
                                        />
                                        <i className="far fa-ellipsis-v"></i>
                                        <SingleClientOptions
                                            isOpen={viewToggleDropDown}
                                            archived={false}
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
                                totalItems={clientListItems.length}
                                totalPages={Math.ceil(clientListItems.length / utilClientStore.pagination.per)}
                                pagination={utilClientStore.pagination}
                                setPagination={this._handleSetPagination}
                                setPerPage={this._setPerPage}
                                viewingAs="top"
                                itemName="clients"
                                searchText="Search..."
                                firmId={match.params.firmId}
                                isChanged={true}
                                enableSearch={true}
                                handleQuery={this._handleQuery}
                            />
                        </div>
                        <div className="-table-horizontal-scrolling">
                            <div className="table-head">
                                <div className="table-cell">
                                    <CheckboxInput 
                                        name="clients"
                                        value={checked}
                                        checked={checked} 
                                        change={this._handleSelectedAllClient} />
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
                                <div className="table-cell sortable " onClick={() => this._handleFilter('staff')}>Assigned Staff
                                    { sortBy && sortBy == 'staff' ? 
                                        <i className="fad fa-sort-down"></i>
                                        : sortBy && sortBy == '-staff' ?
                                        <i className="fad fa-sort-up"></i>
                                        : 
                                        <i className="fad fa-sort"></i>
                                    }
                                </div>
                                <div className="table-cell sortable _30" onClick={() => this._handleFilter('contact')}>Primary Contact
                                    { sortBy && sortBy == 'contact' ? 
                                        <i className="fad fa-sort-down"></i>
                                        : sortBy && sortBy == '-contact' ?
                                        <i className="fad fa-sort-up"></i>
                                        : 
                                        <i className="fad fa-sort"></i>
                                    }
                                </div>
                                <div className="table-cell sortable _30" onClick={() => this._handleFilter('email')}>Email
                                    { sortBy && sortBy == 'email' ? 
                                        <i className="fad fa-sort-down"></i>
                                        : sortBy && sortBy == '-email' ?
                                        <i className="fad fa-sort-up"></i>
                                        : 
                                        <i className="fad fa-sort"></i>
                                    }
                                </div>
                                <div className="table-cell sortable" onClick={() => this._handleFilter('number')}>Phone Number
                                    { sortBy && sortBy == 'number' ? 
                                        <i className="fad fa-sort-down"></i>
                                        : sortBy && sortBy == '-number' ?
                                        <i className="fad fa-sort-up"></i>
                                        : 
                                        <i className="fad fa-sort"></i>
                                    }
                                </div>
                                <div className="table-cell sortable" onClick={() => this._handleFilter('address')}>Address
                                    { sortBy && sortBy == 'address' ? 
                                        <i className="fad fa-sort-down"></i>
                                        : sortBy && sortBy == '-address' ?
                                        <i className="fad fa-sort-up"></i>
                                        : 
                                        <i className="fad fa-sort"></i>
                                    }
                                </div>
                            </div>
                            {paginatedList.map((client, i) => {
                            return (
                                    <PracticeClientSettingsListItem 
                                        address={client.objaddress}
                                        key={'client_' + client._id  + '_' + i}
                                        client={client}
                                        phoneNumber={client.phonenumber}
                                        primaryContact={client._primaryContact ? userStore.byId[client._primaryContact] : null}
                                        staffClientList={staffClientList || []}
                                        handleSelectedClient={this._handleSelectedClient}
                                        checked={selectedClientId.includes(client._id)}
                                        archived={false}
                                        listArgs={listArgs}
                                        handleFetchList={this._handleFetchList}
                                    />
                                )
                            })
                            }
                        </div>
                    </div>
                    <PageTabber
                        totalItems={clientListItems.length}
                        totalPages={Math.ceil(clientListItems.length / utilClientStore.pagination.per)}
                        pagination={utilClientStore.pagination}
                        setPagination={this._handleSetPagination}
                        setPerPage={this._setPerPage}
                        viewingAs="bottom"
                        itemName="clients"
                        searchText="Search..."
                        firmId={match.params.firmId}
                        isChanged={true}
                    />
                    <ModalComponent 
                        close={() => this.setState({ roleModal: null, selectedClientId: [], checked: false })}
                        handleClose={() => this.setState({ roleModal: null, selectedClientId: [], checked: false })}
                        isOpen={!!roleModal}
                        selectedClientId={selectedClientId}
                        handleNewStaffClient={this._handleNewStaffClient}
                        multipleAdd={true}
                        firmId={match.params.firmId}
                        staffListItems={availableStaff}
                        staffMap={staffMap}
                        match={match}
                        viewingAs="client-setting"
                        clientListArgs={listArgs}
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
            clientListItems = clientListItems.filter(client => filterUtils.filterClient(queryTestString, client));
        }

        // Filter by selected engagement type.
        if(!!clientStore.filterNames && !!clientStore.filterNames.engagementTypeFilter && clientStore.filterNames.engagementTypeFilter != FILTER_ENGAGEMENTTYPE_ALL) {
            const selectedEngagementType = clientStore.filterNames.engagementTypeFilter;
            //const listLength = clientListItems.length;
            //console.log('mapStoreToProps - selected engagement type:', selectedEngagementType);
            clientListItems = clientListItems.filter(item => {
                //console.log('mapStoreToProps - item.engagementTypes:', item.engagementTypes);
                if(!item.engagementTypes || item.engagementTypes.length < 1) {
                    return selectedEngagementType === FILTER_ENGAGEMENTTYPE_NONE;
                }
                if(selectedEngagementType === FILTER_ENGAGEMENTTYPE_NONE) {
                    return false;
                }
                if(selectedEngagementType === FILTER_ENGAGEMENTTYPE_SOME) {
                    return true;
                }
                return item.engagementTypes.filter(engType => engType === selectedEngagementType).length > 0;
            });
            //console.log('mapStoreToProps - clientListItems length reduced to', clientListItems.length, 'after application of engagement type filter "' + selectedEngagementType + '" from', listLength);
        }

        const newClientListItems = clientListItems && clientListItems.map(item => {
            const data = _.cloneDeep(item);
            data.contactFullName = "";
            data.phoneNumber = data.phonenumber;
            data.address = "";
            data.contactEmail = store.user.byId[data._primaryContact] && store.user.byId[data._primaryContact].username || "";
            if (store.user.byId[data._primaryContact]) {
                const contact = store.user.byId[data._primaryContact];
                data.contactFullName = contact.firstname || "";
                data.contactFullName += (data.contactFullName ? " " : "") + contact.lastname || "";
            }
            if (data.objaddress) {
                const address = data.objaddress;
                data.address = address.street1 || "";
                data.address += (data.address ? " " : "") + address.city || "";
                data.address += (data.address ? " " : "") + ` ${(!!address.state ? address.state : "")}`;
                data.address += (data.address ? " " : "") + address.country || "";
            }
            data.staffClientsCount = data.staffclients && data.staffclients[0] === null ? 0 : data.staffclients && data.staffclients.length;
            return data;
        });

        // SORT THE LIST
        switch(sortBy) {
            case 'name':
                orderedList = _.orderBy(newClientListItems, [item => item.name.toLowerCase()], ['asc']);
                break; 
            case '-name':
                orderedList = _.orderBy(newClientListItems, [item => item.name.toLowerCase()], ['desc']); 
                break;
            case 'staff':
                orderedList = _.orderBy(newClientListItems, [item => item.staffClientsCount], ['asc']);  
                break;
            case '-staff':
                orderedList = _.orderBy(newClientListItems, [item => item.staffClientsCount], ['desc']);
                break;
            case 'contact':
                orderedList =  _.orderBy(newClientListItems, [item => item.contactFullName.toLowerCase()], ['asc']); ;
                break;
            case '-contact':
                orderedList = _.orderBy(newClientListItems, [item => item.contactFullName.toLowerCase()], ['desc']); ;
                break;
            case 'email':
                orderedList = _.orderBy(newClientListItems, [item => item.contactEmail.toLowerCase()], ['asc']); ; 
                break;
            case '-email':
                orderedList = _.orderBy(newClientListItems, [item => item.contactEmail.toLowerCase()], ['desc']); ;
                break;
            case 'number':
                orderedList = _.orderBy(newClientListItems, [item => item.phoneNumber.toLowerCase()], ['asc']); ; 
                break;
            case '-number':
                orderedList = _.orderBy(newClientListItems, [item => item.phoneNumber.toLowerCase()], ['desc']); ;
                break;
            case 'address':
                orderedList = _.orderBy(newClientListItems, [item => item.address.toLowerCase()], ['asc']); ;
                break;
            case '-address':
                orderedList = _.orderBy(newClientListItems, [item => item.address.toLowerCase()], ['desc']); ;
                break;
            default: 
                orderedList = _.orderBy(newClientListItems, [item => item.name.toLowerCase()], ['asc']);
        }

        // APPLY PAGINATION
        const start = (pagination.page - 1) * pagination.per;
        const end = Number(start) + Number(pagination.per);
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
    , staffMap: store.staff.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeClientSettingsList)
);
