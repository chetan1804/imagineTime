/**
 * View component for /admin/files/new
 *
 * Creates a new file from a copy of the defaultItem in the file reducer
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

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminFileForm from '../components/AdminFileForm.js.jsx';
import AdminFileLayout from '../components/AdminFileLayout.js.jsx';

class AdminCreateFile extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      file: _.cloneDeep(this.props.defaultFile.obj)
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
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
    const { dispatch } = this.props;
    dispatch(fileActions.fetchDefaultFile());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      file: _.cloneDeep(nextProps.defaultFile.obj)

    })
  }
  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState});
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    dispatch(fileActions.sendCreateFile(this.state.file)).then(fileRes => {
      if(fileRes.success) {
        dispatch(fileActions.invalidateList());
        history.push(`/admin/files/${fileRes.item._id}`)
      } else {
        alert("ERROR: " + result.error)
        // alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { location, match } = this.props;
    const { file, formHelpers } = this.state;
    const isEmpty = (!file || file.name === null || file.name === undefined);
    return (
      <AdminFileLayout>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminFileForm
            file={file}
            cancelLink="/admin/files"
            formHelpers={formHelpers}
            formTitle="Create File"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            />
        }
      </AdminFileLayout>
    )
  }
}

AdminCreateFile.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultFile: store.file.defaultItem
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminCreateFile)
);
