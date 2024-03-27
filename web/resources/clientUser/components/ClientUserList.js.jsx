/**
 * View component for /firm/:firmId/clients/:clientId/contacts 
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import third-party libraries

// import actions 
import * as clientUserActions from '../clientUserActions';
import * as clientActions from '../../client/clientActions';
import * as userActions from '../../user/userActions';

// import global components
import Binder from '../../../global/components/Binder.js.jsx';
import FilterBy from '../../../global/components/helpers/FilterBy.js.jsx';
import PageTabber from '../../../global/components/pagination/PageTabber.js.jsx';
import DisplayAsButtons from '../../../global/components/helpers/DisplayAsButtons.js.jsx';
import CloseWrapper from "../../../global/components/helpers/CloseWrapper.js.jsx";
import AlertModal from '../../../global/components/modals/AlertModal.js.jsx';
import MobileActionsOption from '../../../global/components/helpers/MobileActionOptions.js.jsx';

// import firm components
import { CheckboxInput } from '../../../global/components/forms/';

// import resource components
// import ClientUserGridListItem from './ClientUserGridListItem.js.jsx';
import ClientUserTableListItem from './ClientUserTableListItem.js.jsx'; 
import SingleClientUserOptions from '../practice/components/SingleClientUserOptions.js.jsx';


class ClientUserList extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      viewingAs: this.props.viewingAs,
      selectedContact: "",
      selectedClientUserId: [],
      sendingInvite: false
      , sendingReset: false
      , successInvite: false
      , successReset: false
      , archiveProcess: false
      , deleteProcess: false
      , removeProcess: false
      , viewToggleDropDown: false
      , checked: false
      , showAlertModal: false
      , showMobileActionOption: false
      , bulkResendInvite: false
    }
    // this._bind(
    //   '_handleSelectedTagsChange'
    // )

    this._bind(
      '_handleResendInvite'
      , '_handleResetPassword'
      , '_handleCloseViewArchive'
      , '_handleSelectedClientUser'
      , '_handleBulkArchiveClientUser'
      , '_toggleAlertModal'
      , '_handleCloseMobileOption'
      , '_handleBulkResendInvite'
    )
  }

  componentDidCatch() {
    const { dispatch, match } = this.props;
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_client', match.params.clientId));
    dispatch(clientUserActions.fetchListIfNeeded('_client', match.params.clientId))
  }

  // _handleSelectedTagsChange(e) {
  //   console.log("handleSelectedTagsChange", e)
  //   // additional logic here if we want to break out tags into multiple filters, ie years
  //   // for now e.target.value contains all of the filters, but may only contain a subset
  //   // the output to the parent should be the entire list of tags
  //   this.props.handleFilter(e)
  // }

  _handleCloseViewArchive(e) {
    e.stopPropagation();
    this.setState({ viewToggleDropDown: false });  
  }

  _toggleAlertModal() {
    this.setState({showAlertModal: !this.state.showAlertModal}); 
  }

  _handleResendInvite(currentUser, clientUser) {

    const { dispatch, match } = this.props;
    const user = _.cloneDeep(currentUser);
  
    this.setState({ selectedContact: user._id, sendingInvite: true });

    const firmId = match.params.firmId;
    const clientId = match.params.clientId;
    user._clientUser = clientUser._id;
    const sendData = {
      invitations: [user]
      , clientId
      , firmId
    }
    
    try {
      dispatch(clientUserActions.sendResendInviteClientUsers(sendData)).then(clientUserRes => {
        if(clientUserRes.success) {
          clientUser.accessType = "invitesent";
          dispatch(clientUserActions.updateSingleClientToMap({
            clientUser: clientUser
            , success: true
          }));
          this.setState({ sendingInvite: false, successInvite: true });
          setTimeout(() => {
            this.setState({ successInvite: false });
          }, 2000)
          console.log("Successfully resend the invite");
        } else {
          this.setState({ sendingInvite: false, selectedContact: "" });
          alert("ERROR - Check logs");
        }
      });
    } catch(err) {
      console.log(err);
      this.setState({ sendingInvite: false, selectedContact: "" });
    }
  }

  _handleResetPassword(user) {
    const { dispatch, match } = this.props;
    
    this.setState({ sendingReset: true, selectedContact: user._id });

    if (user) {
      const sendData = {
        clientId: match.params.clientId
        , user: user
      }

      try {
        dispatch(clientUserActions.sendInviteWithResetUser(sendData)).then(json => {
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

  _handleSelectedAllClientUser() {
    const { paginatedList } = this.props;
    if (!this.state.checked) {
        const clientUserIds = paginatedList.map(clientUser => clientUser._id);
        this.setState({ selectedClientUserId: clientUserIds, checked: true });
    } else {
        this.setState({ selectedClientUserId: [], checked: false });
    }
  }
  
  _handleSelectedClientUser(clientUserId) {
    const { paginatedList } = this.props;
    let newclientUserIds = _.cloneDeep(this.state.selectedClientUserId);
    let checked = false;
    if(newclientUserIds.indexOf(clientUserId) === -1) {
      newclientUserIds.push(clientUserId);
        checked = paginatedList.length === newclientUserIds.length;
    } else {
      newclientUserIds.splice(newclientUserIds.indexOf(clientUserId), 1);
    }      
    this.setState({
      selectedClientUserId: newclientUserIds
        , checked
    });
  }

  _setSelectedClientUser() {
    // console.log("selectedClientUserId", this.state);
    // this.setState({ selectedClientUserId: [] })
  }

  _handleBulkArchiveClientUser(status) {
    const { dispatch } = this.props;
    const { selectedClientUserId } = this.state;

    const data = { status: status, clientUserIds: selectedClientUserId };

    if(status == "deleted") {
      this.setState({ deleteProcess: true });
    } else {
      this.setState({ archiveProcess: true });
    }
    
    dispatch(clientUserActions.sendBulkUpdateClientUser(data)).then(json => {
        if (status === "deleted") {
          this._toggleAlertModal();
        }
        if (json.success && json.client) {
          dispatch(clientActions.updateSingleClientToMap({
            client: json.client
            , success: true
          }));
        }
        this.setState({ deleteProcess: false, archiveProcess: false, selectedClientUserId: [], checked: false });
    })
  }

  _handleCloseMobileOption(e) {
    e.stopPropagation();
    this.setState({ showMobileActionOption: false });
  }

  _handleBulkResendInvite() {
    const { dispatch, match, userMap, clientUserMap } = this.props;
    const { selectedClientUserId } = this.state;
  
    this.setState({ bulkResendInvite: true });

    const firmId = match.params.firmId;
    const clientId = match.params.clientId;

    const getInvitation = (cb) => {
      if (selectedClientUserId && selectedClientUserId.length) {
        const result = selectedClientUserId.map(val => {          
          if (val && clientUserMap[val]) {
            const user = _.cloneDeep(userMap[clientUserMap[val]._user]);
            if (user) {
              user._clientUser = val;
            }
            return user;
          } else {
            return null
          }
        });
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
          , clientId
        }
        dispatch(clientUserActions.sendResendInviteClientUsers(sendData)).then(clientUserRes => {
          if(clientUserRes.success) {
            this.setState({ bulkResendInvite: false, selectedClientUserId: [], checked: false });
          } else {
            this.setState({ bulkResendInvite: false });
            alert("ERROR - Check logs");
          }
        });
      } else {
        this.setState({ bulkResendInvite: false });
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      allTags
      , clientUserList
      , handleSetPagination
      , match
      , paginatedList
      , selectedTagIds
      , sortedAndFilteredList
      , archived
    } = this.props;

    const {
      selectedClientUserId
      , archiveProcess
      , removeProcess
      , deleteProcess
      , viewToggleDropDown
      , checked
      , showAlertModal
      , showMobileActionOption
      , bulkResendInvite
    } = this.state;

    const disableButton = !selectedClientUserId.length || deleteProcess || archiveProcess || bulkResendInvite;
    
    return (
      <div className="-client-user-list-wrapper">
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
                viewingAs="client-contact-list"
                archived={archived}
                selectedClientUserId={selectedClientUserId}
                toggleAlertModal={this._toggleAlertModal}
                handleBulkArchiveClientUser={this._handleBulkArchiveClientUser}
            />
          </div>
        </div>
        { match.params.firmId ? 
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
                  onClick={this._toggleAlertModal}
                >
                  { deleteProcess ?  (<p className="-archive-saving">Removing<span>.</span><span>.</span><span>.</span></p>) : "Remove from Client " }
                  { deleteProcess ? null : selectedClientUserId.length ? <span> — {selectedClientUserId.length}</span> : null } 
                </button>
                {
                  //&& paginatedList.length > 0 
                  !archived && (
                    <div style={{marginLeft: "0"}}>
                      <button
                        className="yt-btn x-small link info" 
                        disabled={disableButton}
                        style={{display: 'inline-flex'}}
                        onClick={(e) => this._handleBulkArchiveClientUser('archived')}
                      >
                        { archiveProcess ?  (<p className="-archive-saving">Archiving<span>.</span><span>.</span><span>.</span></p>) : "Archive Contacts" }
                        { archiveProcess ? null : selectedClientUserId.length ? <span> — {selectedClientUserId.length}</span> : null } 
                      </button>
                      <button
                        className="yt-btn x-small link info" 
                        disabled={disableButton}
                        style={{display: 'inline-flex'}}
                        onClick={this._handleBulkResendInvite}
                      >
                        { bulkResendInvite ?  (<p className="-archive-saving">Sending<span>.</span><span>.</span><span>.</span></p>) : "Resend Invite" }
                        { bulkResendInvite ? null : selectedClientUserId.length ? <span> — {selectedClientUserId.length}</span> : null } 
                      </button>
                      <Link className="yt-btn x-small rounded info" style={{ marginRight: "16px" }}to={`${match.url}/invite`}>Add contacts</Link>
                    </div>
                  )
                }
                {
                  archived && (
                    <div style={{marginLeft: "0"}}>
                      <button
                        className="yt-btn x-small link info" 
                        disabled={disableButton}
                        style={{display: 'inline-flex'}}
                        onClick={(e) => {this._handleBulkArchiveClientUser('active')}}
                      >
                        { archiveProcess ?  (<p className="-archive-saving">Reinstating<span>.</span><span>.</span><span>.</span></p>) : "Reinstate Contacts " }
                        { archiveProcess ? null : selectedClientUserId.length ? <span> — {selectedClientUserId.length}</span> : null } 
                      </button>
                      <button
                        className="yt-btn x-small link info" 
                        disabled={disableButton}
                        style={{display: 'inline-flex'}}
                        onClick={this._toggleAlertModal}
                      >
                        { deleteProcess ?  (<p className="-archive-saving">Deleting<span>.</span><span>.</span><span>.</span></p>) : "Delete Contacts " }
                        { deleteProcess ? null : selectedClientUserId.length ? <span> — {selectedClientUserId.length}</span> : null } 
                      </button>
                    </div>
                  )
                }

                <div className="-options -yt-edit-option" onClick={() => this.setState({ viewToggleDropDown: true })}>
                  <div style={{position: "relative", height: "100%", width: "100%"}}>
                      <CloseWrapper
                          isOpen={viewToggleDropDown}
                          closeAction={this._handleCloseViewArchive}
                      />
                      <i className="far fa-ellipsis-v"></i>
                      <SingleClientUserOptions
                          isOpen={viewToggleDropDown}
                          archived={archived}
                          singleClientUser={false}
                          closeAction={this._handleCloseViewArchive}
                      />
                  </div>
                </div>   
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
                totalItems={clientUserList.items.length}
                totalPages={Math.ceil(clientUserList.items.length / clientUserList.pagination.per)}
                pagination={clientUserList.pagination}
                setPagination={handleSetPagination}
                setPerPage={this.props.setPerPage}
                viewingAs="top"
                itemName="contacts"
                searchText="Search..."
              />
            </caption>
            <thead>
              <tr>
                <th>
                  <div style={{width: "25px", display: "inline-flex"}}>
                    <CheckboxInput 
                      name="clients"
                      value={checked}
                      checked={checked} 
                      change={() => this._handleSelectedAllClientUser()} />
                  </div>
                </th>
                <th></th>
                <th className="sortable _40" onClick={null}>Name</th>
                <th className="sortable _40" onClick={null}>Email</th>
                <th className="sortable _30" onClick={null}>Position</th>
                <th className="sortable" onClick={null}>Phone</th>
                <th className="sortable" onClick={null}>Address</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="-table-header-mobile-layout" style={{ display: "none" }}>
                <th style={{ minWidth: 0 }}>
                  <div style={{width: "25px", display: "inline-flex" }}>
                      <CheckboxInput 
                        name="clients"
                        value={checked}
                        checked={checked} 
                        change={() => this._handleSelectedAllClientUser()} />
                    </div>
                </th>
                <th style={{ minWidth: 0 }}></th>
                <th className="sortable _40" onClick={null}>Name</th>
                <th className="sortable _40" onClick={null}>Email</th>
                <th className="sortable _30" onClick={null}>Position</th>
                <th className="sortable" onClick={null}>Phone</th>
                <th className="sortable" onClick={null}>Address</th>
                <th></th>
              </tr>
              { paginatedList.map((clientUser, i) => 
                  <ClientUserTableListItem
                    clientUser={clientUser}
                    key={clientUser._id + "_key " + i}
                    handleResendInvite={this._handleResendInvite}
                    handleResetPassword={this._handleResetPassword}
                    selectedContact={this.state.selectedContact}
                    sendingInvite={this.state.sendingInvite}
                    successInvite={this.state.successInvite}
                    sendingReset={this.state.sendingReset}
                    successReset={this.state.successReset}
                    handleSelectedClientUser={this._handleSelectedClientUser}
                    checked={selectedClientUserId.includes(clientUser._id)}
                    archived={archived}
                    setSelectedClientUser={this._setSelectedClientUser}
                  />
                )
              }
            </tbody>
          </table>
          :
          <div className="hero -empty-hero">
            <div className="u-centerText">
              <h3><em>No client contacts</em></h3>
              <br/>
              {
                !archived && (
                  <Link className="yt-btn rounded info" to={`${match.url}/invite`}>Add client contacts</Link>
                )
              }
              <br/>
              <br/>
              <p>Client contacts are individuals associated with this client. They receive notifications, can ask & answer questions, and can view all client files.</p>
              <br/>
              <br/>
            </div>
          </div>
        }
        <PageTabber
          totalItems={clientUserList.items.length}
          totalPages={Math.ceil(clientUserList.items.length / clientUserList.pagination.per)}
          pagination={clientUserList.pagination}
          setPagination={handleSetPagination}
          setPerPage={this.props.setPerPage}
          viewingAs="bottom"
          itemName="contacts"
          searchText="Search..."
        />
        <AlertModal
          alertMessage={"Are you sure? This cannot be undone."}
          alertTitle={"Delete this contacts?"}
          closeAction={this._toggleAlertModal}
          confirmAction={() => {this._handleBulkArchiveClientUser('deleted')}}
          confirmText={"Delete"}
          declineAction={this._toggleAlertModal}
          declineText={"Cancel"}
          isOpen={showAlertModal}
          type={'danger'}
        >
        </AlertModal>   
      </div>
    )
  }
}

ClientUserList.propTypes = {
  clientUserList: PropTypes.object.isRequired
  , dispatch: PropTypes.func.isRequired
  , sortedAndFilteredList: PropTypes.array 
  , viewingAs: PropTypes.string 
}

ClientUserList.defaultProps = {
  sortedAndFilteredList: []
  , viewingAs: 'table'
}


const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  
  const { clientUserList, clientUserListItems } = props;
  let paginatedList = [];
  if(clientUserListItems) {
    const pagination = clientUserList.pagination || {page: 1, per: 50};

    // APPLY PAGINATION
    const start = (pagination.page - 1) * pagination.per;
    const end = start + pagination.per;
    paginatedList = _.slice(clientUserListItems, start, end);      
  }

 
 return {
   paginatedList: paginatedList
   , userMap: store.user.byId
   , clientUserMap: store.clientUser.byId
 }
}

export default withRouter(
    connect(
    mapStoreToProps
  )(ClientUserList)
);
