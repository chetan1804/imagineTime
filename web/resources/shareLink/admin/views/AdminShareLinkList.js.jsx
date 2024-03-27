/**
 * View component for /admin/share-links
 *
 * Generic shareLink list view. Defaults to 'all' with:
 * this.props.dispatch(shareLinkActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as shareLinkActions from '../../shareLinkActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminShareLinkLayout from '../components/AdminShareLinkLayout.js.jsx';
import AdminShareLinkListItem from '../components/AdminShareLinkListItem.js.jsx';

class AdminShareLinkList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(shareLinkActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, shareLinkStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the shareLinkList meta info here so we can reference 'isFetching'
    const shareLinkList = shareLinkStore.lists ? shareLinkStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual shareLink objetcs
     */
    const shareLinkListItems = shareLinkStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !shareLinkListItems
      || !shareLinkList
    );

    const isFetching = (
      !shareLinkListItems
      || !shareLinkList
      || shareLinkList.isFetching
    )

    return (
      <AdminShareLinkLayout>
        <Helmet><title>Admin Share Link List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Share Link List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/share-links/new'}> New Share Link</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {shareLinkListItems.map((shareLink, i) =>
                    <AdminShareLinkListItem key={shareLink._id + '_' + i} shareLink={shareLink} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminShareLinkLayout>
    )
  }
}

AdminShareLinkList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    shareLinkStore: store.shareLink
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminShareLinkList)
);
