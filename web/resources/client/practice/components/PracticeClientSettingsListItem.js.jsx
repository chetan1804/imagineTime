// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Route, Switch, withRouter } from 'react-router-dom';

import _, { uniq } from 'lodash';
import { DateTime } from 'luxon';
import { formatPhoneNumber } from 'react-phone-number-input'

import Binder from '../../../../global/components/Binder.js.jsx';
import { CheckboxInput } from '../../../../global/components/forms/';
import { displayUtils, routeUtils } from '../../../../global/utils';

// import compoents 
import SingleClientOptions from './SingleClientOptions.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';

// import actions
import * as clientActions from '../../clientActions';
import AlertModal from '../../../../global/components/modals/AlertModal.js.jsx';

class PracticeClientSettingsListItem extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      singleClientDropDownOption: false
      , showAlertModal: false
    }

    this._bind(
      '_handleCloseSingleClientOptions'
      , '_setStatus'
      , '_toggleAlertModal'
    )
  }

  _handleCloseSingleClientOptions(e) {
    e.stopPropagation();
    this.setState({ singleClientDropDownOption: false });
  }

  _setStatus(status) {
    const { dispatch, match, client, clientStore, listArgs, handleFetchList } = this.props;
    const clientMap = clientStore && clientStore.byId;
    const newClient = clientMap && clientMap[client._id]; 

    if (status === "visible") {


      // can reinstate archived client list if have a same client name in visible status
      let clients = clientMap ? Object.keys(clientMap) : [];
      clients = clients.filter(clientId => {
        if (clientMap[clientId]) {
          if (clientMap[clientId].status === "visible") {
            let client = clientMap[clientId].name ? clientMap[clientId].name.trim().toLowerCase() : null;
            let compareClient = newClient.name ? newClient.name.trim().toLowerCase() : null;
            if (client && compareClient && client === compareClient) {
              return clientId;
            }  
          }
        }
      });
      
      if (clients && clients.length) {
        this.setState({ showAlertModal: true });
      } else {
        newClient.status = status; 
        dispatch(clientActions.sendUpdateClientStatus(newClient)).then(json => {
          if (json.success && json.id) {
            dispatch(clientActions.removeClientFromList(json.id, ...listArgs));
            dispatch(clientActions.returnClientListPromise(...routeUtils.listArgsFromObject({
                _firm: match.params.firmId
                , status: status
            }))).then(result => {
              if (result.success && result.list) {
                dispatch(clientActions.addClientToList(json.item, ...routeUtils.listArgsFromObject({
                  _firm: match.params.firmId
                  , status: status
                })));
              }
            });
          }
        });
      }
    } else if (status === "forced") {
      this.setState({ showAlertModal: false });
      // newClient.name += " (2)";
      // newClient.status = "visible"; 
      // dispatch(clientActions.sendUpdateClientStatus(newClient));  
    } else {
      newClient.status = status; 
      dispatch(clientActions.sendUpdateClientStatus(newClient)).then(json => {
        if (json.success && json.id) {
          dispatch(clientActions.removeClientFromList(json.id, ...listArgs));
          dispatch(clientActions.returnClientListPromise(...routeUtils.listArgsFromObject({
              _firm: match.params.firmId
              , status: status
          }))).then(result => {
            if (result.success && result.list) {
              dispatch(clientActions.addClientToList(json.item, ...routeUtils.listArgsFromObject({
                _firm: match.params.firmId
                , status: status
              })));
            }
          });
        }
      });
    }
  }

  _toggleAlertModal() {
    this.setState({ showAlertModal: false });
  }

  render() {
    const {
      address  
      , client
      , primaryContact 
      , phoneNumber
      , staffClientList
      , userStore
      , handleSelectedClient
      , checked
      , newStaffClient
      , archived
    } = this.props; 

    const { singleClientDropDownOption, showAlertModal } = this.state;
    
    // const staffClients = staffClientList.filter(obj => obj._client == client._id)

    /**  README: since from bulk invite primary contact proceed to the process even primary email address is empty, 
    so I put in temporary email address 'hideme.ricblyz+@gmail.com', this temporary email should not display in user interface */
    return (
      <div className="table-row -file-item -option-pointer">
        <div className="table-cell">
          <CheckboxInput 
            name="client"
            value={checked}
            checked={checked} 
            change={() => handleSelectedClient(client._id)} />
        </div>
        <div className="table-cell">
          <div className="-options" onClick={() => this.setState({ singleClientDropDownOption: true })}>
            <div style={{position: "relative", height: "100%", width: "100%"}}>
              <CloseWrapper
                isOpen={singleClientDropDownOption}
                closeAction={this._handleCloseSingleClientOptions}
              />
              <i className="far fa-ellipsis-v"></i>
              <SingleClientOptions
                isOpen={singleClientDropDownOption}
                setStatus={this._setStatus}
                singleClient={true}
                archived={archived}
              />
            </div>
          </div>
        </div>
        <div className="table-cell">{archived ? client.name : (<Link to={`/firm/${client._firm}/clients/${client._id}`}>{client.name}</Link>)}</div>
        <div className="table-cell">{client.staffclients && client.staffclients[0] === null ? 0 : client.staffclients && client.staffclients.length}</div>
        <div className="table-cell">{client.contactFullName || <em>n/a</em>}</div>
        <div className="table-cell">{client.contactEmail || <em>n/a</em>}</div>
        <div className="table-cell">{phoneNumber && phoneNumber.number ? formatPhoneNumber(phoneNumber.number, 'National') ? formatPhoneNumber(phoneNumber.number, 'National') : phoneNumber.number : <em>n/a</em> }</div>
        <div className="table-cell">{client.address || <em>n/a</em>}</div>
        <AlertModal
          alertMessage={"This client cannot be reinstated because an active client with the same name already exists."}
          alertTitle={"Warning: Duplicate name"}
          closeAction={this._toggleAlertModal}
          confirmAction={() => this._setStatus("forced")}
          confirmText={"Okay"}
          // declineAction={this._toggleAlertModal}
          // declineText={"Cancel"}
          isOpen={this.state.showAlertModal}
          type={'danger'}
        >
        </AlertModal>
      </div>
    )
  }
}

PracticeClientSettingsListItem.propTypes = {
  address: PropTypes.object
  , client: PropTypes.object.isRequired
  , phoneNumber: PropTypes.object 
  , primaryContact: PropTypes.object 
}

PracticeClientSettingsListItem.defaultProps = {
  address: null 
  , phoneNumber: null
  , primaryContact: null 
}

const mapStoreToProps = (store) => {
  return {
    clientStore: store.client 
    , clientUserStore: store.clientUser 
    , loggedInUser: store.user.loggedIn.user
    , userStore: store.user 
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeClientSettingsListItem)
);
