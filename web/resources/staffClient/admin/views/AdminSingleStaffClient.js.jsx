/**
 * View component for /admin/staff-clients/:staffClientId
 *
 * Displays a single staffClient from the 'byId' map in the staffClient reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as staffClientActions from '../../staffClientActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminStaffClientLayout from '../components/AdminStaffClientLayout.js.jsx';


class AdminSingleStaffClient extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(staffClientActions.fetchSingleIfNeeded(match.params.staffClientId));
  }

  render() {
    const { location, staffClientStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual staffClient object from the map
     */
    const selectedStaffClient = staffClientStore.selected.getItem();

    const isEmpty = (
      !selectedStaffClient
      || !selectedStaffClient._id
      || staffClientStore.selected.didInvalidate
    );

    const isFetching = (
      staffClientStore.selected.isFetching
    )

    return (
      <AdminStaffClientLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Staff Client </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedStaffClient.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the StaffClient would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Staff Client </Link>
          </div>
        }
      </AdminStaffClientLayout>
    )
  }
}

AdminSingleStaffClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    staffClientStore: store.staffClient
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleStaffClient)
);
