/**
 * View component for /admin/client-users/:clientUserId
 *
 * Displays a single clientUser from the 'byId' map in the clientUser reducer
 * as defined by the 'selected' property
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


class AdminSingleClientUser extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(clientUserActions.fetchSingleIfNeeded(match.params.clientUserId));
  }

  render() {
    const { location, clientUserStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual clientUser object from the map
     */
    const selectedClientUser = clientUserStore.selected.getItem();

    const isEmpty = (
      !selectedClientUser
      || !selectedClientUser._id
      || clientUserStore.selected.didInvalidate
    );

    const isFetching = (
      clientUserStore.selected.isFetching
    )

    return (
      <AdminClientUserLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Client User </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedClientUser.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ClientUser would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Client User </Link>
          </div>
        }
      </AdminClientUserLayout>
    )
  }
}

AdminSingleClientUser.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    clientUserStore: store.clientUser
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleClientUser)
);
