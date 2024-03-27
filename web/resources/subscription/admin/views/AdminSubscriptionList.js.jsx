/**
 * View component for /admin/subscriptions
 *
 * Generic subscription list view. Defaults to 'all' with:
 * this.props.dispatch(subscriptionActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
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
import AdminSubscriptionListItem from '../components/AdminSubscriptionListItem.js.jsx';

class SubscriptionList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(subscriptionActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, subscriptionStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the subscriptionList meta info here so we can reference 'isFetching'
    const subscriptionList = subscriptionStore.lists ? subscriptionStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual subscription objetcs
     */
    const subscriptionListItems = subscriptionStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !subscriptionListItems
      || !subscriptionList
    );

    const isFetching = (
      !subscriptionListItems
      || !subscriptionList
      || subscriptionList.isFetching
    )

    return (
      <AdminSubscriptionLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Subscription List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/subscriptions/new'}> New Subscription</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionListItems.map((subscription, i) =>
                    <AdminSubscriptionListItem key={subscription._id + i} subscription={subscription} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminSubscriptionLayout>
    )
  }
}

SubscriptionList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    subscriptionStore: store.subscription
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(SubscriptionList)
);
