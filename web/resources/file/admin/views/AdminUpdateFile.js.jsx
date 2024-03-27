/**
 * View component for /admin/files/:fileId/update
 *
 * Updates a single file from a copy of the selcted file
 * as defined in the file reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';

// import actions
import * as fileActions from '../../fileActions';
import * as tagActions from '../../../tag/tagActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminFileForm from '../components/AdminFileForm.js.jsx';
import AdminFileLayout from '../components/AdminFileLayout.js.jsx';

class AdminUpdateFile extends Binder {
  constructor(props) {
    super(props);
    const { match, fileStore } = this.props;
    this.state = {
      file: fileStore.byId[match.params.fileId] ?  _.cloneDeep(fileStore.byId[match.params.fileId]) : {}
      // NOTE: ^ we don't want to change the store, just make changes to a copy
      , formHelpers: {}
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the file
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(fileActions.fetchSingleIfNeeded(match.params.fileId))
    dispatch(tagActions.fetchListIfNeeded('_firm', 'null'))
  }

  componentWillReceiveProps(nextProps) {
    const { match, fileStore } = nextProps;
    this.setState({
      file: fileStore.byId[match.params.fileId] ?  _.cloneDeep(fileStore.byId[match.params.fileId]) : {}
      // NOTE: ^ we don't want to actually change the store's file, just use a copy
    })
  }

  _handleFormChange(e) {
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }

  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(fileActions.sendUpdateFile(this.state.file)).then(fileRes => {
      if(fileRes.success) {
        history.push(`/admin/files/${fileRes.item._id}`)
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const {
      location
      , match
      , fileStore
      , tagStore
    } = this.props;
    const { file, formHelpers } = this.state;

    const selectedFile = fileStore.selected.getItem();
    const tags = tagStore.util.getList('_firm', 'null') || []

    const isEmpty = (
      !file
      || !file._id
    );

    const isFetching = (
      !fileStore.selected.id
      || fileStore.selected.isFetching
    )

    return  (
      <AdminFileLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
          :
          <AdminFileForm
            file={file}
            cancelLink={`/admin/files/${file._id}`}
            formHelpers={formHelpers}
            formTitle="Update File Tags"
            formType="update"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            tags={tags}
          />
        }
      </AdminFileLayout>
    )
  }
}

AdminUpdateFile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  return {
    fileStore: store.file
    , tagStore: store.tag

  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminUpdateFile)
);
