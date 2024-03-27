
// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import ACTIONS
import * as staffClientActions from '../../staffClientActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import FilterBy from '../../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../../global/components/pagination/PageTabber.js.jsx';
import DisplayAsButtons from '../../../../global/components/helpers/DisplayAsButtons.js.jsx';
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

// import resource components
import PracticeStaffClientTableListItem from './PracticeStaffClientTableListItem.js.jsx';

class PracticeStaffClientList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs
      , showMobileActionOption: false
      , checked: false
      , selectedStaffId: []
      , unassignStaffModalOpen: false
      , deleteProcess: false
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleCloseMobileOption'
      , '_handleSelectedAllStaffs'
      , '_handleSelectedStaff'
      , '_handleUnassignStaff'
    )
  }

  _handleSelectedTagsChange(e) {
    console.log("handleSelectedTagsChange", e)
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  _handleSelectedAllStaffs() {
    const { paginatedList } = this.props;
    if (!this.state.checked) {
        const staffIds = paginatedList.map(staff => staff._id);
        this.setState({ selectedStaffId: staffIds, checked: true });
    } else {
        this.setState({ selectedStaffId: [], checked: false });
    }
  }

  _handleSelectedStaff(staffId) {
    const { paginatedList } = this.props;
    let newStaffIds = _.cloneDeep(this.state.selectedStaffId);
    let checked = false;
    if(newStaffIds.indexOf(staffId) === -1) {
      newStaffIds.push(staffId);
        checked = paginatedList.length === newStaffIds.length;
    } else {
      newStaffIds.splice(newStaffIds.indexOf(staffId), 1);
    }      
    this.setState({
      selectedStaffId: newStaffIds
        , checked
    });
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

  render() {
    const {
      allTags
      , handleSetPagination
      , paginatedList
      , utilStaffClientStore
      , selectedTagIds
      , staffMap
      , userMap
      , match
      , handleQuery
    } = this.props;
   
    const {
      showMobileActionOption
      , checked
      , selectedStaffId
      , unassignStaffModalOpen
      , deleteProcess
    } = this.state;

    const disableButton = !selectedStaffId.length;

    return (
      <div className="file-list-wrapper">
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
                viewingAs="client-staffclient-list"
                handleOpenAddStaffModal={this.props.handleOpenAddStaffModal}
            />
            </div>
        </div>
        { paginatedList.length > 0 ?   
          <div className="yt-toolbar">
            <div className="yt-tools space-between">
              <div className="-filters -left">
                {/* TODO: Set up filters. */}
                {/* <strong>Filter by: </strong>
                <FilterBy
                  applyFilter={this._handleSelectedTagsChange}
                  displayKey="name"
                  items={allTags || []}
                  label="Tags"
                  name="_tags"
                  selected={selectedTagIds}
                  valueKey="_id"
                /> */}
              </div>
              <div className="-options -right">
                {/* <DisplayAsButtons
                  displayAs={this.state.viewingAs}
                  displayGrid={() => this.setState({viewingAs: 'grid'})}
                  displayTable={() => this.setState({viewingAs: 'table'})}
                /> */}
                <button
                  className="yt-btn x-small link info" 
                  disabled={disableButton}
                  style={{display: 'inline-flex'}}
                  onClick={() => this.setState({ unassignStaffModalOpen: true})}
                >
                  {deleteProcess ? (<p className="-unassign">Removing<span>.</span><span>.</span><span>.</span></p>): "Unassigned staff " }
                  {deleteProcess ? null : selectedStaffId.length ? <span> — {selectedStaffId.length}</span> : null}
                </button>
                <button className="yt-btn x-small rounded info" onClick={this.props.handleOpenAddStaffModal}>Assign staff</button>
              </div>
            </div>
          </div>
          :
          null 
        }
        <hr className="-mobile-yt-hide" />
        { paginatedList.length > 0 ? 
          <table className="yt-table firm-table -workspace-table truncate-cells" style={{ marginTop: 0 }}>
            <caption style={{ borderBottom: "1px solid #aaa" }}>
            <PageTabber
              totalItems={utilStaffClientStore && utilStaffClientStore.items && utilStaffClientStore.items.length}
              totalPages={Math.ceil(utilStaffClientStore && utilStaffClientStore.items && utilStaffClientStore.items.length / utilStaffClientStore.pagination.per)}
              pagination={utilStaffClientStore && utilStaffClientStore.pagination}
              setPagination={handleSetPagination}
              setPerPage={this.props.setPerPage}
              viewingAs="top"
              itemName="assigned staff"
              handleQuery={handleQuery}
              searchText="Search..."
              firmId={match.params.firmId}
              clientId={match.params.clientId}
              isChanged={true}
            />
            </caption>
            <thead>
              <tr>
                <th>
                  <div style={{width: "25px", display: "inline-flex"}}>
                    <CheckboxInput 
                      name="staffs"
                      value={checked}
                      checked={checked} 
                      change={() => this._handleSelectedAllStaffs()} 
                    />
                  </div>
                </th>
                <th className="sortable _30">Name</th>
                <th className="sortable _30">Email</th>
                <th className="sortable _10">Permissions</th>
                <th className="sortable _10">Status</th>
                <th className="sortable">Date Assigned</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="-table-header-mobile-layout" style={{ display: "none" }}>
              <th>
                  <div style={{width: "25px", display: "inline-flex"}}>
                    <CheckboxInput 
                      name="staffs"
                      value={checked}
                      checked={checked} 
                      change={() => this._handleSelectedAllStaffs()} 
                    />
                  </div>
                </th>
                <th className="sortable _30">Name</th>
                <th className="sortable _30">Email</th>
                <th className="sortable _10">Permissions</th>
                <th className="sortable _10">Status</th>
                <th className="sortable">Date Assigned</th>
                <th></th>
                <th></th>
              </tr>
              {paginatedList.map((staffClient, i) => 
                <PracticeStaffClientTableListItem
                  staffClient={staffClient}
                  key={staffClient._id + i}
                  staff={staffMap[staffClient._staff]}
                  user={userMap[staffClient._user]}
                  handleSelectedStaff={this._handleSelectedStaff}
                  checked={selectedStaffId.includes(staffClient._id)}
                />
              )}
            </tbody>
          </table>
          :
          <div className="hero -empty-hero">
            <div className="u-centerText">
              <h3><em>No staff assigned to this client</em></h3>
              <br/>
              <button className="yt-btn rounded info" onClick={this.props.handleOpenAddStaffModal}>Assign staff members</button>
              <br/>
              <br/>
              <p>Staff members without owner/admin privileges will only be able to view Client Workspaces assigned to them. </p>
              <br/>
              <br/>
            </div>
          </div>
        }
        <PageTabber
          totalItems={utilStaffClientStore && utilStaffClientStore.items && utilStaffClientStore.items.length}
          totalPages={Math.ceil(utilStaffClientStore && utilStaffClientStore.items && utilStaffClientStore.items.length / utilStaffClientStore.pagination.per)}
          pagination={utilStaffClientStore && utilStaffClientStore.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
          itemName="assigned staff"
          handleQuery={handleQuery}
          searchText="Search..."
          firmId={match.params.firmId}
          clientId={match.params.clientId}
          isChanged={true}
        />
      </div>
    )
  }
}

PracticeStaffClientList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , allTags: PropTypes.array.isRequired
  , handleFilter: PropTypes.func.isRequired
  , handleQuery: PropTypes.func.isRequired 
  , handleOpenAddStaffModal: PropTypes.func
  , handleSetPagination: PropTypes.func.isRequired
  , handleSort: PropTypes.func.isRequired 
  , selectedTagIds: PropTypes.array
  , sortedAndFilteredList: PropTypes.array
  , utilStaffClientStore: PropTypes.object.isRequired
  , viewingAs: PropTypes.string 
}

PracticeStaffClientList.defaultProps = {
  handleOpenAddStaffModal: null 
  , sortedAndFilteredList: []
  , viewingAs: 'table'
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  const { utilStaffClientStore, staffClientListItems } = props;
  let paginatedList = [];
  if(staffClientListItems) {
    const pagination = utilStaffClientStore.pagination || {page: 1, per: 50};

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(staffClientListItems, start, end);
  }

  // unique key
  let uniques = [];
  paginatedList = paginatedList.filter(obj => {
    const unique = `${obj && obj._client}_${obj && obj._staff}_${obj && obj._user}`;
    if (!uniques.includes(unique)) {
      uniques.push(unique);
      return obj;
    } else {
      return null;
    }
  });
 
 return {
   paginatedList: paginatedList
   , staffMap: store.staff.byId
   , userMap: store.user.byId
 }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeStaffClientList)
);
