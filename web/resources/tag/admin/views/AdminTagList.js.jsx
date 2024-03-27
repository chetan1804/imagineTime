/**
 * View component for /admin/tags
 *
 * Generic tag list view. Defaults to 'all' with:
 * this.props.dispatch(tagActions.fetchListIfNeeded());
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
import * as tagActions from '../../tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminTagLayout from '../components/AdminTagLayout.js.jsx';
import AdminTagListItem from '../components/AdminTagListItem.js.jsx';

class TagList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(tagActions.fetchListIfNeeded('_firm', 'null'));
  }

  render() {
    const { location, tagStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the tagList meta info here so we can reference 'isFetching'
    const tagList = tagStore.util.getListInfo('_firm', 'null');

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual tag objetcs
     */
    const tagListItems = tagStore.util.getList('_firm', 'null');

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !tagListItems
      || !tagList
    );

    const isFetching = (
      !tagListItems
      || !tagList
      || tagList.isFetching
    )

    return (
      <AdminTagLayout>
        <Helmet><title>Admin Tag List</title></Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> Tag List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/tags/new'}> New Tag</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tagListItems.map((tag, i) =>
                    <AdminTagListItem key={tag._id + i} tag={tag} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminTagLayout>
    )
  }
}

TagList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    tagStore: store.tag
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(TagList)
);
