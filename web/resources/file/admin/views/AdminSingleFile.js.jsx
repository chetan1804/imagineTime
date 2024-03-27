/**
 * View component for /admin/files/:fileId
 *
 * Displays a single file from the 'byId' map in the file reducer
 * as defined by the 'selected' property
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


class AdminSingleFile extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(fileActions.fetchSingleIfNeeded(match.params.fileId));
  }

  render() {
    const { location, fileStore } = this.props;

    /**
     * use the selected.getItem() utility to pull the actual file object from the map
     */
    const selectedFile = fileStore.selected.getItem();

    const isEmpty = (
      !selectedFile
      || !selectedFile._id
      || fileStore.selected.didInvalidate
    );

    const isFetching = (
      fileStore.selected.isFetching
    )

    return (
      <AdminFileLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        <h3> Single File </h3>
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> { selectedFile.name }
            </h1>
            <hr/>
            <p> <em>Other characteristics about the File would go here.</em></p>
            <br/>
            <Link to={`${this.props.match.url}/update`}> Update File </Link>
          </div>
        }
      </AdminFileLayout>
    )
  }
}

AdminSingleFile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    fileStore: store.file
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminSingleFile)
);
