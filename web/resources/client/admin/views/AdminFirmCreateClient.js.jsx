/**
 * View component for /admin/clients/new
 *
 * Creates a new client from a copy of the defaultItem in the client reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
import { Helmet } from 'react-helmet';

// import actions
import * as clientActions from '../../clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as fileActions from '../../../file/fileActions'; 

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';

// import resource components
import AdminClientForm from '../components/AdminClientForm.js.jsx';
import AdminClientLayout from '../components/AdminClientLayout.js.jsx';
import routeUtils from '../../../../global/utils/routeUtils';

class AdminFirmCreateClient extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      client: _.cloneDeep(this.props.defaultClient.obj)
      , file: null 
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , formHelpers: {
        // _userIds: []
        firmId: this.props.match.params.firmId
      }
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the client
       */
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleFileSelect'
      , '_sendCreateClient'
    );
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(clientActions.fetchDefaultClient());
    dispatch(firmActions.fetchListIfNeeded('all'));
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      client: _.cloneDeep(nextProps.defaultClient.obj)
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

  _handleFileSelect(e) {
    let newState = _.cloneDeep(this.state); 
    newState.file = e; 
    this.setState(newState); 
  }


  _handleFormSubmit(e) {
    const { dispatch, history } = this.props;
    e.preventDefault();
    let newClient = {...this.state.client};
    if(this.state.formHelpers.firmId) {
      newClient._firm = this.state.formHelpers.firmId;
    }
    if(this.state.file) {
      let fileList = [this.state.file];
      let formData = new FormData()
      Object.keys(fileList).forEach(key => {
        const file = fileList[key];
        formData.append(key, new Blob([file], { type: file.type }), file.name || 'file')
      })
      dispatch(fileActions.sendCreateFiles(formData)).then(fileRes => {
        if(fileRes.success && fileRes.files[0]) {
          newClient.logoUrl = fileRes.files[0].rawUrl; // needs to be changed to local path for file 
          this._sendCreateClient(newClient); 
        }
      })
    } else {
      this._sendCreateClient(newClient); 
    }
  }

  _sendCreateClient(newClient) {
    const { dispatch, history } = this.props; 
    dispatch(clientActions.sendCreateClient(newClient)).then(clientRes => {
      if(clientRes.success) {
        dispatch(clientActions.invalidateList());
        if(this.state.formHelpers.firmId) {
          dispatch(clientActions.invalidateList('_firm', this.state.formHelpers.firmId));
          history.push(`/admin/firms/${this.state.formHelpers.firmId}`)
        } else {
          history.push(`/admin/clients/${clientRes.item._id}`)
        }
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { 
      firmStore
      , location
      , match 
    } = this.props;

    const { client, formHelpers } = this.state;
    const isEmpty = (!client);

    const firmList = firmStore.lists ? firmStore.lists.all : null;
    const firmListItems = firmStore.util.getList("all");

    const firmsEmpty = (
      !firmListItems
      || !firmList
    );

    const firmsFetching = (
      !firmListItems
      || !firmList
      || firmList.isFetching
    )

    return (
      <AdminClientLayout>
        <Helmet> 
          <title>Create Client</title>
        </Helmet>
        <Breadcrumbs links={location.state.breadcrumbs} />
        { isEmpty ?
          <h2> Loading...</h2>
          :
          <AdminClientForm
            client={client}
            cancelLink={formHelpers.firmId ? `/admin/firms/${formHelpers.firmId}` : "/admin/clients"}
            firms={firmListItems}
            formHelpers={formHelpers}
            formTitle="Create Client"
            formType="create"
            handleFormChange={this._handleFormChange}
            handleFormSubmit={this._handleFormSubmit}
            handleFileSelect={this._handleFileSelect}
          />
        }
      </AdminClientLayout>
    )
  }
}

AdminFirmCreateClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here

  return {
    defaultClient: store.client.defaultItem
    , firmStore: store.firm
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(AdminFirmCreateClient)
);
