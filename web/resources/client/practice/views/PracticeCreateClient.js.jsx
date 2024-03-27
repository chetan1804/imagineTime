/**
 * View component for /firm/:firmId/clients/new
 *
 * Creates a new client from a copy of the defaultItem in the client reducer
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { history, withRouter } from 'react-router-dom';

// import third-party libraries
import _ from 'lodash';
const async = require('async');

// import actions
import * as clientActions from '../../clientActions';
import * as firmActions from '../../../firm/firmActions';
import * as staffActions from '../../../staff/staffActions';
import * as staffClientActions from '../../../staffClient/staffClientActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import Modal from '../../../../global/components/modals/Modal.js.jsx';
import { filterUtils, permissions, routeUtils } from '../../../../global/utils';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';

// import resource components
import PracticeClientForm from '../components/PracticeClientForm.js.jsx';


class PracticeCreateClient extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      client: {}
      // NOTE: We don't want to actually change the store's defaultItem, just use a copy
      , message: ''
      /**
       * NOTE: formHelpers are useful for things like radio controls and other
       * things that manipulate the form, but don't directly effect the state of
       * the client
       */
      , staffClient: _.cloneDeep(this.props.defaultStaffClient.obj)
      , selectedStaffIds: [null]
      , setNotification: false
      , staffNotification: {
        sN_upload: true
        , sN_viewed: true
        , sN_downloaded: true
        , sN_leaveComment: true
        , sN_sendMessage: true
        , sN_viewSignatureRequest: true
        , sN_signingCompleted: true
        , sN_autoSignatureReminder: true
      }
    }
    this._bind(
      '_handleFormChange'
      , '_handleFormSubmit'
      , '_handleExistingClient'
      , '_handleSelectStaff'
      , '_handleAddNewStaff'
      , '_handleNotificationChange'
    );
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    // dispatch(clientActions.fetchDefaultClient()).then(json => console.log('debug1', json));
    dispatch(clientActions.fetchListIfNeeded('engagement-types', match.params.firmId));
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchStaffLoggedInByFirmIfNeeded(match.params.firmId));
    dispatch(staffActions.fetchListIfNeeded('_firm', match.params.firmId));
    dispatch(userActions.fetchListIfNeeded('_firm', match.params.firmId)); // fetches contacts 
    dispatch(userActions.fetchListIfNeeded('_firmStaff', match.params.firmId)); // fetches staff
    dispatch(staffClientActions.fetchDefaultStaffClient());
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({newState, message: "" });
  }

  _handleNotificationChange(name, value) {
    let newState = _.update(this.state, name, () => {
      return value;
    });
    this.setState({ newState, message: "" });
  }
  
  _handleFormSubmit(e) {
    console.log('submit', this.state);
    const { dispatch, history, match, staffMap } = this.props;
    const { client, selectedStaffIds, staffNotification } = this.state;

    const newClient = {
      ...client
      , _firm: match.params.firmId
    };

    dispatch(clientActions.sendCreateClient(newClient)).then(clientRes => {
      if(clientRes && clientRes.success) {

        dispatch(clientActions.addClientToList(clientRes.item, ...['_firm', match.params.firmId, 'status', 'visible']));

        if (selectedStaffIds && selectedStaffIds.length && selectedStaffIds[0]) {
          const selectedStaffs = selectedStaffIds.flatMap(item => item ? [staffMap[item]] : []);
          const newStaffClients = {
            clientIds: [clientRes.id]
            , firmId: match.params.firmId
            , selectedStaffs
            , staffNotification
          }
  
          dispatch(staffClientActions.sendCreateMultipleStaffClient(newStaffClients)).then(json => {
            if (json && json.success && json.list && json.list.length) {
              async.map(json.list, (item, cb) => {
                dispatch(staffClientActions.addSingleStaffClientToMap(item));
                dispatch(staffClientActions.addStaffClientToList(item, ...['_client', item._client]));
                cb();
              }, (err) => {
                if (!err) {
                  history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
                }
              });
            } else {
              history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
            }
          })
        } else {
          history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
        }

      } else {
        if (clientRes.item) {
          this.setState({ message: clientRes.item, setNotification: false });
        } else {
          this.setState({ message: clientRes.error, setNotification: false });
        }
        // alert("ERROR - Check logs " + (clientRes.message || ""));
      }
    });
  }

  _handleExistingClient(action, existingClient) {
    const { dispatch, history, match, staffMap } = this.props;
    const { selectedStaffIds, staffNotification } = this.state;
    let newClient = _.cloneDeep(existingClient);

    if (action === "createNew") {
      const sendData = {
        name: existingClient.name
        , _firm: match.params.firmId
      } 
      // create client
      dispatch(clientActions.sendCreateExistingClient(sendData)).then(clientRes => {
        if (clientRes.success) {
          dispatch(clientActions.addClientToList(clientRes.item, ...['_firm', match.params.firmId, 'status', 'visible']));
          if (selectedStaffIds && selectedStaffIds.length && selectedStaffIds[0]) {
            const selectedStaffs = selectedStaffIds.flatMap(item => item ? [staffMap[item]] : []);
            const newStaffClients = {
              clientIds: [clientRes.id]
              , firmId: match.params.firmId
              , selectedStaffs
              , staffNotification
            }
            dispatch(staffClientActions.sendCreateMultipleStaffClient(newStaffClients)).then(json => {
              if (json && json.success && json.list && json.list.length) {
                async.map(json.list, (item, cb) => {
                  dispatch(staffClientActions.addSingleStaffClientToMap(item));
                  dispatch(staffClientActions.addStaffClientToList(item, ...['_client', item._client]));
                  cb();
                }, (err) => {
                  if (!err) {
                    history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
                  }
                });
              } else {
                history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
              }
            })
          } else {
            history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
          }
        } else {
          this.setState({ message: clientRes.error });
        }
      })
    } else {
      newClient.status = "visible";
      dispatch(clientActions.sendUpdateClient(newClient)).then(clientRes => {
        if (clientRes.success) {
          dispatch(clientActions.addClientToList(clientRes.item, ...['_firm', match.params.firmId, 'status', 'visible']));
          if (selectedStaffIds && selectedStaffIds.length && selectedStaffIds[0]) {
            const selectedStaffs = selectedStaffIds.flatMap(item => item ? [staffMap[item]] : []);
            const newStaffClients = {
              clientIds: [clientRes.id]
              , firmId: match.params.firmId
              , selectedStaffs
              , staffNotification
            }
            dispatch(staffClientActions.sendCreateMultipleStaffClient(newStaffClients)).then(json => {
              if (json && json.success && json.list && json.list.length) {
                async.map(json.list, (item, cb) => {
                  dispatch(staffClientActions.addSingleStaffClientToMap(item));
                  dispatch(staffClientActions.addStaffClientToList(item, ...['_client', item._client]));
                  cb();
                }, (err) => {
                  if (!err) {
                    history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
                  }
                });
              } else {
                history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
              }
            })
          } else {
            history.push(`/firm/${match.params.firmId}/clients/${clientRes.id}/contacts`);
          }
        } else {
          this.setState({ message: clientRes.error });
        }
      });            
    }
  }

  _handleSelectStaff(e) {
    console.log('staff1', e)
    const availableStaff = _.cloneDeep(this.props.availableStaff);
    const index = e.target.name;
    const value = e.target.value;
    let selectedStaffIds = _.cloneDeep(this.state.selectedStaffIds);
    selectedStaffIds[index] = value;

    // remove selected dropdown
    if (!value) {
      selectedStaffIds.splice(index, 1);
    }

    // add new selected dropdown
    if (availableStaff && selectedStaffIds && selectedStaffIds.length && selectedStaffIds[selectedStaffIds.length -1] && selectedStaffIds.length < availableStaff.length) {
      console.log('iStrue')
      selectedStaffIds.push(null);
    }
    
    this.setState({ selectedStaffIds });
  }

  _handleAddNewStaff() {
    const selectedStaffIds = _.cloneDeep(this.state.selectedStaffIds);
    selectedStaffIds.push(null);
    this.setState({ selectedStaffIds });
  }

  render() {
    const { 
      firmStore
      , location
      , match 
      , staffClientStore
      , staffStore
      , userStore
      , availableStaff
      , clientStore
    } = this.props;

    const { 
      client
      , message
      , staffClient
      , selectedStaffIds
      , setNotification
      , staffNotification
    } = this.state;

    const selectedFirm = firmStore.selected.getItem();
    const formHelpers = clientStore.formHelpers;

    const isEmpty = (
      !client 
      || firmStore.selected.didInvalidate
      || !selectedFirm
      || !selectedFirm._id
      || staffStore.selected.didInvalidate
      || userStore.selected.didInvalidate
      // || !staffClient
    );

    const isFetching = (
      firmStore.selected.isFetching
      || staffStore.selected.isFetching
      || userStore.selected.isFetching
      // || !staffClient
    )

    return (
      <PracticeLayout>
        <div className="-practice-subnav">
          <div className="yt-container fluid">
            <div className="yt-row center-vert space-between">
              <Breadcrumbs links={location.state.breadcrumbs} />
            </div>
          </div>
        </div>
        { isEmpty ?
          (isFetching ? 
            <div className="-loading-hero hero">
              <div className="u-centerText">
                <div className="loading"></div>
              </div>
            </div>  
            : 
            <h2>Empty.</h2>
          )
          :
          <Modal
            isOpen={true}
            closeAction={() => this.props.history.goBack()}
            cardSize="standard"
            showButtons={false}
            modalHeader="New client"
          >
            <PracticeClientForm
              client={client}
              cancelLink={`/firm/${match.params.firmId}/clients`}
              formHelpers={formHelpers}
              formTitle="Create Client"
              formType="create"
              handleFormChange={this._handleFormChange}
              handleFormSubmit={this._handleFormSubmit}
              message={message}
              handleExistingClient={this._handleExistingClient}
              staffListItems={availableStaff}
              // selected={this.state.staffClient._staff}
              handleSelectStaff={this._handleSelectStaff}
              handleAddNewStaff={this._handleAddNewStaff}
              selectedStaffIds={selectedStaffIds}
              handleSetNotification={() => this.setState({ setNotification: !setNotification })}
              setNotification={setNotification}
              staffNotification={staffNotification}
              handleNotificationChange={this._handleNotificationChange}
            />
          </Modal>
        }
      </PracticeLayout>
    )
  }
}

PracticeCreateClient.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store, props) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */

  // manipulate store items here
  const staffListItems = store.staff.util.getList('_firm', props.match.params.firmId);
  const userMap = store.user.byId;
  const availableStaff = !staffListItems && userMap && !userMap.length ? [] : staffListItems.filter(staff => {
    if (staff && staff.status === 'active' && userMap && userMap[staff._user]) {
      let item = staff;
      let fullName = userMap[staff._user] ? `${userMap[staff._user].firstname} ${userMap[staff._user].lastname}` : '';
      let userName = userMap[staff._user] ? userMap[staff._user].username : '';
      item.displayName = `${fullName} | ${userName}`;
      return item;
    }
  });

  console.log('availableStaff', availableStaff)

  return {
    clientStore: store.client 
    , firmStore: store.firm
    , userStore: store.user 
    , staffClientStore: store.staffClient
    , staffStore: store.staff
    , defaultStaffClient: store.staffClient.defaultItem
    , socket: store.user.socket
    , availableStaff
    , staffMap: store.staff.byId
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeCreateClient)
);
