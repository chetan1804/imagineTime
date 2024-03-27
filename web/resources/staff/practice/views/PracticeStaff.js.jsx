/**
 * View component for /firms/:firmId/settings/staff
 *
 * Displays a single firm from the 'byId' map in the firm reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// import actions
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../staffActions';
import * as subscriptionActions from '../../../subscription/subscriptionActions';
import * as userActions from '../../../user/userActions';

// import global components
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';
import brandingName from '../../../../global/enum/brandingName.js.jsx';

// import resource components
import InviteStaffModal from '../../../staff/components/InviteStaffModal.js.jsx';
import PracticeFirmLayout from '../../../firm/practice/components/PracticeFirmLayout.js.jsx';
import PracticeStaffList from '../components/PracticeStaffList.js.jsx';
import PracticeStaffQuickView from './PracticeStaffQuickView.js.jsx';
import NewStaffOptionMenu from '../../components/NewStaffOptionMenu.js.jsx';

import classNames from 'classnames';

class PracticeStaff extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      addLicensesModal: false 
      , inviteModalOpen: false 
      , page: 1
      , per: 50
      , query: ''
      , staffListArgsObj: {
        '_firm': props.match.params.firmId
      }
      , optionMenu: false
      , mobileOptionMenu: false
    }
    this._bind(
      '_handleSetFilter'
      , '_handleSetPagination'
      , '_setPerPage'
      , '_closeDropdowns'
    )
  }

  componentDidMount() {
    const { dispatch, match, location } = this.props;
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId))
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId))
    dispatch(subscriptionActions.fetchListIfNeeded('_firm', match.params.firmId));
    const query = new URLSearchParams(location.search);
    const page = query.get('page')
    const perPage = query.get('per')
    if (page) {
      setTimeout(() => {
        this._handleSetPagination({page: page, per: perPage});
      }, 500)
    } else {
      this._handleSetPagination({page: 1, per: 50});
    }
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
  }

  componentDidUpdate(prevProps, prevState) {
    // catch for state change and re-fetch file list if it happens
    // compare computed listArgs object
    if(routeUtils.listArgsFromObject(prevState.staffListArgsObj) !== routeUtils.listArgsFromObject(this.state.staffListArgsObj)) {
      this.props.dispatch(staffActions.fetchListIfNeeded(...routeUtils.listArgsFromObject(this.state.staffListArgsObj)))
    }
  }

  _closeDropdowns() {
    this.setState({ optionMenu: false });
  }

  _handleSetFilter(e) {
    console.log('Set filter ', e);
    
    // let nextStaffListArgsObj = { ...this.state.staffListArgsObj }
    // nextStaffListArgsObj[e.target.name] = e.target.value;
    // this.setState({ staffListArgsObj: nextStaffListArgsObj }
    // , () => this._handleSetPagination({page: 1, per: this.state.per})
    // )
  }

  _handleSetPagination(newPagination) {
    const { dispatch } = this.props;
    dispatch(staffActions.setPagination(newPagination, ...routeUtils.listArgsFromObject(this.state.staffListArgsObj)));
  }

  _setPerPage(per) {
    var newPagination = {}
    newPagination.per = parseInt(per);
    newPagination.page = 1;
    this._handleSetPagination(newPagination)
    this.setState({per: newPagination.per});
  }

  render() {
    const { 
      firmStore
      , location
      , match
      , staffStore 
      , subscriptionStore
      , userMap
    } = this.props;

    const {
      optionMenu
      , mobileOptionMenu
    } = this.state;

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */
    const selectedFirm = firmStore.selected.getItem();
    const staffList = staffStore && staffStore.lists && staffStore.lists._firm && staffStore.lists._firm[match.params.firmId] ? staffStore.lists._firm[match.params.firmId] : null
    const staffListItems = staffStore.util.getList(...routeUtils.listArgsFromObject(this.state.staffListArgsObj));
    const filteredStaffListItems = staffListItems ? staffListItems.filter(data => data !== undefined) : [];

    const isEmpty = (
      !selectedFirm
      || !selectedFirm._id
      || firmStore.selected.didInvalidate
      || !staffList
      || !filteredStaffListItems
    );

    const isFetching = (
      firmStore.selected.isFetching
      || !staffList
      || staffList.isFetching
    )



    const activeStaff = filteredStaffListItems ? filteredStaffListItems.filter(s => s.status === 'active') : [];

    const subscription = selectedFirm && selectedFirm._subscription ? subscriptionStore.byId[selectedFirm._subscription] : null;
   
    let subStatus = classNames(
      'status-pill -subscription'
      , subscription ? subscription.status : null 
    )

    console.log('selectedFirm', selectedFirm);

    return (
      <PracticeFirmLayout>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <CloseWrapper
              isOpen={optionMenu}
              closeAction={this._closeDropdowns}
            />            
            <div className="yt-row -side-content">
              <div className="-member-staff" style={{ display: "none" }}>
                  <p><small>Using {activeStaff.length} of {subscription ? subscription.licenses : 0} available licenses</small></p>
                  <button className="yt-btn link x-small" onClick={() => this.setState({addLicensesModal: true})}><i className="fal fa-user-plus"/> Add licenses</button>
              </div>
              <div className="yt-col _20 -mobile-yt-hide" style={{ float: "right", order: 1 }}>
                <div className="practice-aside">
                  {/* <button className="yt-btn block success x-small" onClick={() => this.setState({inviteModalOpen: true})}>Invite staff</button> */}

                  {!selectedFirm.outward_firm ?
                    <button className="yt-btn block x-small" onClick={() => this.setState({ optionMenu: true }) }>Invite staff
                      <i className="fas fa-caret-down" style={{marginLeft: "0.5em" }}></i>
                    </button>
                    :
                    null
                  }
                  <div className="dropdown">
                    <NewStaffOptionMenu 
                      firmId={match.params.firmId}
                      isOpen={(mobileOptionMenu || optionMenu) && subscription && activeStaff.length < subscription.licenses}
                      handleNewStaff={() => this.setState({ inviteModalOpen: true }) } />                    
                  </div>
                  <br/>
                  <p><small>Using {activeStaff.length} of {subscription ? subscription.licenses : 0} available licenses</small></p>
                  <button className="yt-btn link x-small" onClick={() => this.setState({addLicensesModal: true})}><i className="fal fa-user-plus"/> Add licenses</button>
                </div>
              </div>
              <div className="yt-col _80">
                <PracticeStaffList
                  // allTags={allTags}
                  // selectedTagIds={this.state.staffClientListArgsObj._tags || []}
                  handleFilter={this._handleSetFilter}
                  handleOpenAddStaffModal={() => this.setState({isAddStaffModalOpen: true})}
                  handleQuery={() => console.log('handle query')}
                  handleSetPagination={this._handleSetPagination}
                  handleSort={() => console.log('handle sort')}
                  setPerPage={this._setPerPage}
                  staffListItems={filteredStaffListItems}
                  staffList={staffList}
                  mobileOptionMenu={mobileOptionMenu}
                  handleNewStaff={() => this.setState({ inviteModalOpen: true }, () => console.log("testme???")) }
                  handleOptionMenu={() => this.setState({ mobileOptionMenu: !mobileOptionMenu })}
                  userMap={userMap}
                />
              </div>
            </div>
            <TransitionGroup>
              <CSSTransition
                key={location.key}
                classNames="slide-from-right"
                timeout={300}
              >
                <Switch location={location}>
                  <YTRoute
                    breadcrumbs={[{display: 'Settings', path: `/firm/${match.params.firmId}/settings`}, {display: 'Members', path: `/firm/${match.params.firmId}/settings/staff`}, {display: 'Staff Details', path: null}]}
                    component={PracticeStaffQuickView}
                    exact
                    path="/firm/:firmId/settings/staff/:staffId"
                    login={true}
                  />
                  <Route render={() => <div/>} />
                </Switch>
              </CSSTransition>
            </TransitionGroup>
            <InviteStaffModal
              close={() => this.setState({inviteModalOpen: false})}
              firm={selectedFirm}
              isOpen={this.state.inviteModalOpen && subscription && activeStaff.length < subscription.licenses}
              maxInvites={subscription ? subscription.licenses - activeStaff.length : 0}
            />
            <AlertModal
              alertMessage={<div><p>You have no remaining licenses.</p><p>Please contact <a href={`mailto:${brandingName.email.sale}`}>{brandingName.email.sale}</a> to add more licenses.</p></div> }
              alertTitle="No remaining licenses"
              closeAction={() => this.setState({optionMenu: false, mobileOptionMenu: false})}
              confirmAction={() => this.setState({optionMenu: false, mobileOptionMenu: false})}
              confirmText="Okay"
              isOpen={(mobileOptionMenu || optionMenu) && (!subscription || activeStaff.length >= subscription.licenses)}
              type="danger"
            />
            <AlertModal
              alertMessage={<div><p>Self-managed subscriptions coming soon.</p><p>In the meantime, please contact <a href={brandingName.email.sale}>{brandingName.email.sale}</a> to add more licenses.</p></div> }
              alertTitle="Manage licenses"
              closeAction={() => this.setState({addLicensesModal: false})}
              confirmAction={() => this.setState({addLicensesModal: false})}
              confirmText="Okay"
              isOpen={this.state.addLicensesModal}
              type="warning"
            />
          </div>
        }
      </PracticeFirmLayout>
    )
  }
}

PracticeStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    firmStore: store.firm
    , staffStore: store.staff
    , subscriptionStore: store.subscription
    , userMap: store.user.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeStaff)
);
