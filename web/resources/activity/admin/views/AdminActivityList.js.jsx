/**
 * View component for /admin/activities
 *
 * Generic activity list view. Defaults to 'all' with:
 * this.props.dispatch(activityActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
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
import AdminActivityListItem from '../components/AdminActivityListItem.js.jsx';

class ActivityList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(activityActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, activityStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the activityList meta info here so we can reference 'isFetching'
    const activityList = activityStore.lists ? activityStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual activity objetcs
     */
    const activityListItems = activityStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !activityListItems
      || !activityList
    );

    const isFetching = (
      !activityListItems
      || !activityList
      || activityList.isFetching
    )

    return (
      <AdminActivityLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Activity List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/activities/new'}> New Activity</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activityListItems.map((activity, i) =>
                    <AdminActivityListItem key={activity._id + i} activity={activity} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminActivityLayout>
    )
  }
}

ActivityList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    activityStore: store.activity
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ActivityList)
);
