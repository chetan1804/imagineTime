
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
import MobileActionsOption from '../../../../global/components/helpers/MobileActionOptions.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

// import actions
import * as staffActions from '../../staffActions';

// import resource components
import PracticeStaffTableListItem from './PracticeStaffTableListItem.js.jsx';

class PracticeStaffList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs,
      selectedStaff: "",
      sendingInvite: false
      , sendingReset: false
      , successInvite: false
      , successReset: false
      , showMobileActionOption: false
      , isDelModalOpen: false
    }
    this._bind(
      '_handleSelectedTagsChange'
      , '_handleResendInvite'
      , '_handleResetPassword'
      , '_handleMobileOption'
      , '_handleFilter'
    )
  }

  _handleSelectedTagsChange(e) {
    console.log("handleSelectedTagsChange", e)
    // additional logic here if we want to break out tags into multiple filters, ie years
    // for now e.target.value contains all of the filters, but may only contain a subset
    // the output to the parent should be the entire list of tags
    this.props.handleFilter(e)
  }

  _handleResendInvite(user, owner) {

    const { dispatch, match } = this.props;

    this.setState({ selectedStaff: user._id, sendingInvite: true });

    const sendData = {
      invitations: [
        {
          email: user.username,
          fullName: user.firstname + " " + user.lastname,
          owner: owner
        }
      ]
      , personalNote: '' 
    }

    const firmId = match.params.firmId;

    try {
      dispatch(staffActions.sendInviteStaff(firmId, sendData)).then(staffRes => {
        if(staffRes.success) {
          this.setState({ sendingInvite: false, successInvite: true });
          setTimeout(() => {
            this.setState({ successInvite: false });
          }, 2000)
          console.log("Successfully resend the invite");
        } else {
          this.setState({ sendingInvite: false, selectedStaff: "" });
          alert("ERROR - Check logs");
        }
      });
    } catch(err) {
      console.log(err);
      this.setState({ sendingInvite: false, selectedStaff: "" });
    }
  }

  _handleResetPassword(user) {
    const { dispatch, match } = this.props;
    
    this.setState({ sendingReset: true, selectedStaff: user._id });
    
    if (user) {
      const sendData = {
        firmId: match.params.firmId
        , user: user
      }

      try {
        dispatch(staffActions.sendInviteWithResetUser(sendData)).then(json => {
          if (json.success) {
            this.setState({ sendingReset: false, successReset: true })
            setTimeout(() => {
              this.setState({ successReset: false });
            }, 2000)
          } else {
            this.setState({ sendingReset: false, selectedContact: "" });
          }
        });
      } catch(err) {
        console.log('ERROR', err);
        this.setState({ sendingReset: false, selectedContact: "" });
      }
    }
  }

  _handleMobileOption(e) {
    e.stopPropagation();
    const showMobileActionOption = _.cloneDeep(showMobileActionOption);
    this.setState({ showMobileActionOption: !showMobileActionOption }, () => {
      this.props.handleOptionMenu();
    });
  }

  _handleFilter(sortBy) {
    const { dispatch, staffList } = this.props;
    let newFilter = staffList.filter;
    
    if (
      staffList.filter.sortBy &&
      staffList.filter.sortBy.indexOf("-") < 0
    ) {
      sortBy = "-" + sortBy;
    } else {
      sortBy = sortBy.substring(0);
    }
    newFilter.sortBy = sortBy;
    dispatch(staffActions.setFilter(newFilter));
  }

  render() {
    const {
      allTags
      , handleSetPagination
      , match
      , paginatedList
      , selectedTagIds
      , sortedAndFilteredList
      , staffList
      , userMap
      , firmStore
      , handleOptionMenu
      , mobileOptionMenu
      , handleNewStaff
      , sortBy
      , dispatch
    } = this.props;
    
    const {
      showMobileActionOption,
      isDelModalOpen,
      selectedStaff
    } = this.state;

    const deleteModal = (data) => {
      this.setState({ isDelModalOpen: true, selectedStaff: data  })
      if (isDelModalOpen) {
        this.setState({ isDelModalOpen: false});
      }
    }

    const deleteStaff = () => {
      dispatch(staffActions.sendDelete(selectedStaff._id))
      this.setState({ isDelModalOpen: false })
    } 

    return (
      <div className="file-list-wrapper -list-wrapper-80-yt-col">
        <AlertModal
          alertMessage={<div><p>Delete staff <b>{selectedStaff && selectedStaff.firstname} {selectedStaff && selectedStaff.lastname}</b>?</p></div> }
          alertTitle="Delete"
          closeAction={deleteModal}
          confirmAction={deleteStaff}
          confirmText="Okay"
          isOpen={isDelModalOpen}
          type="danger"
         />
        <div className={`-options -mobile-layout yt-toolbar`} onClick={this._handleMobileOption}>
            <div>
            <CloseWrapper
                isOpen={showMobileActionOption && mobileOptionMenu}
                closeAction={this._handleMobileOption}
            />
            <i className="far fa-ellipsis-h"></i>
            <MobileActionsOption
                isOpen={showMobileActionOption && mobileOptionMenu}
                closeAction={() => this.setState({showMobileActionOption: false})}
                viewingAs="firm-staff-member-list"
                handleNewStaff={handleNewStaff}
            />
            </div>
        </div>
        {/**
        <div className="yt-toolbar">
          <div className="yt-tools space-between">
            <div className="-filters -left">
              <strong>Filter by: </strong>
              <FilterBy
                applyFilter={this._handleSelectedTagsChange}
                displayKey="name"
                items={allTags || []}
                label="Tags"
                name="_tags"
                selected={selectedTagIds}
                valueKey="_id"
              />
            </div>
            <div className="-options -right">
              // <Link className="yt-btn x-small rounded info" to={`${match.url}/invite`}><i className="fas fa-plus"/></Link> 
            </div>
          </div>
          </div>
          <hr/>
        */}
        { this.state.viewingAs === 'grid' ? 
          <div className="file-grid" >
            {/*
              * TODO: Create a FirmStaffGridListItem
              */}
          </div>
          : 
          <table className="yt-table firm-table -workspace-table truncate-cells">
            <caption>
              <PageTabber
                totalItems={staffList.items.length}
                totalPages={Math.ceil(staffList.items.length / staffList.pagination.per)}
                pagination={staffList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="top"
                itemName="staff"
                searchText="Search..."
                firmId={match.params.firmId}
              />
            </caption>
            <thead>
              <tr>
              <th className="_50" onClick={() => this._handleFilter("staff")}>Name &nbsp;
                  {sortBy && sortBy == "staff" ? (
                    <i className="fad fa-sort-down"></i>
                  ) : sortBy && sortBy == "-staff" ? (
                    <i className="fad fa-sort-up"></i>
                  ) : (
                    <i className="fad fa-sort"></i>
                )}</th>
                <th>Permissions</th>
                <th>Status</th>
                <th className="_40"></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="-table-header-mobile-layout" style={{ display: "none" }}>
                <th className="_50">Name </th>
                <th>Permissions</th>
                <th>Status</th>
                <th className="_40"></th>
                <th></th>
              </tr>
              { paginatedList.length > 0 ? 
                paginatedList.map((staff, i) => {
                  return (
                    <PracticeStaffTableListItem
                      // key={"staff_" + staff._id + i}
                      staff={staff}
                      user={userMap[staff._user]}
                      selectedStaff={this.state.selectedStaff}
                      handleResendInvite={this._handleResendInvite}
                      handleResetPassword={this._handleResetPassword}
                      sendingInvite={this.state.sendingInvite}
                      successInvite={this.state.successInvite}
                      sendingReset={this.state.sendingReset}
                      successReset={this.state.successReset}
                      sortBy={sortBy}                      
                      deleteModal={deleteModal}              
                    />
                  )
                })
                : 
                <tr className="empty-state">
                  <td>
                    <em>No staff</em>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
        <PageTabber
          totalItems={staffList.items.length}
          totalPages={Math.ceil(staffList.items.length / staffList.pagination.per)}
          pagination={staffList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
          itemName="staff"
          searchText="Search..."
          firmId={match.params.firmId}
        />
      </div>
    )
  }
}

PracticeStaffList.propTypes = {
  dispatch: PropTypes.func.isRequired
  , allTags: PropTypes.array
  , handleFilter: PropTypes.func
  , handleQuery: PropTypes.func 
  , handleOpenAddStaffModal: PropTypes.func
  , handleSetPagination: PropTypes.func.isRequired
  , handleSort: PropTypes.func.isRequired 
  , selectedTagIds: PropTypes.array
  , sortedAndFilteredList: PropTypes.array
  , staffList: PropTypes.object.isRequired
  , viewingAs: PropTypes.string 
}

PracticeStaffList.defaultProps = {
  allTags: null 
  , handleFilter: null
  , handleQuery: null 
  , handleOpenAddStaffModal: null
  , handleSort: null 
  , sortedAndFilteredList: []
  , viewingAs: 'table'
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  const { staffList, staffListItems, userMap } = props;
  let paginatedList = [];
  let orderedList = [];
  let sortBy = "";

  const newData = staffListItems.map(data => {
    const user = userMap[data._user]
    const newObj = {
      firstname: user && user.firstname,
      lastname: user && user.lastname,
      apiKey: data.apiKey,
      apiUsername: data.apiUsername,
      contextUsername: data.contextUsername,
      created_at: data.created_at,
      eSigAccess: data.eSigAccess,
      eSigEmail: data.eSigEmail,
      owner: data.owner,
      status: data.status,
      updated_at: data.updated_at,
      _eSigGrantedBy: data._eSigGrantedBy,
      _firm: data._firm,
      _id: data._id,
      _user: data._user,
    }
    return newObj
  })

  if(staffListItems) {
    const pagination = staffList.pagination || {page: 1, per: 50};

    sortBy = staffList.filter
      ? staffList.filter.sortBy
      : "staff";

    // SORT THE LIST
    switch (sortBy) {
      case "staff":
        orderedList = _.orderBy(
          newData,
          [(item) => item.firstname],
          ["asc"]
        );
        break;
      case "-staff":
        orderedList = _.orderBy(
          newData,
          [(item) => item.firstname],
          ["desc"]
        );
        break;
      default:
        orderedList = newData;
    }
    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(orderedList, start, end);      
  }

 return {
   paginatedList: paginatedList
   , staffMap: store.staff.byId
   , userMap: store.user.byId
   , firmStore: store.firm
   , sortBy
 }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(PracticeStaffList)
);
