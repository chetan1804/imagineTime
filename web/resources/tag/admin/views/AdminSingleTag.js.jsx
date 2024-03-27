/**
 * View component for /admin/tags/:tagId
 *
 * Displays a single tag from the 'byId' map in the tag reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import { Helmet } from 'react-helmet'; 

// import actions
import * as tagActions from '../../tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminTagLayout from '../components/AdminTagLayout.js.jsx';


class AdminSingleTag extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(tagActions.fetchSingleIfNeeded(match.params.tagId));
  }

  render() {
    const { location, tagStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual tag object from the map
     */
    const selectedTag = tagStore.selected.getItem();

    const isEmpty = (
      !selectedTag
      || !selectedTag._id
      || tagStore.selected.didInvalidate
    );

    const isFetching = (
      tagStore.selected.isFetching
    )

    return (
      <AdminTagLayout>
        <Helmet><title>Admin Single Tag</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single Tag </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedTag.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the Tag would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update Tag </Link>
          </div>
        }
      </AdminTagLayout>
    )
  }
}

AdminSingleTag.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleTag)
);
