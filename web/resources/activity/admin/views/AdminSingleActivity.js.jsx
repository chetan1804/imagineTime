/**
 * View component for /admin/activities/:activityId
 *
 * Displays a single activity from the 'byId' map in the activity reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as activityActions from '../../activityActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminActivityLayout from '../components/AdminActivityLayout.js.jsx';


class AdminSingleActivity extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(activityActions.fetchSingleIfNeeded(match.params.activityId));
  }

  render() {
    const { location, activityStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual activity object from the map
     */
    const selectedActivity = activityStore.selected.getItem();

    const isEmpty = (
      !selectedActivity
      || !selectedActivity._id
      || activityStore.selected.didInvalidate
    );

    const isFetching = (
      activityStore.selected.isFetching
    )

    return (
      <AdminActivityLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Activity </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedActivity.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Activity would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Activity </Link>
          </div>
        }
      </AdminActivityLayout>
    )
  }
}

AdminSingleActivity.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    activityStore: store.activity
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleActivity)
);
