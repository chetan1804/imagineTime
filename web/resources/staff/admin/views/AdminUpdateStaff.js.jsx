/**
 * View component for /admin/staff/:staffId/update
 *
 * Updates a single staff from a copy of the selcted staff
 * as defined in the staff reducer
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
import * as staffActions from '../../staffActions';
import * as firmActions from '../../../firm/firmActions'; 
import * as userActions from '../../../user/userActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffForm from '../components/AdminStaffForm.js.jsx';
import AdminStaffLayout from '../components/AdminStaffLayout.js.jsx';

// import utils 
import { routeUtils } from '../../../../global/utils';

class AdminUpdateStaff extends Binder {
  constructor(props) {
    super(props);
    const { match, staffStore } = this.props;
    this.state = {
      staff: staffStore.byId[match.params.staffId] ?  _.cloneDeep(staffStore.byId[match.params.staffId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
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
    const { dispatch, match } = this.props;
    dispatch(staffActions.fetchSingleIfNeeded(match.params.staffId)).then(staffRes => {
      // if(staffRes.success) {
      //   this.setState({
      //     formHelpers: {
      //       firmId: staffRes.item._firm
      //     }
      //   })
      // }
    });
    dispatch(firmActions.fetchList('all'));
    dispatch(userActions.fetchList('all')); 
  }

  componentWillReceiveProps(nextProps) {
    const { match, staffStore } = nextProps;
    this.setState({
      staff: staffStore.byId[match.params.staffId] ?  _.cloneDeep(staffStore.byId[match.params.staffId]) : {}
      // NOTE: ^ we don't want to actually change the store's staff, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(staffActions.sendUpdateStaff(this.state.staff)).then(staffRes => {
      if(staffRes.success) {
        history.push(`/admin/staff/${staffRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , staffStore
      , userStore
      , firmStore
    } = this.props;
    const { staff, formHelpers } = this.state;

    const selectedStaff = staffStore.selected.getItem();

    const isEmpty = (
      !staff
      || !staff._id
    );

    const isFetching = (
      !staffStore.selected.id
      || staffStore.selected.isFetching
    )

    const firmList = firmStore.lists ? firmStore.lists.all : null;
    const firmListItems = firmStore.util.getList("all");

    const firmsEmpty = (
      !firmListItems
      || !firmList
    );

    const userList = userStore.lists ? userStore.lists.all : null;
    const userListItems = userStore.util.getList("all");

    return  (
      <AdminStaffLayout>
        <Helmet><title>Admin Update Staff</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminStaffForm
            staff={staff}
            cancelLink={formHelpers.firmId ? `/admin/firms/${formHelpers.firmId}` : `/admin/staff/${staff._id}`}
            formHelpers={formHelpers}
            formTitle="Update Staff"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            user={userStore.byId[staff._user]}
            firm={firmStore.byId[staff._firm]}
          />
        }
      </AdminStaffLayout>
    )
  }
}

AdminUpdateStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    staffStore: store.staff
    , userStore: store.user
    , firmStore: store.firm
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateStaff)
);
