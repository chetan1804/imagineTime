/**
 * View component for /admin/client-users
 *
 * Generic clientUser list view. Defaults to 'all' with:
 * this.props.dispatch(clientUserActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as clientUserActions from '../../clientUserActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientUserLayout from '../components/AdminClientUserLayout.js.jsx';
import AdminClientUserListItem from '../components/AdminClientUserListItem.js.jsx';

class ClientUserList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(clientUserActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, clientUserStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the clientUserList meta info here so we can reference 'isFetching'
    const clientUserList = clientUserStore.lists ? clientUserStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual clientUser objetcs
     */
    const clientUserListItems = clientUserStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !clientUserListItems
      || !clientUserList
    );

    const isFetching = (
      !clientUserListItems
      || !clientUserList
      || clientUserList.isFetching
    )

    return (
      <AdminClientUserLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Client User List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/client-users/new'}> New Client User</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clientUserListItems.map((clientUser, i) =>
                    <AdminClientUserListItem key={clientUser._id + i} clientUser={clientUser} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminClientUserLayout>
    )
  }
}

ClientUserList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    clientUserStore: store.clientUser
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(ClientUserList)
);
