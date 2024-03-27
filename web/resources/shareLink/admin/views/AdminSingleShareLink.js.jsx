/**
 * View component for /admin/share-links/:shareLinkId
 *
 * Displays a single shareLink from the 'byId' map in the shareLink reducer
 * as defined by the 'selected' property
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


class AdminSingleShareLink extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(shareLinkActions.fetchSingleIfNeeded(match.params.shareLinkId));
  }

  render() {
    const { location, shareLinkStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual shareLink object from the map
     */
    const selectedShareLink = shareLinkStore.selected.getItem();

    const isEmpty = (
      !selectedShareLink
      || !selectedShareLink._id
      || shareLinkStore.selected.didInvalidate
    );

    const isFetching = (
      shareLinkStore.selected.isFetching
    )

    return (
      <AdminShareLinkLayout>
        <Helmet><title>Admin Single Share Link</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Share Link </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedShareLink.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the ShareLink would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Share Link </Link>
          </div>
        }
      </AdminShareLinkLayout>
    )
  }
}

AdminSingleShareLink.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    shareLinkStore: store.shareLink
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleShareLink)
);
