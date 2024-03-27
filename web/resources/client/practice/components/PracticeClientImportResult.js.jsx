/**
 * Boilerplate code for a new Redux-connected view component.
 * Nice for copy/pasting
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, NavLink, Switch, withRouter } from 'react-router-dom';

// import form components
import { TextInput } from '../../../../global/components/forms';

// import third-party libraries
import _, { result } from 'lodash';
import classNames from 'classnames';
import { DateTime } from 'luxon';
const async = require('async')

// import actions
import * as clientActions from '../../../client/clientActions';
import * as clientUserActions from '../../../clientUser/clientUserActions';
import * as userActions from '../../../user/userActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import Breadcrumbs from '../../../../global/components/navigation/Breadcrumbs.js.jsx';
import CloseWrapper from '../../../../global/components/helpers/CloseWrapper.js.jsx';

// import firm components
import PracticeLayout from '../../../../global/practice/components/PracticeLayout.js.jsx';
import NewResourceOptions from './NewResourceOptions.js.jsx';

class PracticeClientImportResult extends Binder {
    constructor(props) {
        super(props);
        this.state = {
            dropDownMenu: false 
            , loading: false
            , action: ''
            , set: {
                status: false
                , disable: false
                , loading: false
            }
            , invite: {
                status: false
                , disable: false
                , loading: false
            }
            , createNew: {
                status: false
                , disable: false
                , loading: false
            }
            , reInstate: {
                status: false
                , disable: false
                , loading: false
            }
            , reName: {
                status: false
                , disable: false
                , loading: false
            }
            , reNameShowModal: false
            , client: null
            , reNameSubmit: false
        }
        this._bind(
            '_handleExistingClient'
            , '_handleClientNameChange'
            , '_handleSubmitClient'
            , '_handleInviteContact'
        )
    }

    _handleExistingClient() {
        const { dispatch, match, result } = this.props;
        const { notifSetting, uploadOnly } = this.props.bulkClientObj;
        const reInstate = _.cloneDeep(this.state.reInstate);
        let newClient = _.cloneDeep(result.client);
        reInstate.loading = true;
        this.setState({ reInstate });
        newClient.status = "visible";
        newClient.accountType = result.accountType;
        newClient.identifier = result.clientIdentifier;
        newClient.sN_upload = notifSetting.sN_upload;
        newClient.sN_viewed = notifSetting.sN_viewed;
        newClient.sN_downloaded = notifSetting.sN_downloaded;
        newClient.sN_sendMessage = notifSetting.sN_sendMessage;
        newClient.sN_leaveComment = notifSetting.sN_leaveComment;

        dispatch(clientActions.sendUpdateClient(newClient)).then(clientJson => {

  

            reInstate.loading = false;
            reInstate.disable = true;
            reInstate.status = clientJson.success;

            if (clientJson.success) {

                newClient = clientJson.item;
                newClient.renameSuccess = true;
                newClient.renameMessage = "Success reinstate";
                const newState = _.cloneDeep(this.state);
                newState.reInstate = reInstate;
                newState.client = newClient;
                newState.dropDownMenu = false;

                this._handleInviteContact(newState, newClient);
            } else {
                if (clientRes.item) {
                    newClient.renameSuccess = false;
                    newClient.renameMessage = "";
                    this.setState({ client: newClient, reInstate, dropDownMenu: false });
                } else {
                    newClient.renameSuccess = false;
                    newClient.renameMessage = "Failed to reinstate";
                    this.setState({ client: newClient, reInstate, dropDownMenu: false });
                }
            }
        });     
    }
    
    _handleClientNameChange(e) {
        let newState = _.update(this.state, e.target.name, () => {
            return e.target.value;
        });
        this.setState({ newState });
    }

    _handleSubmitClient() {
        const { dispatch, match, result } = this.props;
        const { notifSetting, uploadOnly } = this.props.bulkClientObj;

        this.setState({ reNameSubmit: true });

        let newClient = _.cloneDeep(this.state.client) ? _.cloneDeep(this.state.client) : {};
        const sendData = {
            name: newClient ? newClient.name.trim() : ""
            , _firm: match.params.firmId
            , accountType: result.accountType
            , identifier: result.clientIdentifier
            , sN_upload: notifSetting.sN_upload
            , sN_viewed: notifSetting.sN_viewed
            , sN_downloaded: notifSetting.sN_downloaded
            , sN_sendMessage: notifSetting.sN_sendMessage
            , sN_leaveComment: notifSetting.sN_leaveComment
        }

        dispatch(clientActions.sendCreateClient(sendData)).then(clientJson => {

            if(clientJson.success) {
                
                newClient = clientJson.item;
                newClient.renameSuccess = true;
                newClient.renameMessage = "New client created";
                const newState = _.cloneDeep(this.state);
                newState.client = newClient;
                newState.reNameShowModal = false;
                newState.dropDownMenu = false;
                
                this._handleInviteContact(newState, newClient);
            } else {
                if (clientRes.item) {
                    newClient.renameSuccess = false;
                    newClient.renameMessage = "Client name already exist";
                    this.setState({ client: newClient, reNameSubmit: false });
                } else {
                    newClient.renameSuccess = false;
                    newClient.renameMessage = "Failed to save";
                    this.setState({ client: newClient, reNameSubmit: false });
                }
            }
        });
    }

    _handleInviteContact(newState, client) {
        const { dispatch, match, result } = this.props;
        const { uploadOnly } = this.props.bulkClientObj;

        console.log("debug 1", newState, client)

        const invitations = [];
        result.primaryContact.map((contact) => {
            invitations.push({ email: contact.email, firstname: contact.firstname, lastname: contact.lastname, uploadOnly });
        });

        if (invitations.length) {

            // invite contact
            const contactSendData = {
                invitations
                , personalNote: '' 
                , firmId: match.params.firmId
                , uploadOnly
            }

            dispatch(clientUserActions.sendInviteClientUsers(client._id, contactSendData)).then(clientUserJson => {
                if (clientUserJson.success) {
                    dispatch(clientUserActions.invalidateList('_client', client._id));

                    // if new client created is null
                    if (!client._primaryContact) {
                        let updateClient = _.cloneDeep(client);
                        delete updateClient.renameMessage;
                        delete updateClient.renameSuccess;
                        updateClient._primaryContact = clientUserJson.data.results[0].user._id;
                        dispatch(clientActions.sendUpdateClient(updateClient)).then(json => {
                            this.setState(newState);
                        });
                    } else {
                        this.setState(newState);
                    }
                } else {
                    this.setState(newState);
                }
            }); 
        } else {
            this.setState(newState);
        }
    }

    render() {
        const {
            result
            , index
            , match 
            , userStore
            , bulkClientObj
        } = this.props;
        const { 
            action
            , loading
            , set
            , invite
            , createNew
            , reInstate
            , reName
            , reNameShowModal
            , reNameSubmit
            , client } = this.state;
        const users = userStore.selected.getItem();


        // 
        const ableToRename = result.action.includes("rename");
        const ableToCreate = result.action.includes("create"); // force to create
        const ableToReinstate = result.action.includes("reinstate");

        const setDisable = set.disable || invite.loading || reName.loading;
        const inviteDisable = invite.disable || set.loading || reName.loading;
        const reNameDisable = reName.disable || createNew.disable || reInstate.disable || createNew.loading || reInstate.loading;
        const createDisable = reName.disable || createNew.disable || reInstate.disable || reName.loading || reInstate.loading;
        const reinsateDisable = reName.disable || createNew.disable || reInstate.disable || createNew.loading || reName.loading;

        return (
            <tr key={'result_' + index} >
                <td className="-status-action">
                {
                    
                    result.action.length === 0 || client && client.renameSuccess ?
                        <i className="u-success fas fa-check"/>
                    : 
                        <div>
                            <i className="far fa-ellipsis-v" aria-hidden="true" onClick={() => this.setState({ dropDownMenu: true })}></i>
                            {
                                this.state.dropDownMenu ?
                                <span className="single-file-options">
                                    <div className="close-wrapper" onClick={() => this.setState({ dropDownMenu: false })}></div>
                                    <ul className="dropMenu -options-menu">
                                        {
                                            ableToRename ?
                                            <li className="-option" key={0}>
                                                <a className={reNameDisable ? '-disabled-link' : ''} disabled={reNameDisable} 
                                                onClick={() => this.setState({ reNameShowModal: true, client: result.client, dropDownMenu: false })}>
                                                    { 
                                                        reName.disable ? 
                                                        reName.status ? <i className="u-success fas fa-check"/> : null
                                                        : reName.loading ? <p className="loading"></p>: null
                                                    }
                                                    Rename Client Name
                                                </a>
                                            </li>  : null                                    
                                        }
                                        {/* {
                                            ableToCreate ?
                                            <li className="-option" key={1}>
                                                <a className={createDisable ? '-disabled-link' : ''} disabled={createDisable} onClick={this._handleRenameShowModal}>
                                                    { 
                                                        createNew.disable ? 
                                                        createNew.status ? <i className="u-success fas fa-check"/> : null
                                                        : createNew.loading ? <p className="loading"></p>: null
                                                    }
                                                    Create New Client
                                                </a>
                                            </li> : null
                                        } */}
                                        {
                                            ableToReinstate ?
                                            <li className="-option" key={2}>
                                                <a className={reinsateDisable ? '-disabled-link' : ''} disabled={reinsateDisable} onClick={this._handleExistingClient}>
                                                    { 
                                                        reInstate.disable ? 
                                                        reInstate.status ? <i className="u-success fas fa-check"/> : null
                                                        : reInstate.loading ? <p className="loading"></p>: null
                                                    }
                                                    Reinstate Existing Client
                                                </a>
                                            </li> : null
                                        }
                                    </ul>             
                                </span> : null
                            }
                        </div>
                }  
                </td>
                <td>{result.clientIdentifier}</td>
                <td>
                    { reNameShowModal ? 

                        // update client name
                        <div className="-rename-upload-field-container">
                            <TextInput
                                disabled={reNameSubmit}
                                change={this._handleClientNameChange}
                                name="client.name"
                                value={client ? client.name : result.clientName}
                                helpText={client ? client.renameMessage : ""}
                            />
                            <button className="yt-btn x-small link" 
                                disabled={reNameSubmit}
                                onClick={() => this.setState({ reNameShowModal: false })}>cancel</button>
                            <button className="yt-btn x-small success"
                                disabled={(client.name ? client.name.trim() === result.clientName.trim() : true) || reNameSubmit}
                                onClick={this._handleSubmitClient}
                                >upload</button>
                        </div> : 
                        
                        // change client after success update client name
                        client && client.renameSuccess ? client.name : result.clientName
                    }
                </td>
                <td>{result.engagementTypes[0]}</td>
                <td>
                    <p>{!result.street1 && !result.city && !result.state && !result.postal && !result.country  ? "-" : `${result.street1} ${result.city} ${result.state} ${result.postal} ${result.country}`}</p>
                </td>
                <td>
                    <p>{!result.number ? "-" : `${result.number}`}</p>
                </td>
                <td>
                    {result.primaryContact.map((contact, j) => 
                        <p key={j}>{!contact.firstname && !contact.lastname ? "-" : `${contact.firstname} ${contact.lastname}`}</p>
                    )}
                </td>
                <td>
                    {result.primaryContact.map((contact, j) => 
                        <p key={j}>{contact.email || "-"}</p>
                    )}
                </td>
                <td>
                    {
                        // change result message after success update client name
                        client && client.renameSuccess ? client.renameMessage : result.result_message
                    }
                </td>
                <td>
                    {
                        // remove error message after success update client name
                        client && client.renameSuccess ? "" : result.error_message //  
                    }
                </td>
            </tr>
        )    
    }
}

PracticeClientImportResult.propTypes = {
    dispatch: PropTypes.func.isRequired
    , result: PropTypes.object
}

PracticeClientImportResult.defaultProps = {

}


const mapStoreToProps = (store) => {
    /**
     * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
     * differentiated from the React component's internal state
     */
    return {
        addressStore: store.address 
        , userStore: store.user
    }
}

export default withRouter(
    connect(
        mapStoreToProps
    )(PracticeClientImportResult)
);
