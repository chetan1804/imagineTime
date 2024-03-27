/**
 * View component for /admin/staff/:staffId
 *
 * Displays a single staff from the 'byId' map in the staff reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as staffActions from '../../staffActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffLayout from '../components/AdminStaffLayout.js.jsx';


class AdminSingleStaff extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(staffActions.fetchSingleIfNeeded(match.params.staffId));
  }

  render() {
    const { location, staffStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual staff object from the map
     */
    const selectedStaff = staffStore.selected.getItem();

    const isEmpty = (
      !selectedStaff
      || !selectedStaff._id
      || staffStore.selected.didInvalidate
    );

    const isFetching = (
      staffStore.selected.isFetching
    )

    return (
      <AdminStaffLayout>
        <Helmet><title>Admin Single Staff</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Staff </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedStaff.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Staff would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Staff </Link>
          </div>
        }
      </AdminStaffLayout>
    )
  }
}

AdminSingleStaff.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    staffStore: store.staff
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleStaff)
);
