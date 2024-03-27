/**
 * View component for /admin/files
 *
 * Generic file list view. Defaults to 'all' with:
 * this.props.dispatch(fileActions.fetchListIfNeeded());
 *
 * NOTE: See /product/views/ProductList.js.jsx for more examples
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

// import actions
import * as fileActions from '../../fileActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminFileLayout from '../components/AdminFileLayout.js.jsx';
import AdminFileListItem from '../components/AdminFileListItem.js.jsx';

class FileList extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // fetch a list of your choice
    this.props.dispatch(fileActions.fetchListIfNeeded('all')); // defaults to 'all'
  }

  render() {
    const { location, fileStore } = this.props;

    /**
     * Retrieve the list information and the list items for the component here.
     *
     * NOTE: if the list is deeply nested and/or filtered, you'll want to handle
     * these steps within the mapStoreToProps method prior to delivering the
     * props to the component.  Othwerwise, the render() action gets convoluted
     * and potentially severely bogged down.
     */

    // get the fileList meta info here so we can reference 'isFetching'
    const fileList = fileStore.lists ? fileStore.lists.all : null;

    /**
     * use the reducer getList utility to convert the all.items array of ids
     * to the actual file objetcs
     */
    const fileListItems = fileStore.util.getList("all");

    /**
     * NOTE: isEmpty is is usefull when the component references more than one
     * resource list.
     */
    const isEmpty = (
      !fileListItems
      || !fileList
    );

    const isFetching = (
      !fileListItems
      || !fileList
      || fileList.isFetching
    )

    return (
      <AdminFileLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h1> File List </h1>
        <hr/>
        <br/>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <div className="admin-table-wrapper">
              <Link to={'/admin/files/new'}> New File</Link>
              <table className="yt-table striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last modified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fileListItems.map((file, i) =>
                    <AdminFileListItem key={file._id + i} file={file} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        }
      </AdminFileLayout>
    )
  }
}

FileList.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    fileStore: store.file
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(FileList)
);
