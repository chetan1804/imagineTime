/**
 * View component for /admin/staff/new
 *
 * Creates a new staff from a copy of the defaultItem in the staff reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet'; 

// import actions
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../staffActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffForm from '../components/AdminStaffForm.js.jsx';
import AdminStaffLayout from '../components/AdminStaffLayout.js.jsx';

// import utils 
import { routeUtils } from '../../../../global/utils';

class AdminCreateStaff extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      staff: _.cloneDeep(this.props.defaultStaff.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        firmId: this.props.location.search ? routeUtils.objectFromQueryString(this.props.location.search)['firm'] : null 
      }
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the staff
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(firmActions.fetchListIfNeeded('all'));
    dispatch(staffActions.fetchDefaultStaff());
    dispatch(userActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      staff: _.cloneDeep(nextProps.defaultStaff.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    let newStaff = {...this.state.staff}
    if(this.state.formHelpers.firmId) {
      newStaff._firm = parseInt(this.state.formHelpers.firmId);
    }
    dispatch(staffActions.sendCreateStaff(newStaff)).then(staffRes => {
      if(staffRes.success) {
        dispatch(staffActions.invalidateList());
        if(this.state.formHelpers.firmId) {
          dispatch(staffActions.invalidateList('_firm', this.state.formHelpers.firmId));
          history.push(`/admin/firms/${this.state.formHelpers.firmId}`);
        } else {
          history.push(`/admin/staff/${staffRes.item._id}`);
        }
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { 
      firmStore
      , location
      , match 
      , userStore 
    } = this.props;
    const { staff, formHelpers } = this.state;
    const isEmpty = (!staff);

    const firmList = firmStore.lists ? firmStore.lists.all : null;
    const firmListItems = firmStore.util.getList("all");

    console.log("FORM HELPERS", formHelpers, firmListItems)


    const firmsEmpty = (
      !firmListItems
      || !firmList
    );

    const firmsFetching = (
      !firmListItems
      || !firmList
      || firmList.isFetching
    )

    const userList = userStore.lists ? userStore.lists.all : null;
    const userListItems = userStore.util.getList("all");

    const usersEmpty = (
      !userListItems
      || !userList
    );

    const usersFetching = (
      !userListItems
      || !userList
      || userList.isFetching
    )
    return (
      <AdminStaffLayout>
        <Helmet><title>Admin Create Staff</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminStaffForm
            cancelLink={formHelpers.firmId ? `/admin/firms/${formHelpers.firmId}` : '/admin/staff'}
            firms={firmListItems}
            formHelpers={formHelpers}
            formTitle="Create Staff"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            staff={staff}
            users={userListItems}
          />
        }
      </AdminStaffLayout>
    )
  }
}

AdminCreateStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultStaff: store.staff.defaultItem
    , firmStore: store.firm
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateStaff)
);
