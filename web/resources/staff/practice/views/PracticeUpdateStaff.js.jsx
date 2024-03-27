/**
 * View component for /firms/:firmId/settings/staff/:staffId/update
 *
 * Allows staff owner to update staff permission.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import PracticeStaffForm from '../components/PracticeStaffForm.js.jsx';

class PracticeUpdateStaff extends Binder {
  constructor(props) {
    super(props);
    const { match, staffStore } = this.props;
    this.state = {
      formHelpers: {}
      , staff: staffStore.byId[match.params.staffId] ? _.cloneDeep(staffStore.byId[match.params.staffId]) : {}
      , submitting: false
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleToggleESigAccess'
      , '_handleCreateApiUser'
    )
  }

  componentDidMount() {
    const { dispatch, loggedInUser, match } = this.props;
    dispatch(firmActions.fetchListIfNeeded('_user', loggedInUser._id));
    // If the user is an admin viewing this account as a firm owner the above fetch will not return the firm.
    // Add a second fetch just in case.
    if(loggedInUser.admin) {
      dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    }
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId))
    dispatch(staffActions.fetchSingleIfNeeded(match.params.staffId)).then(staffRes => {
      if(staffRes.success) {
        this.setState({
          staff: _.cloneDeep(staffRes.item)
        })
      }
    });
  }

  _handleFormChange(e) {
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });

    console.log(e.target.name);

    if(e.target.name == 'staff.eSigEmail') {
      newState = {...newState, 
        staff: {...newState.staff, 
          eSigAccess: false,
          apiKey: '',
          apiUsername: ''
        }
      }
    }

    this.setState(newState)
  }

  _handleFormSubmit(e) {
    const { dispatch, history, match } = this.props;
    e.preventDefault();
    dispatch(staffActions.sendUpdateStaff(this.state.staff)).then(staffRes => {
      if(staffRes.success) {
        history.push(`/firm/${match.params.firmId}/settings/staff`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  _handleToggleESigAccess() {
    const { dispatch, match, staffStore } = this.props;
    let { staff } = this.state
    staff.eSigAccess = !staff.eSigAccess

    if(staff.eSigAccess && (!staff.apiKey || !staff.apiUsername)) {
      this.setState({
        submitting: true
      });

      const data = {
        staffId: match.params.staffId,
        eSigEmail: staff.eSigEmail
      }
      
      // If they have no credentials then this is the first time granting e-signature access. We'll need to create the api credentials.
      dispatch(staffActions.sendCreateESigCredentials(data)).then(staffRes => {
        console.log('staffRes', staffRes);
        if(staffRes.success) {
          this.setState({
            staff: _.cloneDeep(staffRes.item)
            , submitting: false
          })
        } else {
          console.log('this.state.originalStaf', this.state.originalStaff);
          this.setState({
            staff: _.cloneDeep(staffRes.item)
            , submitting: false
          })
          alert(staffRes.error || "There was a problem creating e-signature credentials.", "Please contact support.") 
        }
      })
    } else {
      // staff already has api credentials so we'll just update the eSigAccess boolean.
      dispatch(staffActions.sendUpdateStaff(staff)).then(staffRes => {
        if(staffRes.success) {
          this.setState({
            staff: _.cloneDeep(staffRes.item)
            , submitting: false
          })
        } else {
          this.setState({
            staff: _.cloneDeep(staffStore.byId[match.params.staffId])
            , submitting: false
          })
          alert("ERROR - Could not update E-signature access. Please refresh and try again.")
        }
      })
    }
  }
  
  _handleCreateApiUser() {
    const { dispatch, match, staffStore } = this.props;
    let { staff } = this.state

    this.setState({
      submitting: true
    });

    const data = {
      staffId: match.params.staffId,
      eSigEmail: staff.eSigEmail,
      reAddUser: true
    }

    dispatch(staffActions.sendCreateESigCredentials(data)).then(staffRes => {
      console.log('staffRes', staffRes);
      if(staffRes.success) {
        this.setState({
          staff: _.cloneDeep(staffRes.item)
          , submitting: false
        })
        alert('Successfully verified the staff');
      } else {
        console.log('this.state.originalStaf', this.state.originalStaff);
        this.setState({
          staff: _.cloneDeep(staffRes.item)
          , submitting: false
        })
        alert(staffRes.error || "There was a problem creating e-signature credentials.", "Please contact support.") 
      }
    })
  }

  render() {
    const {
      location
      , loggedInUser
      , firmStore
      , match
      , staffStore
      , userStore
    } = this.props;

    const selectedStaff = staffStore.selected.getItem();
    const selectedUser = selectedStaff && selectedStaff._user ? userStore.byId[selectedStaff._user] : null
    // Choose selected firm based on the type of user that's logged in.
    const selectedFirm = loggedInUser && loggedInUser.admin ? firmStore.selected.getItem() : firmStore.byId[match.params.firmId];

    const isEmpty = (
      staffStore.selected.didInvalidate
      || !selectedStaff
      || !selectedStaff._id
      || !selectedUser
      || !selectedUser._id
    );

    const isFetching = (
      !selectedStaff
      || staffStore.selected.isFetching
      || !selectedUser
      || this.state.submitting
    )

    return (
      <PracticeLayout>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
              <div className="-btns dropdown">
              </div>
            </div>
          </div>
        </div>
        <div className="yt-container fluid">
        <h1>Update Staff</h1>
        <hr/>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <h2>Empty.</h2>
          )
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <PracticeStaffForm
              cancelLink={`/firm/${match.params.firmId}/settings/staff`}
              firm={selectedFirm}
              formHelpers={this.state.formHelpers}
              formType="update"
              formTitle="Update Staff"
              handleFormChange={this._handleFormChange}
              handleFormSubmit={this._handleFormSubmit}
              staff={this.state.staff}
              submitting={this.state.submitting}
              toggleESigAccess={this._handleToggleESigAccess}
              handleCreateApiUser={this._handleCreateApiUser}
              user={selectedUser}
            />
          </div>
        }
        </div>
      </PracticeLayout>
    )
  }
}

PracticeUpdateStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  return {
    loggedInUser: store.user.loggedIn.user
    , firmStore: store.firm
    , staffStore: store.staff
    , userStore: store.user
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeUpdateStaff)
);
