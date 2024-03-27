/**
 * View component for /admin/subscriptions/:subscriptionId
 *
 * Displays a single subscription from the 'byId' map in the subscription reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as subscriptionActions from '../../subscriptionActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminSubscriptionLayout from '../components/AdminSubscriptionLayout.js.jsx';


class AdminSingleSubscription extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(subscriptionActions.fetchSingleIfNeeded(match.params.subscriptionId));
  }

  render() {
    const { location, subscriptionStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual subscription object from the map
     */
    const selectedSubscription = subscriptionStore.selected.getItem();

    const isEmpty = (
      !selectedSubscription
      || !selectedSubscription._id
      || subscriptionStore.selected.didInvalidate
    );

    const isFetching = (
      subscriptionStore.selected.isFetching
    )

    return (
      <AdminSubscriptionLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Subscription </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedSubscription.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Subscription would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Subscription </Link>
          </div>
        }
      </AdminSubscriptionLayout>
    )
  }
}

AdminSingleSubscription.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    subscriptionStore: store.subscription
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleSubscription)
);
